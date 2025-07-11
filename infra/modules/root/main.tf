# ============================================================================
# SHARED ROOT MODULE - ENVIRONMENT-AGNOSTIC INFRASTRUCTURE
# ============================================================================
#
# This module contains all the common infrastructure configuration that is
# shared across all environments (dev, staging, prod). Environment-specific
# values are passed via variables, making this truly environment-agnostic.
#
# USAGE:
#   module "infrastructure" {
#     source = "../../modules/root"
#     
#     # Environment configuration
#     environment = var.environment
#     region      = var.region
#     
#     # Lambda configuration
#     lambda_runtime = var.lambda_runtime
#     lambda_handler = var.lambda_handler
#     lambda_timeout = var.lambda_timeout
#     lambda_memory_size = var.lambda_memory_size
#     enable_xray_tracing = var.enable_xray_tracing
#     
#     # Security configuration
#     enable_encryption_at_rest = var.enable_encryption_at_rest
#     enable_point_in_time_recovery = var.enable_point_in_time_recovery
#     
#     # Monitoring configuration
#     grafana_admin_password = var.grafana_admin_password
#     prometheus_config = var.prometheus_config
#     dashboard_body_template = var.dashboard_body_template
#   }
# ============================================================================

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
  source       = "../vpc"
  environment  = var.environment
  vpc_basename = "pulsequeue-vpc"
  tags         = local.tags
}

# ============================================================================
# EVENTBRIDGE INFRASTRUCTURE
# ============================================================================

module "order_eventbridge_bus" {
  source      = "../eventbridge/bus"
  environment = var.environment
  bus_name    = "order-bus"
  tags        = local.tags
}

module "payment_eventbridge_bus" {
  source      = "../eventbridge/bus"
  environment = var.environment
  bus_name    = "payment-bus"
  tags        = local.tags
}

# ============================================================================
# LAMBDA FUNCTION DEPLOYMENT
# ============================================================================

module "order_service" {
  source              = "../lambda/lambda-function"
  lambda_zip_path     = local.lambda_zip_paths.order_service
  function_basename   = "order-service-handler"
  environment         = var.environment
  runtime             = var.lambda_runtime
  handler             = var.lambda_handler
  timeout             = var.lambda_timeout
  memory_size         = var.lambda_memory_size
  enable_xray_tracing = var.enable_xray_tracing
  environment_variables = {
    ENVIRONMENT                  = var.environment
    INVENTORY_TABLE_NAME         = module.inventory_table.table_name
    PAYMENT_EVENTBRIDGE_BUS_NAME = module.payment_eventbridge_bus.bus_name
  }
  tags = local.tags
}

module "payment_service" {
  source              = "../lambda/lambda-function"
  lambda_zip_path     = local.lambda_zip_paths.payment_service
  function_basename   = "payment-service-handler"
  environment         = var.environment
  runtime             = var.lambda_runtime
  handler             = var.lambda_handler
  timeout             = var.lambda_timeout
  memory_size         = var.lambda_memory_size
  enable_xray_tracing = var.enable_xray_tracing
  environment_variables = {
    ENVIRONMENT          = var.environment
    INVENTORY_TABLE_NAME = module.inventory_table.table_name
  }
  tags = local.tags
}

module "metrics_service" {
  source              = "../lambda/lambda-function"
  lambda_zip_path     = local.lambda_zip_paths.metrics_service
  function_basename   = "metrics-service-handler"
  environment         = var.environment
  runtime             = var.lambda_runtime
  handler             = var.lambda_handler
  timeout             = var.lambda_timeout
  memory_size         = var.lambda_memory_size
  enable_xray_tracing = var.enable_xray_tracing
  tags                = local.tags
}

module "metrics_api_gateway" {
  source               = "../api-gateway"
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

module "order_service_dynamodb_policy" {
  source             = "../lambda/dynamodb-policy"
  environment        = var.environment
  function_basename  = module.order_service.lambda_name
  lambda_role_id     = module.order_service.lambda_role_id
  dynamodb_table_arn = module.inventory_table.table_arn
}

module "payment_service_dynamodb_policy" {
  source             = "../lambda/dynamodb-policy"
  environment        = var.environment
  function_basename  = module.payment_service.lambda_name
  lambda_role_id     = module.payment_service.lambda_role_id
  dynamodb_table_arn = module.inventory_table.table_arn
}

# ============================================================================
# EVENTBRIDGE RULE CONFIGURATION
# ============================================================================

module "eventbridge_order_placed" {
  source            = "../eventbridge/rule"
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
  source            = "../eventbridge/rule"
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
  source                        = "../dynamodb/table"
  environment                   = var.environment
  table_basename                = "inventory-table"
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
  source                 = "../monitoring"
  environment            = var.environment
  monitoring_basename    = "pulsequeue-monitoring"
  vpc_id                 = module.vpc.vpc_id
  public_subnet_ids      = module.vpc.public_subnet_ids
  prometheus_config      = var.prometheus_config
  grafana_admin_password = var.grafana_admin_password
  metrics_api_url        = module.metrics_api_gateway.api_gateway_url
  tags                   = local.tags
}

# ============================================================================
# CLOUDWATCH DASHBOARD
# ============================================================================

module "cloudwatch_dashboard" {
  source             = "../cloudwatch/dashboard"
  environment        = var.environment
  dashboard_basename = "pulsequeue-dashboard"
  dashboard_body     = local.dashboard_body_processed
}

# ============================================================================
# LOCALS
# ============================================================================

locals {
  lambda_zip_base = abspath("${path.module}/../../../dist/${var.environment}")

  lambda_zip_paths = {
    order_service   = "${local.lambda_zip_base}/order-service.zip"
    payment_service = "${local.lambda_zip_base}/payment-service.zip"
    metrics_service = "${local.lambda_zip_base}/metrics-service.zip"
  }

  tags = {
    Environment = var.environment
    Project     = "PulseQueue"
    ManagedBy   = "Terraform"
  }

  # Process the dashboard template by replacing placeholders with actual values
  dashboard_body_processed = replace(
    replace(var.dashboard_body_template, "$${environment}", var.environment),
    "$${region}", var.region
  )
}

