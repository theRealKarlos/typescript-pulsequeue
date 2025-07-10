# ============================================================================
# UNIFIED MONITORING MODULE
# ----------------------------------------------------------------------------
# Cost-effective monitoring deployment for lab projects
# - Single ECS cluster for both Prometheus and Grafana
# - Minimal ECS resources (0.25 vCPU, 512MB RAM per service)
# - Direct access via public IP (no ALB)
# - No NAT Gateway required
# ============================================================================

# ============================================================================
# DATA SOURCES
# ============================================================================

data "aws_region" "current" {}

# ============================================================================
# NAMING CONFIGURATION
# ============================================================================

locals {
  # Base naming configuration
  name_prefix = "${var.environment}-${var.monitoring_basename}"

  # Resource names
  cluster_name        = "${local.name_prefix}-cluster"
  security_group_name = "${local.name_prefix}-sg"
  execution_role_name = "${local.name_prefix}-execution-role"

  # Task definition names
  prometheus_task_family = "${local.name_prefix}-prometheus"
  grafana_task_family    = "${local.name_prefix}-grafana"

  # Service names
  prometheus_service_name = "${local.name_prefix}-prometheus-service"
  grafana_service_name    = "${local.name_prefix}-grafana-service"

  # Log group names
  prometheus_log_group = "/ecs/${local.name_prefix}-prometheus"
  grafana_log_group    = "/ecs/${local.name_prefix}-grafana"

  # Prometheus configuration with metrics API URL substituted
  prometheus_config_with_url = replace(var.prometheus_config, "$${metrics_api_host}", replace(replace(var.metrics_api_url, "https://", ""), "/${var.environment}/metrics", ""))

  # Common task definition configuration
  task_definition_config = {
    network_mode             = "awsvpc"
    requires_compatibilities = ["FARGATE"]
    cpu                      = 256 # Minimal CPU (0.25 vCPU)
    memory                   = 512 # Minimal memory (512 MB)
    execution_role_arn       = aws_iam_role.monitoring_execution.arn
    tags                     = var.tags
  }

  # Common ECS service configuration
  service_config = {
    cluster       = aws_ecs_cluster.monitoring.id
    desired_count = 1
    launch_type   = "FARGATE"
    network_configuration = {
      security_groups  = [aws_security_group.monitoring.id]
      subnets          = var.public_subnet_ids # Use public subnets for direct access
      assign_public_ip = true                  # Assign public IP for direct access
    }
    tags = var.tags
  }

  # Common log group configuration
  log_group_config = {
    retention_in_days = 1 # Minimal retention for cost savings
    tags              = var.tags
  }
}

# ============================================================================
# ECS CLUSTER (SINGLE)
# ============================================================================

resource "aws_ecs_cluster" "monitoring" {
  name = local.cluster_name

  setting {
    name  = "containerInsights"
    value = "disabled" # Disable for cost savings
  }

  tags = var.tags
}

# ============================================================================
# SECURITY GROUP (UNIFIED)
# ============================================================================

resource "aws_security_group" "monitoring" {
  name_prefix = "${local.name_prefix}-"
  vpc_id      = var.vpc_id

  # Allow direct access to Prometheus
  ingress {
    from_port   = 9090
    to_port     = 9090
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Open for lab access
  }

  # Allow direct access to Grafana
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Open for lab access
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = local.security_group_name
  })
}

# ============================================================================
# TASK DEFINITIONS (SHARED CONFIGURATION)
# ============================================================================

