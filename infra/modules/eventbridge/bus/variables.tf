variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "bus_name" {
  description = "Name of the EventBridge bus to create"
  type        = string
}

variable "tags" {
  description = "Tags to apply to the EventBridge bus"
  type        = map(string)
  default     = {}
}
