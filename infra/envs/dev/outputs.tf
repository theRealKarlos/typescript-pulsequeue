# ============================================================================
# OUTPUTS
# ============================================================================

# ============================================================================
# LAMBDA OUTPUTS
# ============================================================================

output "order_service_lambda_name" {
  description = "Name of the order service Lambda function"
  value       = module.order_service.lambda_name
}

output "order_service_lambda_arn" {
  description = "ARN of the order service Lambda function"
  value       = module.order_service.lambda_arn
}

output "payment_service_lambda_name" {
  description = "Name of the payment service Lambda function"
  value       = module.payment_service.lambda_name
}

output "payment_service_lambda_arn" {
  description = "ARN of the payment service Lambda function"
  value       = module.payment_service.lambda_arn
}

output "metrics_service_lambda_name" {
  description = "Name of the metrics service Lambda function"
  value       = module.metrics_service.lambda_name
}

output "metrics_service_lambda_arn" {
  description = "ARN of the metrics service Lambda function"
  value       = module.metrics_service.lambda_arn
}

# ============================================================================
# API GATEWAY OUTPUTS
# ============================================================================

output "metrics_api_gateway_url" {
  description = "URL of the metrics API Gateway endpoint"
  value       = module.metrics_api_gateway.api_gateway_url
}

# ============================================================================
# EVENTBRIDGE OUTPUTS
# ============================================================================

output "order_bus_name" {
  description = "Name of the order EventBridge bus"
  value       = module.order_eventbridge_bus.bus_name
}

output "payment_bus_name" {
  description = "Name of the payment EventBridge bus"
  value       = module.payment_eventbridge_bus.bus_name
}

# ============================================================================
# DYNAMODB OUTPUTS
# ============================================================================

output "inventory_table_name" {
  description = "Name of the inventory DynamoDB table"
  value       = module.inventory_table.table_name
}

output "inventory_table_arn" {
  description = "ARN of the inventory DynamoDB table"
  value       = module.inventory_table.table_arn
}

# ============================================================================
# MONITORING OUTPUTS
# ============================================================================

output "monitoring_cluster_name" {
  description = "Name of the unified monitoring ECS cluster"
  value       = module.monitoring.monitoring_cluster_name
}

output "prometheus_access_instructions" {
  description = "Instructions to access Prometheus"
  value       = module.monitoring.prometheus_access_instructions
}

output "grafana_access_instructions" {
  description = "Instructions to access Grafana"
  value       = module.monitoring.grafana_access_instructions
}

# ============================================================================
# VPC OUTPUTS
# ============================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

# ============================================================================
# CLOUDWATCH OUTPUTS
# ============================================================================

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = module.cloudwatch_dashboard.dashboard_name
}

output "cloudwatch_dashboard_url" {
  description = "AWS Console URL for the CloudWatch dashboard"
  value       = module.cloudwatch_dashboard.dashboard_url
}
