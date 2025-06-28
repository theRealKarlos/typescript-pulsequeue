# ============================================================================
# VARIABLES
# ============================================================================

variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
}

variable "event_source" {
  description = "EventBridge event source"
  type        = string
  default     = "order.service"
}

variable "event_detail_type" {
  description = "EventBridge event detail type"
  type        = string
  default     = "OrderPlaced"
}

variable "event_bus_name" {
  description = "EventBridge bus name"
  type        = string
}

variable "event_bus_arn" {
  description = "EventBridge bus ARN"
  type        = string
}

variable "api_proxy_lambda_arn" {
  description = "API Proxy Lambda function ARN for API Gateway integration"
  type        = string
}
