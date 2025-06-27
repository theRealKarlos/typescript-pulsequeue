// modules/lambda/order-service/variables.tf

variable "lambda_zip_path" {
  type        = string
  description = "Path to the compiled Lambda ZIP file"
}

variable "function_name" {
  type        = string
  description = "Name of the Lambda function"
}

variable "environment" {
  type        = string
  description = "Deployment environment name (e.g. dev, staging, prod)"
}
