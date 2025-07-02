// modules/lambda/order-service/variables.tf

variable "lambda_zip_path" {
  type        = string
  description = "Path to the compiled Lambda ZIP file"
}

variable "function_basename" {
  type        = string
  description = "Base name for the Lambda function (without environment prefix)"
}

variable "environment" {
  description = "The environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "inventory_table_arn" {
  description = "ARN of the DynamoDB inventory table"
  type        = string
}

variable "runtime" {
  description = "The Lambda runtime"
  type        = string
}

variable "handler" {
  description = "The Lambda handler"
  type        = string
}
