# Bootstrap Infrastructure

This folder contains all foundational infrastructure required before deploying any application environments for PulseQueue.

## What This Creates

- **S3 bucket** for Terraform state storage
- **OIDC provider** for GitHub Actions authentication
- **IAM role** for GitHub Actions with least-privilege permissions

## How to Deploy

- On Windows:
  ```powershell
  .\scripts\bootstrap-infra.ps1
  ```
  or
  ```powershell
  & .\scripts\bootstrap-infra.ps1
  ```
- On Linux/Mac:
  ```bash
  chmod +x scripts/bootstrap-infra.sh
  ./scripts/bootstrap-infra.sh
  ```

## Outputs

- S3 state bucket name
- IAM role ARN for GitHub Actions

## Important

- **Run this step before deploying any environment (dev, staging, prod, etc.)**
- **No AWS access keys required** (OIDC authentication is the default)
- **If you change the GitHub repository name in variables.tf, you must re-run the script to update the IAM role trust policy in AWS.**
- State locking uses S3 lockfile (Terraform 1.6+)

## More Information

See [../../OIDC_SETUP.md](../../OIDC_SETUP.md) for full details, migration steps, and troubleshooting.
