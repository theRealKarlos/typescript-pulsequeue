# ============================================================================
# BOOTSTRAP INFRASTRUCTURE OUTPUTS
# ============================================================================

output "state_bucket" {
  description = "S3 bucket for Terraform state storage"
  value       = aws_s3_bucket.tf_state.id
}

output "github_actions_role_arn" {
  description = "ARN of the IAM role for GitHub Actions"
  value       = aws_iam_role.github_actions.arn
}

output "github_actions_role_name" {
  description = "Name of the IAM role for GitHub Actions"
  value       = aws_iam_role.github_actions.name
}
