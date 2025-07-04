# ============================================================================
# LAMBDA FUNCTION
# ============================================================================

resource "aws_lambda_function" "this" {
  function_name = "${var.environment}-${var.function_basename}"
  handler       = var.handler
  runtime       = var.runtime
  filename      = var.lambda_zip_path
  role          = aws_iam_role.lambda_exec.arn

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
  tags = var.tags
}
