#!/bin/bash

# ============================================================================
# DEPLOY OIDC PROVIDER AND IAM ROLE FOR GITHUB ACTIONS
# ============================================================================
# This script deploys the OIDC provider and IAM role needed for GitHub Actions
# to authenticate with AWS using short-lived tokens instead of long-lived keys

set -e

echo "🚀 Deploying bootstrap infrastructure (S3 state bucket + OIDC provider)..."

# Change to the bootstrap directory
cd infra/bootstrap

# Initialize Terraform
echo "📦 Initializing Terraform..."
terraform init

# Plan the deployment
echo "📋 Planning deployment..."
terraform plan -out=tfplan

# Apply the deployment
echo "🔧 Applying deployment..."
terraform apply tfplan

# Get the outputs
echo "📤 Getting deployment outputs..."
STATE_BUCKET=$(terraform output -raw state_bucket)
ROLE_ARN=$(terraform output -raw github_actions_role_arn)
ROLE_NAME=$(terraform output -raw github_actions_role_name)

echo ""
echo "✅ Bootstrap infrastructure deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "   S3 State Bucket: $STATE_BUCKET"
echo "   IAM Role ARN: $ROLE_ARN"
echo "   IAM Role Name: $ROLE_NAME"
echo ""
echo "🔧 Next Steps:"
echo "   1. If you need to change your GitHub repository name, update infra/bootstrap/variables.tf and re-run this script to update the IAM role trust policy."
echo "   2. Remove AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY from GitHub secrets"
echo "   3. Test the workflow to ensure OIDC authentication works"
echo ""
echo "⚠️  Important: The GitHub repository name in variables.tf must match your actual repository (e.g., your-org/your-repo)."
echo "   If you change it, re-run this script to update the IAM role trust relationship in AWS." 