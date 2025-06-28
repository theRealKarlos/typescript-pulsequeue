# ============================================================================
# EVENTBRIDGE BUS RESOURCE
# ============================================================================

resource "aws_cloudwatch_event_bus" "custom" {
  name = "${var.environment}-pulsequeue-bus"
}
