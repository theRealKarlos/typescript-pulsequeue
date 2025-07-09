# ============================================================================
# LAMBDA FUNCTION MODULE VARIABLES
# ============================================================================

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "function_basename" {
  description = "Base name for the Lambda function"
  type        = string
}

variable "lambda_zip_path" {
  description = "Path to the Lambda deployment package"
  type        = string
}

variable "handler" {
  description = "Lambda handler function"
  type        = string
}

variable "runtime" {
  description = "Lambda runtime"
  type        = string
}

variable "environment_variables" {
  description = "Environment variables for the Lambda function"
  type        = map(string)
  default     = {}
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# ============================================================================
# PERFORMANCE AND SECURITY VARIABLES
# ============================================================================

variable "timeout" {
  description = "Timeout for the Lambda function in seconds"
  type        = number
  default     = 30

  validation {
    condition     = var.timeout >= 1 && var.timeout <= 900
    error_message = "Lambda timeout must be between 1 and 900 seconds."
  }
}

variable "memory_size" {
  description = "Memory size for the Lambda function in MB"
  type        = number
  default     = 128

  validation {
    condition     = contains([128, 256, 512, 1024, 2048, 4096, 10240], var.memory_size)
    error_message = "Lambda memory size must be one of: 128, 256, 512, 1024, 2048, 4096, 10240 MB."
  }
}

variable "enable_xray_tracing" {
  description = "Enable X-Ray tracing for the Lambda function"
  type        = bool
  default     = true
}

variable "enable_function_url" {
  description = "Enable function URL for direct HTTP access"
  type        = bool
  default     = false
}
