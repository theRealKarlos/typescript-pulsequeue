# GitHub Environment Setup for Manual Production Approval

This guide explains how to set up manual approval for production deployments in GitHub.

## Overview

The CI/CD pipeline is configured to require manual approval before deploying to production. This ensures that no changes are automatically deployed to production without human review.

## Setup Steps

### 1. Create Production Environment in GitHub

1. **Go to your GitHub repository**
2. **Navigate to Settings** → **Environments**
3. **Click "New environment"**
4. **Enter environment name**: `production`
5. **Click "Configure environment"**

### 2. Configure Environment Protection Rules

In the production environment settings, configure:

#### **Required Reviewers**

- **Add required reviewers**: Add yourself and any other team members who should approve production deployments
- **Required number of reviewers**: Set to 1 or more as needed

#### **Deployment Branches**

- **Deployment branches**: Select "Selected branches"
- **Branch name pattern**: `master`

#### **Wait Timer** (Optional)

- **Wait timer**: Set to 0 minutes (or add a delay if desired)

### 3. Environment Variables (Optional)

If you need environment-specific secrets for production:

1. **Go to the production environment settings**
2. **Add environment secrets** as needed:
   - `PRODUCTION_SPECIFIC_SECRET`
   - `PRODUCTION_API_KEY`
   - etc.

## How It Works

### Before Manual Approval

When you push to `master`:

1. ✅ All quality checks run (tests, linting, security scans)
2. ✅ Terraform plan is created
3. ⏸️ **Production deployment waits for manual approval**

### Manual Approval Process

1. **Go to GitHub Actions** → **Workflows**
2. **Find the "Deploy to Production" job**
3. **Click "Review deployments"**
4. **Review the changes** (Terraform plan, code changes)
5. **Click "Approve and deploy"** or **"Reject"**

### After Approval

- ✅ Terraform apply runs
- ✅ Post-deploy tests run
- ✅ Notifications are sent

## Branch Strategy

| Branch        | Environment | Approval Required |
| ------------- | ----------- | ----------------- |
| `development` | Dev         | ❌ Automatic      |
| `release*`    | Staging     | ❌ Automatic      |
| `master`      | Production  | ✅ **Manual**     |

## Troubleshooting

### Environment Not Found Error

If you see "Environment 'production' not found":

1. Make sure you've created the production environment in GitHub
2. Check that the environment name matches exactly: `production`
3. Verify you have the correct permissions

### Approval Not Working

1. Check that you're added as a required reviewer
2. Verify the branch protection rules are configured
3. Ensure you have the necessary repository permissions

## Security Benefits

- **No accidental production deployments**
- **Human review of all changes**
- **Audit trail of who approved what**
- **Ability to reject changes if needed**

## Next Steps

1. **Create the production environment** in GitHub (see steps above)
2. **Add required reviewers** to the environment
3. **Test the workflow** by making a small change to master
4. **Verify the approval process** works as expected

---

**Note**: This setup ensures that production deployments are always reviewed by a human before being applied, providing an additional safety layer for your production infrastructure.
