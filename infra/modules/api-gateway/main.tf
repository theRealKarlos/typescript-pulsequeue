# ============================================================================
# API GATEWAY
# ============================================================================

resource "aws_api_gateway_rest_api" "orders_api" {
  name        = "${var.environment}-orders-api"
  description = "API Gateway for order placement"
}

# ============================================================================
# API GATEWAY RESOURCES
# ============================================================================

resource "aws_api_gateway_resource" "orders" {
  rest_api_id = aws_api_gateway_rest_api.orders_api.id
  parent_id   = aws_api_gateway_rest_api.orders_api.root_resource_id
  path_part   = "orders"
}

# ============================================================================
# API GATEWAY METHODS
# ============================================================================

resource "aws_api_gateway_method" "post_orders" {
  rest_api_id   = aws_api_gateway_rest_api.orders_api.id
  resource_id   = aws_api_gateway_resource.orders.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "options_orders" {
  rest_api_id   = aws_api_gateway_rest_api.orders_api.id
  resource_id   = aws_api_gateway_resource.orders.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# ============================================================================
# API GATEWAY INTEGRATION
# ============================================================================

resource "aws_api_gateway_integration" "eventbridge_integration" {
  rest_api_id = aws_api_gateway_rest_api.orders_api.id
  resource_id = aws_api_gateway_resource.orders.id
  http_method = aws_api_gateway_method.post_orders.http_method

  type                    = "AWS"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${data.aws_region.current.name}:events:path//"

  credentials = aws_iam_role.api_gateway_execution_role.arn

  request_templates = {
    "application/json" = jsonencode({
      Source       = var.event_source
      DetailType   = var.event_detail_type
      EventBusName = var.event_bus_name
      Detail       = "$util.escapeJavaScript($input.json('$'))"
    })
  }

  passthrough_behavior = "WHEN_NO_MATCH"
  content_handling     = "CONVERT_TO_TEXT"
}

resource "aws_api_gateway_integration" "options_integration" {
  rest_api_id = aws_api_gateway_rest_api.orders_api.id
  resource_id = aws_api_gateway_resource.orders.id
  http_method = aws_api_gateway_method.options_orders.http_method

  type = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

# ============================================================================
# API GATEWAY DEPLOYMENT
# ============================================================================

resource "aws_api_gateway_stage" "orders_api_stage" {
  deployment_id = aws_api_gateway_deployment.orders_api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.orders_api.id
  stage_name    = var.environment
}

resource "aws_api_gateway_deployment" "orders_api_deployment" {
  depends_on = [
    aws_api_gateway_integration.eventbridge_integration,
    aws_api_gateway_integration.options_integration,
    aws_api_gateway_integration_response.post_200,
    aws_api_gateway_integration_response.options_200
  ]

  rest_api_id = aws_api_gateway_rest_api.orders_api.id

  # Force redeployment when CORS changes
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_method.post_orders.id,
      aws_api_gateway_method.options_orders.id,
      aws_api_gateway_integration.eventbridge_integration.id,
      aws_api_gateway_integration.options_integration.id
    ]))
  }
}

# ============================================================================
# IAM ROLE FOR API GATEWAY
# ============================================================================

resource "aws_iam_role" "api_gateway_execution_role" {
  name = "${var.environment}-api-gateway-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "api_gateway_eventbridge_policy" {
  name = "${var.environment}-api-gateway-eventbridge-policy"
  role = aws_iam_role.api_gateway_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "events:PutEvents"
        ]
        Resource = [
          var.event_bus_arn
        ]
      }
    ]
  })
}

# ============================================================================
# DATA SOURCES
# ============================================================================

data "aws_region" "current" {}

# ============================================================================
# OUTPUTS
# ============================================================================

output "api_gateway_url" {
  value       = "${aws_api_gateway_stage.orders_api_stage.invoke_url}/orders"
  description = "URL for the orders API endpoint"
}

output "api_gateway_id" {
  value       = aws_api_gateway_rest_api.orders_api.id
  description = "API Gateway ID"
}

# ============================================================================
# API GATEWAY METHOD RESPONSES
# ============================================================================

resource "aws_api_gateway_method_response" "post_200" {
  rest_api_id = aws_api_gateway_rest_api.orders_api.id
  resource_id = aws_api_gateway_resource.orders.id
  http_method = aws_api_gateway_method.post_orders.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_method_response" "options_200" {
  rest_api_id = aws_api_gateway_rest_api.orders_api.id
  resource_id = aws_api_gateway_resource.orders.id
  http_method = aws_api_gateway_method.options_orders.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

# ============================================================================
# API GATEWAY INTEGRATION RESPONSES
# ============================================================================

resource "aws_api_gateway_integration_response" "post_200" {
  rest_api_id = aws_api_gateway_rest_api.orders_api.id
  resource_id = aws_api_gateway_resource.orders.id
  http_method = aws_api_gateway_method.post_orders.http_method
  status_code = aws_api_gateway_method_response.post_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
  }
}

resource "aws_api_gateway_integration_response" "options_200" {
  rest_api_id = aws_api_gateway_rest_api.orders_api.id
  resource_id = aws_api_gateway_resource.orders.id
  http_method = aws_api_gateway_method.options_orders.http_method
  status_code = aws_api_gateway_method_response.options_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
  }
}
