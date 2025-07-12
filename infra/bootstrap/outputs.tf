# ============================================================================
# BOOTSTRAP INFRASTRUCTURE OUTPUTS
# ============================================================================

output "state_bucket" {
  description = "S3 bucket for Terraform state storage"
  value       = aws_s3_bucket.tf_state.id
}
