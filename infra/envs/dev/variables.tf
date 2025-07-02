variable "region" {
  description = "AWS region to deploy resources to"
  type        = string
  default     = "eu-west-2"
}

variable "environment" {
  description = "The environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "lambda_runtime" {
  description = "The runtime for all Lambda functions"
  type        = string
  default     = "nodejs22.x"
}

variable "lambda_handler" {
  description = "The handler for all Lambda functions"
  type        = string
  default     = "handler.handler"
}
