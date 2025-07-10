# ============================================================================
# TERRAFORM VARIABLES FOR STAGING ENVIRONMENT
# ============================================================================
#
# This file provides variable values for the staging environment.
# Staging environment uses production-like settings for testing.
#
# SECURITY NOTE: Never commit sensitive values like passwords or API keys.
# Use AWS Secrets Manager, Parameter Store, or environment variables for secrets.
# ============================================================================

# ============================================================================
# CORE CONFIGURATION
# ============================================================================

region         = "eu-west-2"
environment    = "staging"
lambda_runtime = "nodejs22.x"
lambda_handler = "handler.handler"

# ============================================================================
# LAMBDA CONFIGURATION
# ============================================================================

lambda_timeout      = 60  # Higher timeout for staging testing
lambda_memory_size  = 512 # More memory for staging performance testing
enable_xray_tracing = true

# ============================================================================
# NETWORKING CONFIGURATION
# ============================================================================

vpc_cidr_block = "10.1.0.0/16" # Different CIDR for staging

# ============================================================================
# SECURITY CONFIGURATION
# ============================================================================

enable_encryption_at_rest     = true
enable_point_in_time_recovery = true
