# ============================================================================
# EVENTBRIDGE BUS OUTPUTS
# ============================================================================

output "bus_name" {
  description = "Name of the EventBridge bus"
  value       = aws_cloudwatch_event_bus.custom.name
}

output "bus_arn" {
  description = "ARN of the EventBridge bus"
  value       = aws_cloudwatch_event_bus.custom.arn
}
