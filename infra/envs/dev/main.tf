# Configure AWS provider
provider "aws" {
  region = var.region
}

# Create the custom EventBridge bus
module "eventbridge_bus" {
  source   = "../../modules/eventbridge/bus"
  bus_name = "pulsequeue-bus"
}

# Deploy the Lambda function using the custom module
module "order_service" {
  source          = "../../modules/lambda/order-service"
  lambda_zip_path = abspath("${path.module}/../../../dist/order-service.zip")
  function_name   = "order-service-handler"
  environment     = "dev"
}

# Attach the OrderPlaced rule to the Lambda
module "eventbridge_order_placed" {
  source      = "../../modules/eventbridge/rule"
  environment = "dev"
  bus_name    = module.eventbridge_bus.bus_name
  lambda_arn  = module.order_service.lambda_arn
  region      = var.region
}

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
