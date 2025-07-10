# ============================================================================
# ROOT MODULE OUTPUTS - ENVIRONMENT-AGNOSTIC INFRASTRUCTURE
# ============================================================================

# ============================================================================
# VPC OUTPUTS
# ============================================================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.vpc.public_subnet_ids
}

# ============================================================================
# EVENTBRIDGE OUTPUTS
# ============================================================================

output "order_eventbridge_bus_name" {
  description = "Name of the order EventBridge bus"
  value       = module.order_eventbridge_bus.bus_name
}

output "payment_eventbridge_bus_name" {
  description = "Name of the payment EventBridge bus"
  value       = module.payment_eventbridge_bus.bus_name
}

# ============================================================================
# LAMBDA FUNCTION OUTPUTS
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
  description = "URL of the metrics API Gateway"
  value       = module.metrics_api_gateway.api_gateway_url
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
  description = "Name of the monitoring ECS cluster"
  value       = module.monitoring.cluster_name
}

output "prometheus_service_name" {
  description = "Name of the Prometheus ECS service"
  value       = module.monitoring.prometheus_service_name
}

output "grafana_service_name" {
  description = "Name of the Grafana ECS service"
  value       = module.monitoring.grafana_service_name
}

output "grafana_access_instructions" {
  description = "Instructions for accessing Grafana"
  value       = module.monitoring.grafana_access_instructions
}

output "prometheus_access_instructions" {
  description = "Instructions for accessing Prometheus"
  value       = module.monitoring.prometheus_access_instructions
}

# ============================================================================
# CLOUDWATCH OUTPUTS
# ============================================================================

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = module.cloudwatch_dashboard.dashboard_name
}

# ============================================================================
# COMPOSITE OUTPUTS
# ============================================================================

output "infrastructure_summary" {
  description = "Summary of all deployed infrastructure"
  value = {
    environment = var.environment
    region      = var.region
    vpc_id      = module.vpc.vpc_id
    lambda_functions = {
      order_service   = module.order_service.lambda_name
      payment_service = module.payment_service.lambda_name
      metrics_service = module.metrics_service.lambda_name
    }
    eventbridge_buses = {
      order   = module.order_eventbridge_bus.bus_name
      payment = module.payment_eventbridge_bus.bus_name
    }
    dynamodb_tables = {
      inventory = module.inventory_table.table_name
    }
    api_gateway = {
      metrics_url = module.metrics_api_gateway.api_gateway_url
    }
    monitoring = {
      cluster_name       = module.monitoring.cluster_name
      prometheus_service = module.monitoring.prometheus_service_name
      grafana_service    = module.monitoring.grafana_service_name
    }
  }
} 
