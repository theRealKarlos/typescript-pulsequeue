variable "environment" {
  description = "The environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "bus_name" {
  description = "The name of the EventBridge bus to create."
  type        = string
}
