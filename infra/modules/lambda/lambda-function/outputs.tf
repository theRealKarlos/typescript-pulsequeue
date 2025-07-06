# ============================================================================
# LAMBDA MODULE OUTPUTS
# ============================================================================

output "lambda_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.this.arn
}

output "lambda_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.this.function_name
}

output "lambda_invoke_arn" {
  description = "Invoke ARN of the Lambda function"
  value       = aws_lambda_function.this.invoke_arn
}

output "lambda_role_id" {
  description = "ID of the Lambda execution role (for external policy attachments)"
  value       = aws_iam_role.lambda_exec.id
}
