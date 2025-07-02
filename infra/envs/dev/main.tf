# ============================================================================
# AWS PROVIDER CONFIGURATION
# ============================================================================

provider "aws" {
  region = var.region
}

# ============================================================================
# EVENTBRIDGE INFRASTRUCTURE
# ============================================================================

module "order_eventbridge_bus" {
  source      = "../../modules/eventbridge/bus"
  environment = var.environment
  bus_name    = "order-bus"
}

module "payment_eventbridge_bus" {
  source      = "../../modules/eventbridge/bus"
  environment = var.environment
  bus_name    = "payment-bus"
}

# ============================================================================
# LAMBDA FUNCTION DEPLOYMENT
# ============================================================================

module "order_service" {
  source              = "../../modules/lambda/lambda-function"
  lambda_zip_path     = abspath("${path.module}/../../../dist/order-service.zip")
  function_basename   = "order-service-handler"
  environment         = var.environment
  inventory_table_arn = module.inventory_table.table_arn
  runtime             = var.lambda_runtime
  handler             = var.lambda_handler
}

# ============================================================================
# EVENTBRIDGE RULE CONFIGURATION
# ============================================================================

module "eventbridge_order_placed" {
  source           = "../../modules/eventbridge/rule"
  environment      = var.environment
  bus_name         = module.order_eventbridge_bus.bus_name
  lambda_arn       = module.order_service.lambda_arn
  region           = var.region
  rule_name        = "order-placed"
  target_id_suffix = "handler"
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
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "lambda_function_name" {
  value = module.order_service.function_name
}

output "lambda_function_arn" {
  value = module.order_service.lambda_arn
}

output "order_placed_rule_name" {
  value = module.eventbridge_order_placed.rule_name
}

output "order_placed_rule_arn" {
  value = module.eventbridge_order_placed.rule_arn
}

output "inventory_table_name" {
  value = module.inventory_table.table_name
}

output "inventory_table_arn" {
  value = module.inventory_table.table_arn
}
