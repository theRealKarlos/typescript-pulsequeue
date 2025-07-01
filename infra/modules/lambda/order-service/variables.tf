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
  description = "The environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "inventory_table_arn" {
  description = "ARN of the DynamoDB inventory table"
  type        = string
}
