data "aws_caller_identity" "current" {}

resource "aws_cloudwatch_event_rule" "order_placed" {
  name           = "${var.environment}-order-placed"
  event_bus_name = var.bus_name
  event_pattern = jsonencode({
    source        = ["order.service"],
    "detail-type" = ["OrderPlaced"]
  })
}

resource "aws_cloudwatch_event_target" "order_handler" {
  rule           = aws_cloudwatch_event_rule.order_placed.name
  event_bus_name = var.bus_name
  target_id      = "order-handler"
  arn            = var.lambda_arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_arn
  principal     = "events.amazonaws.com"
  source_arn    = "arn:aws:events:${var.region}:${data.aws_caller_identity.current.account_id}:event-bus/${var.bus_name}"
}
