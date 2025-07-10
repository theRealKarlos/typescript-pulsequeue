# ============================================================================
# OUTPUTS
# ============================================================================

output "monitoring_cluster_name" {
  description = "Name of the unified monitoring ECS cluster"
  value       = aws_ecs_cluster.monitoring.name
}

output "prometheus_service_name" {
  description = "Name of the Prometheus ECS service"
  value       = aws_ecs_service.prometheus.name
}

output "grafana_service_name" {
  description = "Name of the Grafana ECS service"
  value       = aws_ecs_service.grafana.name
}

output "prometheus_access_instructions" {
  description = "Instructions to access Prometheus"
  value       = <<-EOT
    Prometheus is running on ECS with public IP.
    
    To access:
    1. Go to ECS Console
    2. Find cluster: ${aws_ecs_cluster.monitoring.name}
    3. Find service: ${aws_ecs_service.prometheus.name}
    4. Click on the task
    5. Note the public IP
    6. Access: http://<PUBLIC_IP>:9090
    
    To get public IP manually:
    1. Get task details: aws ecs describe-tasks --cluster ${aws_ecs_cluster.monitoring.name} --tasks <task-arn> --region eu-west-2
    2. Find networkInterfaceId in the output
    3. Get public IP: aws ec2 describe-network-interfaces --network-interface-ids <network-interface-id> --region eu-west-2
  EOT
}

output "grafana_access_instructions" {
  description = "Instructions to access Grafana"
  value       = <<-EOT
    Grafana is running on ECS with public IP.
    
    To access:
    1. Go to ECS Console
    2. Find cluster: ${aws_ecs_cluster.monitoring.name}
    3. Find service: ${aws_ecs_service.grafana.name}
    4. Click on the task
    5. Note the public IP
    6. Access: http://<PUBLIC_IP>:3000
    7. Login: admin / [password from secrets.auto.tfvars]
    
    To get public IP manually:
    1. Get task details: aws ecs describe-tasks --cluster ${aws_ecs_cluster.monitoring.name} --tasks <task-arn> --region eu-west-2
    2. Find networkInterfaceId in the output
    3. Get public IP: aws ec2 describe-network-interfaces --network-interface-ids <network-interface-id> --region eu-west-2
  EOT
}
