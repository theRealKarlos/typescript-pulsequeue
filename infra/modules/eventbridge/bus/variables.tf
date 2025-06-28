# Variable definition for the custom EventBridge bus name
variable "bus_name" {
  type        = string
  description = "The name of the custom EventBridge bus"
}

variable "lambda_arn" {
  type        = string
  description = "ARN of the Lambda function to attach as target for EventBridge rules"
}
