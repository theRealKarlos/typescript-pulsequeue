// modules/lambda/order-service/variables.tf

variable "lambda_zip_path" {
  description = "Path to the compiled Lambda ZIP file"
  type        = string
}

variable "function_basename" {
  description = "Base name for the Lambda function (without environment prefix)"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "inventory_table_arn" {
  description = "ARN of the DynamoDB inventory table (optional)"
  type        = string
  default     = null
}

variable "runtime" {
  description = "Lambda runtime"
  type        = string
}

variable "handler" {
  description = "Lambda handler"
  type        = string
}

variable "environment_variables" {
  description = "Environment variables for the Lambda function"
  type        = map(string)
  default     = {}
}

variable "tags" {
  description = "Tags to apply to the Lambda function"
  type        = map(string)
  default     = {}
}
