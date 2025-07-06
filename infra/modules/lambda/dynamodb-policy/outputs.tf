# ============================================================================
# DYNAMODB POLICY MODULE OUTPUTS
# ============================================================================

output "policy_id" {
  description = "ID of the created IAM role policy"
  value       = aws_iam_role_policy.lambda_dynamodb_policy.id
}

output "policy_name" {
  description = "Name of the created IAM role policy"
  value       = aws_iam_role_policy.lambda_dynamodb_policy.name
} 