resource "aws_ecs_task_definition" "prometheus" {
  family = local.prometheus_task_family

  # Use shared configuration
  network_mode             = local.task_definition_config.network_mode
  requires_compatibilities = local.task_definition_config.requires_compatibilities
  cpu                      = local.task_definition_config.cpu
  memory                   = local.task_definition_config.memory
  execution_role_arn       = local.task_definition_config.execution_role_arn

  # Use inline container definition to avoid line ending issues with external JSON files
  # This ensures consistent behavior across different operating systems and prevents
  # the "invalid character '\r' in string literal" error
  container_definitions = jsonencode([
    {
      name  = "prometheus"
      image = "prom/prometheus:latest"
      portMappings = [
        {
          containerPort = 9090
          protocol      = "tcp"
        }
      ]
      entrypoint = [
        "/bin/sh",
        "-c"
      ]
      command = [
        "echo '${local.prometheus_config_with_url}' > /etc/prometheus/prometheus.yml && exec /bin/prometheus --config.file=/etc/prometheus/prometheus.yml --storage.tsdb.path=/prometheus --web.console.libraries=/etc/prometheus/console_libraries --web.console.templates=/etc/prometheus/consoles --storage.tsdb.retention.time=200h --web.enable-lifecycle"
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.prometheus.name
          "awslogs-stream-prefix" = "prometheus"
          "awslogs-region"        = data.aws_region.current.region
        }
      }
      cpu    = 256
      memory = 512
      healthCheck = {
        command     = ["wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:9090/-/healthy"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
      mountPoints = []
      volumesFrom = []
    }
  ])

  tags = local.task_definition_config.tags
}

resource "aws_ecs_task_definition" "grafana" {
  family = local.grafana_task_family

  # Use shared configuration
  network_mode             = local.task_definition_config.network_mode
  requires_compatibilities = local.task_definition_config.requires_compatibilities
  cpu                      = local.task_definition_config.cpu
  memory                   = local.task_definition_config.memory
  execution_role_arn       = local.task_definition_config.execution_role_arn

  # Use inline container definition to avoid line ending issues with external JSON files
  # This ensures consistent behavior across different operating systems and prevents
  # the "invalid character '\r' in string literal" error
  container_definitions = jsonencode([
    {
      name  = "grafana"
      image = "grafana/grafana:latest"
      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "GF_SECURITY_ADMIN_PASSWORD"
          value = var.grafana_admin_password
        },
        {
          name  = "GF_SECURITY_ADMIN_USER"
          value = "admin"
        },
        {
          name  = "GF_SERVER_ROOT_URL"
          value = "http://localhost:3000"
        },
        {
          name  = "GF_INSTALL_PLUGINS"
          value = "grafana-clock-panel,grafana-simple-json-datasource"
        },
        {
          name  = "GF_DATASOURCES_DEFAULT"
          value = "prometheus"
        },
        {
          name  = "GF_DATASOURCES_PROMETHEUS_URL"
          value = "http://prometheus:9090"
        },
        {
          name  = "GF_DATASOURCES_PROMETHEUS_ACCESS"
          value = "proxy"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.grafana.name
          "awslogs-stream-prefix" = "grafana"
          "awslogs-region"        = data.aws_region.current.region
        }
      }
      cpu    = 256
      memory = 512
      healthCheck = {
        command     = ["wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
      volumesFrom = []
    }
  ])



  tags = local.task_definition_config.tags
}

# ============================================================================
# ECS SERVICES (SAME CLUSTER)
# ============================================================================

resource "aws_ecs_service" "prometheus" {
  name            = local.prometheus_service_name
  cluster         = local.service_config.cluster
  task_definition = aws_ecs_task_definition.prometheus.arn
  desired_count   = local.service_config.desired_count
  launch_type     = local.service_config.launch_type

  network_configuration {
    security_groups  = local.service_config.network_configuration.security_groups
    subnets          = local.service_config.network_configuration.subnets
    assign_public_ip = local.service_config.network_configuration.assign_public_ip
  }

  # No load balancer - direct access via public IP
  # This saves ~$20/month in ALB costs

  tags = local.service_config.tags
}

resource "aws_ecs_service" "grafana" {
  name            = local.grafana_service_name
  cluster         = local.service_config.cluster
  task_definition = aws_ecs_task_definition.grafana.arn
  desired_count   = local.service_config.desired_count
  launch_type     = local.service_config.launch_type

  network_configuration {
    security_groups  = local.service_config.network_configuration.security_groups
    subnets          = local.service_config.network_configuration.subnets
    assign_public_ip = local.service_config.network_configuration.assign_public_ip
  }

  # No load balancer - direct access via public IP
  # This saves ~$20/month in ALB costs

  tags = local.service_config.tags
}

# ============================================================================
# IAM ROLES (SHARED)
# ============================================================================

resource "aws_iam_role" "monitoring_execution" {
  name = local.execution_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "monitoring_execution" {
  role       = aws_iam_role.monitoring_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ============================================================================
# CLOUDWATCH LOGS (MINIMAL RETENTION)
# ============================================================================

resource "aws_cloudwatch_log_group" "prometheus" {
  name              = local.prometheus_log_group
  retention_in_days = local.log_group_config.retention_in_days

  tags = local.log_group_config.tags
}

resource "aws_cloudwatch_log_group" "grafana" {
  name              = local.grafana_log_group
  retention_in_days = local.log_group_config.retention_in_days

  tags = local.log_group_config.tags
}

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
