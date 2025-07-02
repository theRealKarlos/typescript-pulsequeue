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

resource "aws_iam_role_policy" "lambda_inventory_dynamodb_policy" {
  name = "${var.environment}-${var.function_basename}-allow-inventory-dynamodb-access"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:UpdateItem",
          "dynamodb:GetItem"
        ],
        Resource = var.inventory_table_arn
      }
    ]
  })
}
