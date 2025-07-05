# ============================================================================
# UNIFIED MONITORING MODULE VARIABLES
# ============================================================================

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "monitoring_basename" {
  description = "Base name for monitoring resources"
  type        = string
  default     = "monitoring"
}

variable "vpc_id" {
  description = "VPC ID where resources will be created"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for direct access"
  type        = list(string)
}

variable "prometheus_config" {
  description = "Prometheus configuration as YAML string"
  type        = string
}

variable "grafana_admin_password" {
  description = "Admin password for Grafana"
  type        = string
  sensitive   = true
}

variable "metrics_api_url" {
  description = "URL of the metrics API Gateway endpoint"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
