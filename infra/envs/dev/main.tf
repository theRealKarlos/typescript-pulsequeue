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
  inventory_table_arn = module.inventory_table.table_arn
  environment_variables = {
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
  inventory_table_arn = module.inventory_table.table_arn
  environment_variables = {
    INVENTORY_TABLE_NAME = module.inventory_table.table_name
  }
  tags = local.tags
}

module "metrics_service" {
  source            = "../../modules/lambda/lambda-function"
  lambda_zip_path   = abspath("${path.module}/../../../dist/metrics-service.zip")
  function_basename = "metrics-service-handler"
  environment       = var.environment
  runtime           = var.lambda_runtime
  handler           = var.lambda_handler
  tags              = local.tags
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
  source         = "../../modules/dynamodb/table"
  environment    = var.environment
  table_basename = "inventory"
  hash_key       = "item_id"
  attributes = [
    { name = "item_id", type = "S" }
  ]
  tags = local.tags
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
