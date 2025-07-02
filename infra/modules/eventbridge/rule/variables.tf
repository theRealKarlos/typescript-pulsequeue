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

variable "rule_name" {
  type        = string
  description = "The base name for the EventBridge rule."
}

variable "target_id_suffix" {
  type        = string
  description = "Suffix or label for the EventBridge target_id to ensure uniqueness and clarity."
  default     = "handler"
}

variable "event_source" {
  type        = string
  description = "The source field to match in the EventBridge rule event pattern."
}

variable "event_detail_type" {
  type        = string
  description = "The detail-type field to match in the EventBridge rule event pattern."
}
