# ============================================================================
# LAMBDA FUNCTION
# ============================================================================

resource "aws_lambda_function" "api_proxy" {
  filename      = var.lambda_zip_path
  function_name = var.function_name
  role          = aws_iam_role.lambda_exec.arn
  handler       = "api-proxy.handler"
  runtime       = "nodejs18.x"
  timeout       = 30

  environment {
    variables = {
      EVENT_BUS_NAME = var.event_bus_name
    }
  }
}

# ============================================================================
# IAM ROLE
# ============================================================================

resource "aws_iam_role" "lambda_exec" {
  name = "${var.environment}-api-proxy-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# ============================================================================
# IAM POLICIES
# ============================================================================

resource "aws_iam_role_policy" "lambda_logging" {
  name = "${var.environment}-api-proxy-logging"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_eventbridge_policy" {
  name = "${var.environment}-api-proxy-eventbridge"
  role = aws_iam_role.lambda_exec.id

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
# OUTPUTS
# ============================================================================

output "function_name" {
  value = aws_lambda_function.api_proxy.function_name
}

output "lambda_arn" {
  value = aws_lambda_function.api_proxy.arn
}
