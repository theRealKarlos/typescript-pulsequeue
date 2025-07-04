# terraform.tfvars for the dev environment
#
# This file provides variable values for the dev environment.
# To add more environments (e.g., staging, prod), create additional tfvars files
# such as staging.tfvars or prod.tfvars, and use them with:
#   terraform apply -var-file=staging.tfvars
#
# Terraform automatically loads terraform.tfvars by default.

region         = "eu-west-2"
environment    = "dev"
lambda_runtime = "nodejs22.x"
lambda_handler = "handler.handler"
