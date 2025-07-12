//Create resources for state management, run once before creating infra

provider "aws" {
  region = "eu-west-2"
}

resource "aws_s3_bucket" "tf_state" {
  bucket        = "pulsequeue-terraform-backend-state"
  force_destroy = true
}

# Configure Terraform to use S3 backend for state storage
terraform {
  backend "s3" {
    bucket = "pulsequeue-terraform-backend-state"
    key    = "bootstrap/terraform.tfstate"
    region = "eu-west-2"
  }
}

