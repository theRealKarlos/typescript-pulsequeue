resource "aws_cloudwatch_dashboard" "this" {
  dashboard_name = "${var.environment}-${var.dashboard_basename}"
  dashboard_body = var.dashboard_body
}

data "aws_region" "current" {}
