# ============================================================================
# VARIABLES
# ============================================================================

variable "lambda_zip_path" {
  description = "Path to the Lambda function ZIP file"
  type        = string
}

variable "function_name" {
  description = "Name of the Lambda function"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
}

variable "event_bus_name" {
  description = "EventBridge bus name"
  type        = string
}

variable "event_bus_arn" {
  description = "EventBridge bus ARN"
  type        = string
} 
