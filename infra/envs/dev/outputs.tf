output "cloudwatch_dashboard_name" {
  description = "The name of the CloudWatch dashboard"
  value       = module.cloudwatch_dashboard.dashboard_name
}

output "cloudwatch_dashboard_url" {
  description = "AWS Console URL for the CloudWatch dashboard"
  value       = module.cloudwatch_dashboard.dashboard_url
}
