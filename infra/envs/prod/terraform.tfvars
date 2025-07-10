# ============================================================================
# TERRAFORM VARIABLES FOR PRODUCTION ENVIRONMENT
# ============================================================================
#
# This file provides variable values for the production environment.
# Production environment uses high-performance settings for production workloads.
#
# SECURITY NOTE: Never commit sensitive values like passwords or API keys.
# Use AWS Secrets Manager, Parameter Store, or environment variables for secrets.
# ============================================================================

# ============================================================================
# CORE CONFIGURATION
# ============================================================================

region         = "eu-west-2"
environment    = "prod"
lambda_runtime = "nodejs22.x"
lambda_handler = "handler.handler"

# ============================================================================
# LAMBDA CONFIGURATION
# ============================================================================

lambda_timeout      = 60   # Higher timeout for production workloads
lambda_memory_size  = 1024 # More memory for production performance
enable_xray_tracing = true

# ============================================================================
# NETWORKING CONFIGURATION
# ============================================================================

vpc_cidr_block = "10.2.0.0/16" # Different CIDR for production

# ============================================================================
# SECURITY CONFIGURATION
# ============================================================================

enable_encryption_at_rest     = true
enable_point_in_time_recovery = true
