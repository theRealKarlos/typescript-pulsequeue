variable "dashboard_basename" {
  description = "The name of the CloudWatch dashboard"
  type        = string
}

variable "dashboard_body" {
  description = "The JSON body of the CloudWatch dashboard"
  type        = string
}
variable "environment" {
  description = "The environment for the CloudWatch dashboard (e.g., dev, staging, prod)"
  type        = string
}

