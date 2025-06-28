output "rule_name" {
  value = aws_cloudwatch_event_rule.order_placed.name
}

output "rule_arn" {
  value = aws_cloudwatch_event_rule.order_placed.arn
}
