# ============================================================================
# DYNAMODB POLICY MODULE VARIABLES
# ============================================================================

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "function_basename" {
  description = "Base name for the Lambda function (from lambda module output)"
  type        = string
}

variable "lambda_role_id" {
  description = "ID of the Lambda execution role to attach the policy to"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table to grant access to"
  type        = string
}
