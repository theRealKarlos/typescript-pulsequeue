# Output the name of the custom EventBridge bus
output "bus_name" {
  value = aws_cloudwatch_event_bus.custom.name
}

# Output the ARN (Amazon Resource Name) of the custom EventBridge bus
output "bus_arn" {
  value = aws_cloudwatch_event_bus.custom.arn
}
