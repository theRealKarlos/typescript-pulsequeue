# ============================================================================
# AWS PROVIDER CONFIGURATION
# ============================================================================

provider "aws" {
  region = var.region
}

# ============================================================================
# EVENTBRIDGE INFRASTRUCTURE
# ============================================================================

module "eventbridge_bus" {
  source      = "../../modules/eventbridge/bus"
  environment = var.environment
}

# ============================================================================
# LAMBDA FUNCTION DEPLOYMENT
# ============================================================================

module "order_service" {
  source          = "../../modules/lambda/order-service"
  lambda_zip_path = abspath("${path.module}/../../../dist/order-service.zip")
  function_name   = "${var.environment}-order-service-handler"
  environment     = var.environment
}

# ============================================================================
# EVENTBRIDGE RULE CONFIGURATION
# ============================================================================

module "eventbridge_order_placed" {
  source      = "../../modules/eventbridge/rule"
  environment = var.environment
  bus_name    = module.eventbridge_bus.bus_name
  lambda_arn  = module.order_service.lambda_arn
  region      = var.region
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

output "eventbridge_bus_name" {
  value = module.eventbridge_bus.bus_name
}

output "order_placed_rule_name" {
  value = module.eventbridge_order_placed.rule_name
}

output "order_placed_rule_arn" {
  value = module.eventbridge_order_placed.rule_arn
}
