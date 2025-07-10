//Configure the backend for Terraform state management
terraform {
  backend "s3" {
    bucket       = "pulsequeue-terraform-backend-state"
    key          = "envs/prod/terraform.tfstate"
    region       = "eu-west-2"
    use_lockfile = true
    encrypt      = true
  }
}
