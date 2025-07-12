# GitHub Actions OIDC Setup Guide

This guide explains how to set up OpenID Connect (OIDC) authentication for GitHub Actions to securely access AWS resources without storing long-lived access keys.

## 🎯 What is OIDC?

OpenID Connect (OIDC) allows GitHub Actions to authenticate with AWS using short-lived tokens instead of long-lived access keys. This is much more secure because:

- ✅ **No long-lived secrets** to manage or rotate
- ✅ **Automatic token rotation** by GitHub
- ✅ **Fine-grained permissions** through IAM roles
- ✅ **Audit trail** of all authentication attempts
- ✅ **No secret storage** in GitHub repositories

## 📋 Prerequisites

1. **AWS CLI configured** with appropriate permissions
2. **Terraform installed** (version 1.12.0 or later)
3. **GitHub repository** with admin access
4. **AWS account** with IAM permissions

## 🚀 Deployment Steps

### Step 1: Update Repository Name

Edit `infra/bootstrap/variables.tf` and update the `github_repository` variable:

```hcl
variable "github_repository" {
  description = "GitHub repository in format 'owner/repo'"
  type        = string
  default     = "your-org/your-repo"  # Update this!
}
```

### Step 2: Deploy Bootstrap Infrastructure

**On Windows:**

```powershell
.\scripts\bootstrap-infra.ps1
```

or

```powershell
& .\scripts\bootstrap-infra.ps1
```

**On Linux/Mac:**

```bash
chmod +x scripts/bootstrap-infra.sh
./scripts/bootstrap-infra.sh
```

### Step 3: Update GitHub Secrets

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. **Remove** the following secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
3. **Keep** these secrets:
   - `GRAFANA_ADMIN_PASSWORD`
   - Any other non-AWS secrets

### Step 4: Test the Workflow

1. Push a change to trigger the workflow
2. Check that the workflow runs successfully
3. Verify that AWS authentication works without access keys

## 🔧 How It Works

### 1. GitHub Actions Workflow

The workflow now uses role-based authentication:

```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::ACCOUNT:role/github-actions-role
    aws-region: ${{ env.AWS_REGION }}
```

### 2. AWS IAM Role

The IAM role trusts GitHub's OIDC provider:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT:oidc-provider/token.actions.githubusercontent.com"
      },
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:your-org/your-repo:*"
        }
      }
    }
  ]
}
```

### 3. Permissions

The role has permissions for:

- Lambda function management
- DynamoDB access
- EventBridge events
- CloudWatch metrics
- S3 deployment bucket access
- IAM role passing (for Lambda execution roles)

## 🔒 Security Benefits

### Before OIDC

- ❌ Long-lived access keys stored in GitHub secrets
- ❌ Keys need manual rotation
- ❌ Keys can be compromised if secrets are leaked
- ❌ No audit trail of key usage

### After OIDC

- ✅ Short-lived tokens (1 hour max)
- ✅ Automatic token rotation
- ✅ Tokens are repository-specific
- ✅ Full audit trail in AWS CloudTrail
- ✅ No long-lived secrets to manage

## 🛠️ Troubleshooting

### Common Issues

1. **"Access Denied" errors**
   - Check that the repository name in `variables.tf` matches your actual repository
   - Verify the IAM role has the necessary permissions

2. **"Role not found" errors**
   - Ensure the OIDC infrastructure was deployed successfully
   - Check the role ARN in the workflow matches the deployed role

3. **"Invalid token" errors**
   - Verify the OIDC provider thumbprint is correct
   - Check that the repository name format is correct (owner/repo)

### Debugging Commands

**Check OIDC provider:**

```bash
aws iam get-open-id-connect-provider --open-id-connect-provider-arn arn:aws:iam::ACCOUNT:oidc-provider/token.actions.githubusercontent.com
```

**Check IAM role:**

```bash
aws iam get-role --role-name github-actions-role
```

**Check role policy:**

```bash
aws iam get-role-policy --role-name github-actions-role --policy-name github-actions-policy
```

## 📚 Additional Resources

- [GitHub Actions OIDC Documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- [AWS OIDC Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)
- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

## 🔄 Migration Checklist

- [ ] Update repository name in `variables.tf`
- [ ] Deploy bootstrap infrastructure
- [ ] Update GitHub Actions workflow (already done)
- [ ] Remove AWS access keys from GitHub secrets
- [ ] Test workflow with a small change
- [ ] Verify all jobs run successfully
- [ ] Update documentation for team

## 🎉 Success!

Once completed, your GitHub Actions will use secure, short-lived tokens for AWS authentication, significantly improving your security posture!
