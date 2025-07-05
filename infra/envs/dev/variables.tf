variable "region" {
  description = "AWS region to deploy resources to"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "lambda_runtime" {
  description = "Lambda runtime for all Lambda functions"
  type        = string
}

variable "lambda_handler" {
  description = "Lambda handler for all Lambda functions"
  type        = string
}

variable "grafana_admin_password" {
  description = "Admin password for Grafana"
  type        = string
  sensitive   = true
}
