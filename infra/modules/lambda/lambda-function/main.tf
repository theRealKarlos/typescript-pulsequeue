# ============================================================================
# LAMBDA FUNCTION
# ============================================================================

resource "aws_lambda_function" "this" {
  function_name = "${var.environment}-${var.function_basename}"
  handler       = var.handler
  runtime       = var.runtime
  filename      = var.lambda_zip_path
  role          = aws_iam_role.lambda_exec.arn

  # Performance and security configuration
  timeout     = var.timeout
  memory_size = var.memory_size

  # The source_code_hash is used to force updates to the Lambda function
  # whenever the deployment package changes. Terraform will detect changes
  # in the zip file and trigger a redeployment of the function.
  source_code_hash = filebase64sha256(var.lambda_zip_path)

  # Environment variables passed to the Lambda function. These are set via the
  # environment_variables map variable, allowing you to inject configuration such
  # as table names, ARNs, or other settings needed by the function at runtime.
  environment {
    variables = var.environment_variables
  }

  # Enable X-Ray tracing for distributed tracing
  tracing_config {
    mode = var.enable_xray_tracing ? "Active" : "PassThrough"
  }

  # Enable function URL for direct HTTP access (if needed)
  dynamic "function_url" {
    for_each = var.enable_function_url ? [1] : []
    content {
      authorization_type = "NONE"
      cors {
        allow_credentials = false
        allow_origins     = ["*"]
        allow_methods     = ["*"]
        allow_headers     = ["*"]
        expose_headers    = ["*"]
        max_age           = 86400
      }
    }
  }

  tags = var.tags
}

# ============================================================================
# LAMBDA FUNCTION URL (CONDITIONAL)
# ============================================================================

resource "aws_lambda_function_url" "this" {
  count              = var.enable_function_url ? 1 : 0
  function_name      = aws_lambda_function.this.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = false
    allow_origins     = ["*"]
    allow_methods     = ["*"]
    allow_headers     = ["*"]
    expose_headers    = ["*"]
    max_age           = 86400
  }
}
