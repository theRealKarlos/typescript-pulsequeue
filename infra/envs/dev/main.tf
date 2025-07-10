# ============================================================================
# AWS PROVIDER CONFIGURATION
# ============================================================================

provider "aws" {
  region = var.region
}

# ============================================================================
# VPC INFRASTRUCTURE
# ============================================================================

module "vpc" {
  source       = "../../modules/vpc"
  environment  = var.environment
  vpc_basename = "pulsequeue-vpc"
  tags         = local.tags
}

# ============================================================================
# EVENTBRIDGE INFRASTRUCTURE
# ============================================================================

module "order_eventbridge_bus" {
  source      = "../../modules/eventbridge/bus"
  environment = var.environment
  bus_name    = "order-bus"
  tags        = local.tags
}

module "payment_eventbridge_bus" {
  source      = "../../modules/eventbridge/bus"
  environment = var.environment
  bus_name    = "payment-bus"
  tags        = local.tags
}

# ============================================================================
# LAMBDA FUNCTION DEPLOYMENT
# ============================================================================

module "order_service" {
  source              = "../../modules/lambda/lambda-function"
  lambda_zip_path     = abspath("${path.module}/../../../dist/order-service.zip")
  function_basename   = "order-service-handler"
  environment         = var.environment
  runtime             = var.lambda_runtime
  handler             = var.lambda_handler
  timeout             = var.lambda_timeout
  memory_size         = var.lambda_memory_size
  enable_xray_tracing = var.enable_xray_tracing
  # NOTE: inventory_table_arn removed - DynamoDB policies handled separately
  environment_variables = {
    ENVIRONMENT                  = var.environment
    INVENTORY_TABLE_NAME         = module.inventory_table.table_name
    PAYMENT_EVENTBRIDGE_BUS_NAME = module.payment_eventbridge_bus.bus_name
  }
  tags = local.tags
}

module "payment_service" {
  source              = "../../modules/lambda/lambda-function"
  lambda_zip_path     = abspath("${path.module}/../../../dist/payment-service.zip")
  function_basename   = "payment-service-handler"
  environment         = var.environment
  runtime             = var.lambda_runtime
  handler             = var.lambda_handler
  timeout             = var.lambda_timeout
  memory_size         = var.lambda_memory_size
  enable_xray_tracing = var.enable_xray_tracing
  # NOTE: inventory_table_arn removed - DynamoDB policies handled separately
  environment_variables = {
    ENVIRONMENT          = var.environment
    INVENTORY_TABLE_NAME = module.inventory_table.table_name
  }
  tags = local.tags
}

module "metrics_service" {
  source              = "../../modules/lambda/lambda-function"
  lambda_zip_path     = abspath("${path.module}/../../../dist/metrics-service.zip")
  function_basename   = "metrics-service-handler"
  environment         = var.environment
  runtime             = var.lambda_runtime
  handler             = var.lambda_handler
  timeout             = var.lambda_timeout
  memory_size         = var.lambda_memory_size
  enable_xray_tracing = var.enable_xray_tracing
  # NOTE: No inventory_table_arn - Metrics service doesn't need DynamoDB access
  tags = local.tags
}

module "metrics_api_gateway" {
  source               = "../../modules/api-gateway"
  environment          = var.environment
  api_basename         = "metrics-api"
  resource_path        = "metrics"
  http_method          = "GET"
  lambda_invoke_arn    = module.metrics_service.lambda_invoke_arn
  lambda_function_name = module.metrics_service.lambda_name
  tags                 = local.tags
}

# ============================================================================
# DYNAMODB POLICIES FOR LAMBDA FUNCTIONS
# ============================================================================
# 
# NOTE: These policies are created using a dedicated module to avoid
# circular dependencies with computed values (DynamoDB table ARN).
#
# PROBLEM: When DynamoDB policies are created inside the Lambda module with:
# count = var.inventory_table_arn != "" ? 1 : 0
# Terraform cannot determine the count during planning because the table ARN
# is only known after the DynamoDB table is created.
#
# SOLUTION: Use dedicated DynamoDB policy module after both DynamoDB table 
# and Lambda functions are created, allowing us to reference the known table ARN.
#
# DEPENDENCY ORDER:
# 1. DynamoDB table (module.inventory_table) - creates table_arn
# 2. Lambda functions (module.order_service, module.payment_service) - creates IAM roles
# 3. DynamoDB policies (below) - references both table_arn and role IDs
# ============================================================================

# Order service DynamoDB policy
module "order_service_dynamodb_policy" {
  source             = "../../modules/lambda/dynamodb-policy"
  environment        = var.environment
  function_basename  = module.order_service.lambda_name
  lambda_role_id     = module.order_service.lambda_role_id
  dynamodb_table_arn = module.inventory_table.table_arn
}

# Payment service DynamoDB policy
module "payment_service_dynamodb_policy" {
  source             = "../../modules/lambda/dynamodb-policy"
  environment        = var.environment
  function_basename  = module.payment_service.lambda_name
  lambda_role_id     = module.payment_service.lambda_role_id
  dynamodb_table_arn = module.inventory_table.table_arn
}

# ============================================================================
# EVENTBRIDGE RULE CONFIGURATION
# ============================================================================

module "eventbridge_order_placed" {
  source            = "../../modules/eventbridge/rule"
  environment       = var.environment
  bus_name          = module.order_eventbridge_bus.bus_name
  lambda_arn        = module.order_service.lambda_arn
  region            = var.region
  rule_name         = "order-placed"
  target_id_suffix  = "handler"
  event_source      = "order.service"
  event_detail_type = "OrderPlaced"
  tags              = local.tags
}

module "eventbridge_payment_processed" {
  source            = "../../modules/eventbridge/rule"
  environment       = var.environment
  bus_name          = module.payment_eventbridge_bus.bus_name
  lambda_arn        = module.payment_service.lambda_arn
  region            = var.region
  rule_name         = "payment-processed"
  target_id_suffix  = "handler"
  event_source      = "payment.service"
  event_detail_type = "PaymentRequested"
  tags              = local.tags
}

# ============================================================================
# INVENTORY TABLE
# ============================================================================

module "inventory_table" {
  source                        = "../../modules/dynamodb/table"
  environment                   = var.environment
  table_basename                = "inventory"
  hash_key                      = "item_id"
  enable_encryption_at_rest     = var.enable_encryption_at_rest
  enable_point_in_time_recovery = var.enable_point_in_time_recovery
  attributes = [
    { name = "item_id", type = "S" }
  ]
}

# ============================================================================
# UNIFIED MONITORING INFRASTRUCTURE
# ============================================================================

module "monitoring" {
  source                 = "../../modules/monitoring"
  environment            = var.environment
  monitoring_basename    = "pulsequeue-monitoring"
  vpc_id                 = module.vpc.vpc_id
  public_subnet_ids      = module.vpc.public_subnet_ids
  prometheus_config      = file("${path.module}/prometheus-config.yml")
  grafana_admin_password = var.grafana_admin_password
  metrics_api_url        = module.metrics_api_gateway.api_gateway_url
  tags                   = local.tags
}

# ============================================================================
# CLOUDWATCH DASHBOARD
# ============================================================================

module "cloudwatch_dashboard" {
  source             = "../../modules/cloudwatch/dashboard"
  environment        = var.environment
  dashboard_basename = "pulsequeue-dashboard"
  dashboard_body     = file("${path.module}/dashboard-body.json")
}

# ============================================================================
# LOCALS
# ============================================================================

locals {
  tags = {
    Environment = var.environment
    Project     = "PulseQueue"
    ManagedBy   = "Terraform"
  }
}
