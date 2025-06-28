# Output the name of the custom EventBridge bus
output "bus_name" {
  value = aws_cloudwatch_event_bus.custom.name
}
