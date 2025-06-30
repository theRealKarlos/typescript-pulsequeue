# ============================================================================
# LAMBDA FUNCTION
# ============================================================================

resource "aws_lambda_function" "order_handler" {
  function_name = "${var.environment}-order-service-handler"
  handler       = "handler.handler"
  runtime       = "nodejs22.x"
  filename      = var.lambda_zip_path
  role          = aws_iam_role.lambda_exec.arn

  # The source_code_hash is used to force updates to the Lambda function
  # whenever the deployment package changes. Terraform will detect changes
  # in the zip file and trigger a redeployment of the function.
  source_code_hash = filebase64sha256(var.lambda_zip_path)
}
