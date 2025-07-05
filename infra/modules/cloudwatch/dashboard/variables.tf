variable "dashboard_basename" {
  description = "Name of the CloudWatch dashboard"
  type        = string
}

variable "dashboard_body" {
  description = "JSON body of the CloudWatch dashboard"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

