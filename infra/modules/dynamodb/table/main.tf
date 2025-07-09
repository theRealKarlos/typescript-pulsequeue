# ============================================================================
# DYNAMODB TABLE
# ============================================================================

resource "aws_dynamodb_table" "this" {
  name         = "${var.environment}-${var.table_basename}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = var.hash_key

  # Encryption at rest using AWS managed KMS key
  server_side_encryption {
    enabled = var.enable_encryption_at_rest
  }

  # Point-in-time recovery for data protection
  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  # Attribute definitions
  dynamic "attribute" {
    for_each = var.attributes
    content {
      name = attribute.value.name
      type = attribute.value.type
    }
  }

  # Tags for resource management
  tags = var.tags
}
