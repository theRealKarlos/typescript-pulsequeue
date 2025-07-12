//Create resources for state management, run once before creating infra

provider "aws" {
  region = "eu-west-2"
}

resource "aws_s3_bucket" "tf_state" {
  bucket        = "pulsequeue-terraform-backend-state"
  force_destroy = true
}
