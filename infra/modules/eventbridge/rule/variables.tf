variable "bus_name" {
  type        = string
  description = "The name of the EventBridge bus the rule attaches to"
}

variable "lambda_arn" {
  type        = string
  description = "ARN of the Lambda function that will be triggered"
}

variable "environment" {
  description = "The environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "region" {
  description = "AWS region to deploy resources to"
  type        = string
}
