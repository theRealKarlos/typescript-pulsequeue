variable "region" {
  description = "AWS region to deploy resources to"
  type        = string
}

variable "environment" {
  description = "The environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "lambda_runtime" {
  description = "The runtime for all Lambda functions"
  type        = string
}

variable "lambda_handler" {
  description = "The handler for all Lambda functions"
  type        = string
}
