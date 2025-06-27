//Create the lambda function
resource "aws_lambda_function" "order_handler" {
  function_name = "order-service-handler"
  handler       = "handler.handler"
  runtime       = "nodejs18.x"
  filename      = var.lambda_zip_path
  role          = aws_iam_role.lambda_exec.arn
}
