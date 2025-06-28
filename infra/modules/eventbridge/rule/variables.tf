variable "bus_name" {
  type        = string
  description = "The name of the EventBridge bus the rule attaches to"
}

variable "lambda_arn" {
  type        = string
  description = "ARN of the Lambda function that will be triggered"
}

variable "environment" {
  type        = string
  description = "Environment name used in naming resources"
}

variable "region" {
  description = "AWS region to deploy resources to"
  type        = string
}
