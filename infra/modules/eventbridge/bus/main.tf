# Create a custom Amazon EventBridge bus
resource "aws_cloudwatch_event_bus" "custom" {
  # The name of the EventBridge bus, provided via variable
  name = var.bus_name
}

