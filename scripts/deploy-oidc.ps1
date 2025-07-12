# ============================================================================
# DEPLOY OIDC PROVIDER AND IAM ROLE FOR GITHUB ACTIONS
# ============================================================================
# This script deploys the OIDC provider and IAM role needed for GitHub Actions
# to authenticate with AWS using short-lived tokens instead of long-lived keys

param(
    [switch]$PlanOnly
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Deploying bootstrap infrastructure (S3 state bucket + OIDC provider)..." -ForegroundColor Green

# Change to the bootstrap directory
Set-Location infra/bootstrap

# Initialize Terraform
Write-Host "📦 Initializing Terraform..." -ForegroundColor Yellow
terraform init

# Plan the deployment
Write-Host "📋 Planning deployment..." -ForegroundColor Yellow
terraform plan -out=tfplan

if ($PlanOnly) {
    Write-Host "📋 Plan completed. Use -PlanOnly to see the plan without applying." -ForegroundColor Cyan
    exit 0
}

# Apply the deployment
Write-Host "🔧 Applying deployment..." -ForegroundColor Yellow
terraform apply tfplan

# Get the outputs
Write-Host "📤 Getting deployment outputs..." -ForegroundColor Yellow
$STATE_BUCKET = terraform output -raw state_bucket
$ROLE_ARN = terraform output -raw github_actions_role_arn
$ROLE_NAME = terraform output -raw github_actions_role_name

Write-Host ""
Write-Host "✅ Bootstrap infrastructure deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Deployment Summary:" -ForegroundColor Cyan
Write-Host "   S3 State Bucket: $STATE_BUCKET" -ForegroundColor White
Write-Host "   IAM Role ARN: $ROLE_ARN" -ForegroundColor White
Write-Host "   IAM Role Name: $ROLE_NAME" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Update your GitHub repository name in infra/bootstrap/variables.tf" -ForegroundColor White
Write-Host "   2. Remove AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY from GitHub secrets" -ForegroundColor White
Write-Host "   3. Test the workflow to ensure OIDC authentication works" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Important: Make sure to update the GitHub repository name in variables.tf" -ForegroundColor Yellow
Write-Host "   Current value: typescript-pulsequeue/typescript-pulsequeue" -ForegroundColor White
Write-Host "   Update to your actual repository: your-org/your-repo" -ForegroundColor White 