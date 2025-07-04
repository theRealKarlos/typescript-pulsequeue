variable "environment" {
  description = "The environment (e.g., dev, staging, prod) for resource naming."
  type        = string
}

variable "table_basename" {
  description = "Base name for the DynamoDB table."
  type        = string
}

variable "attributes" {
  description = "List of attribute definitions for the table."
  type = list(object({
    name = string
    type = string
  }))
}

variable "hash_key" {
  description = "The attribute to use as the hash (partition) key."
  type        = string
}

variable "billing_mode" {
  description = "The billing mode for the table."
  type        = string
  default     = "PAY_PER_REQUEST"
}

variable "tags" {
  description = "Tags to apply to the DynamoDB table."
  type        = map(string)
  default     = {}
}
