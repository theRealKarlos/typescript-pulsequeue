# ============================================================================
# EVENTBRIDGE BUS OUTPUTS
# ============================================================================

output "bus_name" {
  value = aws_cloudwatch_event_bus.custom.name
}

output "bus_arn" {
  value = aws_cloudwatch_event_bus.custom.arn
}
