variable "table_name" {
  description = "The name of the DynamoDB table for inventory."
  type        = string
}

variable "environment" {
  description = "The environment (e.g., dev, staging, prod) for resource naming."
  type        = string
}
