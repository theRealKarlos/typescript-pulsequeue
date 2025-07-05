variable "bus_name" {
  description = "Name of the EventBridge bus the rule attaches to"
  type        = string
}

variable "lambda_arn" {
  description = "ARN of the Lambda function that will be triggered"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "region" {
  description = "AWS region to deploy resources to"
  type        = string
}

variable "rule_name" {
  description = "Base name for the EventBridge rule"
  type        = string
}

variable "target_id_suffix" {
  description = "Suffix or label for the EventBridge target_id to ensure uniqueness and clarity"
  type        = string
  default     = "handler"
}

variable "event_source" {
  description = "Source field to match in the EventBridge rule event pattern"
  type        = string
}

variable "event_detail_type" {
  description = "Detail-type field to match in the EventBridge rule event pattern"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
