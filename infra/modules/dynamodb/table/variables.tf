variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "table_basename" {
  description = "Base name for the DynamoDB table"
  type        = string
}

variable "attributes" {
  description = "List of attribute definitions for the table"
  type = list(object({
    name = string
    type = string
  }))
}

variable "hash_key" {
  description = "Attribute to use as the hash (partition) key"
  type        = string
}

variable "billing_mode" {
  description = "Billing mode for the table"
  type        = string
  default     = "PAY_PER_REQUEST"
}

variable "tags" {
  description = "Tags to apply to the DynamoDB table"
  type        = map(string)
  default     = {}
}
