# ============================================================================
# DYNAMODB POLICY MODULE
# ============================================================================
# 
# This module creates IAM policies for Lambda functions that need DynamoDB access.
# It's designed to avoid circular dependencies with computed values (DynamoDB ARN).
#
# USAGE: This module is called after both DynamoDB table and Lambda functions
# are created, allowing us to reference the known table ARN.
# ============================================================================

resource "aws_iam_role_policy" "lambda_dynamodb_policy" {
  name = "${var.environment}-${var.function_basename}-dynamodb-policy"
  role = var.lambda_role_id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:UpdateItem",
          "dynamodb:GetItem"
        ],
        Resource = var.dynamodb_table_arn
      }
    ]
  })
}
