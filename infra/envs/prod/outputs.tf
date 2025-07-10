# ============================================================================
# DEV ENVIRONMENT OUTPUTS
# ============================================================================
#
# This file exposes outputs from the shared root module for the dev environment.
# All outputs are passed through from the infrastructure module.
# ============================================================================

# ============================================================================
# VPC OUTPUTS
# ============================================================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.infrastructure.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.infrastructure.public_subnet_ids
}

# ============================================================================
# EVENTBRIDGE OUTPUTS
# ============================================================================

output "order_eventbridge_bus_name" {
  description = "Name of the order EventBridge bus"
  value       = module.infrastructure.order_eventbridge_bus_name
}

output "payment_eventbridge_bus_name" {
  description = "Name of the payment EventBridge bus"
  value       = module.infrastructure.payment_eventbridge_bus_name
}

# ============================================================================
# LAMBDA FUNCTION OUTPUTS
# ============================================================================

output "order_service_lambda_name" {
  description = "Name of the order service Lambda function"
  value       = module.infrastructure.order_service_lambda_name
}

output "order_service_lambda_arn" {
  description = "ARN of the order service Lambda function"
  value       = module.infrastructure.order_service_lambda_arn
}

output "payment_service_lambda_name" {
  description = "Name of the payment service Lambda function"
  value       = module.infrastructure.payment_service_lambda_name
}

output "payment_service_lambda_arn" {
  description = "ARN of the payment service Lambda function"
  value       = module.infrastructure.payment_service_lambda_arn
}

output "metrics_service_lambda_name" {
  description = "Name of the metrics service Lambda function"
  value       = module.infrastructure.metrics_service_lambda_name
}

output "metrics_service_lambda_arn" {
  description = "ARN of the metrics service Lambda function"
  value       = module.infrastructure.metrics_service_lambda_arn
}

# ============================================================================
# API GATEWAY OUTPUTS
# ============================================================================

output "metrics_api_gateway_url" {
  description = "URL of the metrics API Gateway"
  value       = module.infrastructure.metrics_api_gateway_url
}

# ============================================================================
# DYNAMODB OUTPUTS
# ============================================================================

output "inventory_table_name" {
  description = "Name of the inventory DynamoDB table"
  value       = module.infrastructure.inventory_table_name
}

output "inventory_table_arn" {
  description = "ARN of the inventory DynamoDB table"
  value       = module.infrastructure.inventory_table_arn
}

# ============================================================================
# MONITORING OUTPUTS
# ============================================================================

output "monitoring_cluster_name" {
  description = "Name of the monitoring ECS cluster"
  value       = module.infrastructure.monitoring_cluster_name
}

output "prometheus_service_name" {
  description = "Name of the Prometheus ECS service"
  value       = module.infrastructure.prometheus_service_name
}

output "grafana_service_name" {
  description = "Name of the Grafana ECS service"
  value       = module.infrastructure.grafana_service_name
}

output "grafana_access_instructions" {
  description = "Instructions for accessing Grafana"
  value       = module.infrastructure.grafana_access_instructions
}

output "prometheus_access_instructions" {
  description = "Instructions for accessing Prometheus"
  value       = module.infrastructure.prometheus_access_instructions
}

# ============================================================================
# CLOUDWATCH OUTPUTS
# ============================================================================

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = module.infrastructure.cloudwatch_dashboard_name
}

# ============================================================================
# COMPOSITE OUTPUTS
# ============================================================================

output "infrastructure_summary" {
  description = "Summary of all deployed infrastructure"
  value       = module.infrastructure.infrastructure_summary
}
