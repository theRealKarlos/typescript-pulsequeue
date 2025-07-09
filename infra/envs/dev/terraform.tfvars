# ============================================================================
# TERRAFORM VARIABLES FOR DEV ENVIRONMENT
# ============================================================================
#
# This file provides variable values for the dev environment.
# To add more environments (e.g., staging, prod), create additional tfvars files
# such as staging.tfvars or prod.tfvars, and use them with:
#   terraform apply -var-file=staging.tfvars
#
# Terraform automatically loads terraform.tfvars by default.
#
# SECURITY NOTE: Never commit sensitive values like passwords or API keys.
# Use AWS Secrets Manager, Parameter Store, or environment variables for secrets.
# ============================================================================

# ============================================================================
# CORE CONFIGURATION
# ============================================================================

region         = "eu-west-2"
environment    = "dev"
lambda_runtime = "nodejs22.x"
lambda_handler = "handler.handler"

# ============================================================================
# LAMBDA CONFIGURATION
# ============================================================================

lambda_timeout      = 30
lambda_memory_size  = 256
enable_xray_tracing = true

# ============================================================================
# NETWORKING CONFIGURATION
# ============================================================================

vpc_cidr_block = "10.0.0.0/16"

# ============================================================================
# SECURITY CONFIGURATION
# ============================================================================

enable_encryption_at_rest     = true
enable_point_in_time_recovery = true

# ============================================================================
# MONITORING CONFIGURATION
# ============================================================================

# NOTE: Set this via environment variable or AWS Secrets Manager in production
# grafana_admin_password = "your-secure-password-here"
grafana_admin_password = "PulseQ2024!"
