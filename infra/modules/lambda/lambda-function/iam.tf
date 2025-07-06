# ============================================================================
# LAMBDA EXECUTION ROLE
# ============================================================================

resource "aws_iam_role" "lambda_exec" {
  name = "${var.environment}-${var.function_basename}-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Effect = "Allow"
        Sid    = ""
      }
    ]
  })
}

# ============================================================================
# EVENTBRIDGE PERMISSIONS
# ============================================================================

resource "aws_iam_role_policy" "lambda_eventbridge_policy" {
  name = "${var.environment}-${var.function_basename}-allow-put-events"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "events:PutEvents"
        Resource = "*"
      }
    ]
  })
}

# ============================================================================
# CLOUDWATCH LOGGING PERMISSIONS
# ============================================================================

resource "aws_iam_role_policy" "lambda_logging" {
  name = "${var.environment}-${var.function_basename}-basic-logging"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

# ============================================================================
# CLOUDWATCH METRICS PERMISSIONS
# ============================================================================

resource "aws_iam_role_policy" "lambda_cloudwatch_metrics" {
  name = "${var.environment}-${var.function_basename}-cloudwatch-metrics"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

# ============================================================================
# DYNAMODB POLICY (MOVED TO MAIN CONFIGURATION)
# ============================================================================
# 
# NOTE: DynamoDB policies are now handled in the main configuration 
# (infra/envs/dev/main.tf) rather than in this module to avoid circular 
# dependencies with computed values.
#
# PROBLEM: When using count = var.inventory_table_arn != "" ? 1 : 0,
# Terraform cannot determine the count value during planning because:
# 1. The DynamoDB table ARN is a computed value (only known after creation)
# 2. The Lambda IAM role depends on the policy
# 3. This creates a circular dependency during fresh deployments
#
# SOLUTION: Move DynamoDB policies to main configuration where we can:
# 1. Create DynamoDB table first
# 2. Create Lambda functions (without DynamoDB policies)
# 3. Create DynamoDB policies separately, referencing the known table ARN
#
# This approach breaks the circular dependency and allows clean deployments.
# ============================================================================
