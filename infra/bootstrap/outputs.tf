//Outputs for the bootstrap module

output "state_bucket" {
  value = aws_s3_bucket.tf_state.id
}
