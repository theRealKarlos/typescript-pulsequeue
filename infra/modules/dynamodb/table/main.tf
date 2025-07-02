resource "aws_dynamodb_table" "this" {
  name         = "${var.environment}-${var.table_basename}-table"
  billing_mode = var.billing_mode
  hash_key     = var.hash_key

  dynamic "attribute" {
    for_each = var.attributes
    content {
      name = attribute.value.name
      type = attribute.value.type
    }
  }
}
