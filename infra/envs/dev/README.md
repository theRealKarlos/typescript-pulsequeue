# Development Environment

This directory contains the Terraform configuration for the development environment.

## Setup

1. **Copy secrets template:**

   ```bash
   cp secrets.auto.tfvars.example secrets.auto.tfvars
   ```

2. **Edit secrets file:**

   ```bash
   # Edit secrets.auto.tfvars with your actual values
   # DO NOT commit this file to Git (it's in .gitignore)
   ```

3. **Deploy:**
   ```bash
   terraform init
   terraform plan -var-file=terraform.tfvars
   terraform apply -var-file=terraform.tfvars
   ```

## Important

- **Never commit `secrets.auto.tfvars`** - It contains sensitive data
- **Use `secrets.auto.tfvars.example`** as a template
- **State is stored in S3** - No local state files
- **Lock files are generated locally** - Don't commit `.terraform.lock.hcl`
- **Initialize** infrastructure
- **No AWS access keys required** (OIDC authentication is the default)
- State locking uses S3 lockfile (Terraform 1.6+)
