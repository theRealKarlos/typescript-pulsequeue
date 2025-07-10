# ============================================================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# ============================================================================
#
# This file uses the shared root module to deploy the complete infrastructure
# stack for the production environment. All environment-specific values are passed
# via variables, making this truly environment-agnostic.
# ============================================================================

module "infrastructure" {
  source = "../../modules/root"

  # ============================================================================
  # ENVIRONMENT CONFIGURATION
  # ============================================================================
  environment = var.environment
  region      = var.region

  # ============================================================================
  # LAMBDA CONFIGURATION
  # ============================================================================
  lambda_runtime      = var.lambda_runtime
  lambda_handler      = var.lambda_handler
  lambda_timeout      = var.lambda_timeout
  lambda_memory_size  = var.lambda_memory_size
  enable_xray_tracing = var.enable_xray_tracing

  # ============================================================================
  # LAMBDA ZIP PATHS
  # ============================================================================
  lambda_zip_paths = {
    order_service   = abspath("${path.module}/../../../dist/order-service.zip")
    payment_service = abspath("${path.module}/../../../dist/payment-service.zip")
    metrics_service = abspath("${path.module}/../../../dist/metrics-service.zip")
  }

  # ============================================================================
  # SECURITY CONFIGURATION
  # ============================================================================
  enable_encryption_at_rest     = var.enable_encryption_at_rest
  enable_point_in_time_recovery = var.enable_point_in_time_recovery

  # ============================================================================
  # MONITORING CONFIGURATION
  # ============================================================================
  grafana_admin_password  = var.grafana_admin_password
  prometheus_config       = file("${path.module}/prometheus-config.yml")
  dashboard_body_template = file("${path.module}/dashboard-body.json")
}
