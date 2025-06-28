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
# API GATEWAY INFRASTRUCTURE
# ============================================================================

module "api_gateway" {
  source         = "../../modules/api-gateway"
  environment    = var.environment
  event_bus_name = module.eventbridge_bus.bus_name
  event_bus_arn  = module.eventbridge_bus.bus_arn
}

# ============================================================================
# API GATEWAY LOGGING SETUP
# ============================================================================

resource "aws_iam_role" "apigw_cloudwatch_logs" {
  name = "apigateway-cloudwatch-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "apigw_cloudwatch_logs" {
  role       = aws_iam_role.apigw_cloudwatch_logs.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

resource "aws_api_gateway_account" "account" {
  cloudwatch_role_arn = aws_iam_role.apigw_cloudwatch_logs.arn
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

output "api_gateway_url" {
  value       = module.api_gateway.api_gateway_url
  description = "URL for placing orders via API Gateway"
}
