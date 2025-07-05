# ============================================================================
# API GATEWAY MODULE
# ----------------------------------------------------------------------------
# Creates API Gateway with Lambda integration
# Supports REST API with custom domain and staging
# ============================================================================

# ============================================================================
# API GATEWAY REST API
# ============================================================================

resource "aws_api_gateway_rest_api" "this" {
  name = "${var.environment}-${var.api_basename}"

  tags = var.tags
}

# ============================================================================
# API GATEWAY RESOURCE
# ============================================================================

resource "aws_api_gateway_resource" "this" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id
  path_part   = var.resource_path
}

# ============================================================================
# API GATEWAY METHOD
# ============================================================================

resource "aws_api_gateway_method" "this" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.this.id
  http_method   = var.http_method
  authorization = var.authorization_type
}

# ============================================================================
# API GATEWAY INTEGRATION
# ============================================================================

resource "aws_api_gateway_integration" "this" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.this.id
  http_method = aws_api_gateway_method.this.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.lambda_invoke_arn
}

# ============================================================================
# LAMBDA PERMISSION
# ============================================================================

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

# ============================================================================
# API GATEWAY DEPLOYMENT
# ============================================================================

resource "aws_api_gateway_deployment" "this" {
  rest_api_id = aws_api_gateway_rest_api.this.id

  depends_on = [
    aws_api_gateway_integration.this,
  ]

  lifecycle {
    create_before_destroy = true
  }
}

# ============================================================================
# API GATEWAY STAGE
# ============================================================================

resource "aws_api_gateway_stage" "this" {
  deployment_id = aws_api_gateway_deployment.this.id
  rest_api_id   = aws_api_gateway_rest_api.this.id
  stage_name    = var.environment

  tags = var.tags
} 
