output "zip_path" {
  value = var.lambda_zip_path
}
output "lambda_arn" {
  value = aws_lambda_function.order_handler.arn
}

output "function_name" {
  value = aws_lambda_function.order_handler.function_name
}
