# ============================================================================
# DATA SOURCES
# ============================================================================

data "aws_caller_identity" "current" {}

# ============================================================================
# EVENTBRIDGE RULE
# ============================================================================

resource "aws_cloudwatch_event_rule" "order_placed" {
  name           = "${var.environment}-${var.rule_name}"
  event_bus_name = var.bus_name
  event_pattern = jsonencode({
    source        = [var.event_source],
    "detail-type" = [var.event_detail_type]
  })
}

# ============================================================================
# EVENTBRIDGE TARGET
# ============================================================================

resource "aws_cloudwatch_event_target" "order_handler" {
  rule           = aws_cloudwatch_event_rule.order_placed.name
  event_bus_name = var.bus_name
  target_id      = "${var.environment}-${var.rule_name}-${var.target_id_suffix}"
  arn            = var.lambda_arn

  dead_letter_config {
    arn = aws_sqs_queue.eventbridge_dlq.arn
  }
}

# ============================================================================
# LAMBDA PERMISSIONS
# ============================================================================

resource "aws_lambda_permission" "allow_eventbridge_rule" {
  statement_id  = "AllowExecutionFromDevOrderPlacedRule"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_arn
  principal     = "events.amazonaws.com"
  source_arn    = "arn:aws:events:${var.region}:${data.aws_caller_identity.current.account_id}:rule/${var.bus_name}/${aws_cloudwatch_event_rule.order_placed.name}"
}

# ============================================================================
# DEAD LETTER QUEUE
# ============================================================================

resource "aws_sqs_queue" "eventbridge_dlq" {
  name = "${var.environment}-${var.rule_name}-eventbridge-dlq"

  visibility_timeout_seconds = 30
  message_retention_seconds  = 1209600
}

# ============================================================================
# DEAD LETTER QUEUE POLICY
# ============================================================================

resource "aws_sqs_queue_policy" "eventbridge_dlq_policy" {
  queue_url = aws_sqs_queue.eventbridge_dlq.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect    = "Allow",
        Principal = { Service = "events.amazonaws.com" },
        Action    = "sqs:SendMessage",
        Resource  = aws_sqs_queue.eventbridge_dlq.arn
      }
    ]
  })
}
