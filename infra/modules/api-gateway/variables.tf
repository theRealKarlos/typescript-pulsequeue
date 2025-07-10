variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "api_basename" {
  description = "Base name for the API Gateway"
  type        = string
}

variable "resource_path" {
  description = "Path for the API Gateway resource"
  type        = string
}

variable "http_method" {
  description = "HTTP method for the API Gateway (GET, POST, PUT, DELETE, etc.)"
  type        = string
  default     = "GET"
}

variable "authorization_type" {
  description = "Authorization type for the API Gateway method"
  type        = string
  default     = "NONE"
}

variable "lambda_invoke_arn" {
  description = "Invoke ARN of the Lambda function to integrate with"
  type        = string
}

variable "lambda_function_name" {
  description = "Name of the Lambda function"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
