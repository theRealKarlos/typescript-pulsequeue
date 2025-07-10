# ============================================================================
# ROOT MODULE VARIABLES - ENVIRONMENT-AGNOSTIC INFRASTRUCTURE
# ============================================================================

variable "region" {
  description = "AWS region to deploy resources to"
  type        = string

  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[1-9]$", var.region))
    error_message = "Region must be a valid AWS region (e.g., eu-west-2, us-east-1)."
  }
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "lambda_runtime" {
  description = "Lambda runtime for all Lambda functions"
  type        = string

  validation {
    condition     = can(regex("^nodejs[0-9]+\\.[x]$", var.lambda_runtime))
    error_message = "Lambda runtime must be a valid Node.js runtime (e.g., nodejs22.x)."
  }
}

variable "lambda_handler" {
  description = "Lambda handler for all Lambda functions"
  type        = string

  validation {
    condition     = can(regex("^[a-zA-Z0-9_-]+\\.[a-zA-Z0-9_-]+$", var.lambda_handler))
    error_message = "Lambda handler must be in format: filename.functionname."
  }
}

variable "lambda_timeout" {
  description = "Timeout for Lambda functions in seconds"
  type        = number
  default     = 30

  validation {
    condition     = var.lambda_timeout >= 1 && var.lambda_timeout <= 900
    error_message = "Lambda timeout must be between 1 and 900 seconds."
  }
}

variable "lambda_memory_size" {
  description = "Memory size for Lambda functions in MB"
  type        = number
  default     = 128

  validation {
    condition     = contains([128, 256, 512, 1024, 2048, 4096, 10240], var.lambda_memory_size)
    error_message = "Lambda memory size must be one of: 128, 256, 512, 1024, 2048, 4096, 10240 MB."
  }
}

variable "enable_xray_tracing" {
  description = "Enable X-Ray tracing for Lambda functions"
  type        = bool
  default     = true
}

variable "enable_encryption_at_rest" {
  description = "Enable encryption at rest for DynamoDB tables"
  type        = bool
  default     = true
}

variable "enable_point_in_time_recovery" {
  description = "Enable point-in-time recovery for DynamoDB tables"
  type        = bool
  default     = true
}

variable "grafana_admin_password" {
  description = "Admin password for Grafana"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.grafana_admin_password) >= 8
    error_message = "Grafana admin password must be at least 8 characters long."
  }
}

variable "lambda_zip_paths" {
  description = "Paths to Lambda deployment packages"
  type = object({
    order_service   = string
    payment_service = string
    metrics_service = string
  })

  validation {
    condition = alltrue([
      can(fileexists(var.lambda_zip_paths.order_service)),
      can(fileexists(var.lambda_zip_paths.payment_service)),
      can(fileexists(var.lambda_zip_paths.metrics_service))
    ])
    error_message = "All Lambda zip paths must point to valid files."
  }
}

variable "prometheus_config" {
  description = "Prometheus configuration as YAML string"
  type        = string
}

variable "dashboard_body_template" {
  description = "CloudWatch dashboard configuration template with environment and region placeholders"
  type        = string
}
