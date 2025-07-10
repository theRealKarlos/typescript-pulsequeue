# GitHub Actions Setup Guide

This guide explains how to configure GitHub Actions for the TypeScript PulseQueue project, including setting up manual approval for production deployments.

## 🚀 **Deployment Strategy Overview**

The CI/CD pipeline follows this strategy:

### **Branch-Based Deployment**

- **`release*` branches** → **Auto-deploy to staging**
- **`master` branch** → **Manual approval required for production**
- **`development` and feature branches** → **Validation and testing only**

### **Pipeline Stages**

1. **Code Quality & Testing** (All branches)
2. **Terraform Validation** (All branches)
3. **Security Scanning** (All branches)
4. **Staging Deployment** (Release branches only)
5. **Production Deployment** (Main branch with manual approval)

## 🔧 **Required GitHub Secrets**

Set up these secrets in your GitHub repository:

### **AWS Credentials**

- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key

### **Application Secrets**

- `GRAFANA_ADMIN_PASSWORD`: Secure password for Grafana admin user

### **Setting Up Secrets**

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the appropriate name and value

## 🛡️ **Setting Up Manual Approval for Production**

To enable manual approval for production deployments:

### **1. Create Production Environment**

1. Go to your GitHub repository
2. Navigate to **Settings** → **Environments**
3. Click **New environment**
4. Name it `production`
5. Click **Configure environment**

### **2. Configure Protection Rules**

In the production environment settings:

#### **Required Reviewers**

- Add specific users or teams who must approve production deployments
- Recommended: Add at least 2 reviewers for production

#### **Wait Timer**

- Set a minimum wait time (e.g., 5 minutes) before deployment can proceed
- This prevents accidental deployments

#### **Deployment Branches**

- Restrict to specific branches: `master`
- This ensures only master branch deployments require approval

### **3. Enable Environment in Workflow**

Once the environment is created, uncomment this line in `.github/workflows/ci-cd.yml`:

```yaml
deploy-production:
  name: Deploy to Production
  runs-on: ubuntu-latest
  needs: [test-and-lint, terraform-validate, security-scan]
  if: github.ref_name == 'master'
  environment: production # ← Uncomment this line
```

## 🔄 **Deployment Workflow**

### **Development Workflow**

```bash
# Create a feature branch from development
git checkout development
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to trigger validation
git push origin feature/new-feature
# → Runs: Code quality, testing, security scanning, Terraform validation
# → No deployment (validation only)
```

### **Development Workflow**

```bash
# Work on development branch
git checkout development

# Create feature branch from development
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to trigger validation
git push origin feature/new-feature
# → Runs: Code quality, testing, security scanning, Terraform validation
# → No deployment (validation only)

# Merge feature back to development
git checkout development
git merge feature/new-feature
git push origin development
```

### **Staging Workflow**

```bash
# Create a release branch from development
git checkout development
git checkout -b release/v1.2.3

# Make changes and commit
git add .
git commit -m "Release v1.2.3"

# Push to trigger staging deployment
git push origin release/v1.2.3
# → Runs: All validation + automatic staging deployment
```

### **Production Workflow**

```bash
# Merge release branch to main
git checkout main
git merge release/v1.2.3

# Push to trigger production deployment (requires manual approval)
git push origin master
# → Runs: All validation + production deployment (with manual approval)
```

## 📋 **Environment Configuration**

### **Staging Environment**

- **Purpose**: Pre-production testing
- **Auto-deployment**: Yes (on `release*` branches)
- **Manual approval**: No
- **Infrastructure**: `infra/envs/staging/`

### **Production Environment**

- **Purpose**: Live production
- **Auto-deployment**: No (requires manual approval)
- **Manual approval**: Yes (configured reviewers)
- **Infrastructure**: `infra/envs/prod/`

## 🔍 **Monitoring Deployments**

### **GitHub Actions Dashboard**

1. Go to your repository
2. Click **Actions** tab
3. View deployment status and logs

### **Deployment Notifications**

The workflow includes notification steps for:

- ✅ Successful deployments
- ❌ Failed deployments
- 📊 Deployment metrics

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **1. Environment Not Found**

```
Error: Environment 'production' not found
```

**Solution**: Create the production environment in GitHub repository settings.

#### **2. Missing Secrets**

```
Error: Required secret 'AWS_ACCESS_KEY_ID' not found
```

**Solution**: Add the missing secret in GitHub repository settings.

#### **3. Terraform State Lock**

```
Error: Error acquiring the state lock
```

**Solution**: Check if another deployment is running, or force unlock if needed.

#### **4. AWS Credentials Invalid**

```
Error: The security token included in the request is invalid
```

**Solution**: Verify AWS credentials and permissions.

### **Debugging Steps**

1. **Check Workflow Logs**:
   - Go to Actions tab
   - Click on the failed workflow
   - Review step-by-step logs

2. **Verify Environment Variables**:
   - Ensure all required secrets are set
   - Check environment variable names

3. **Test Locally**:
   ```bash
   # Test deployment script locally
   npm run deploy -- --env=dev
   ```

## 📚 **Best Practices**

### **Security**

- ✅ Use least-privilege AWS IAM roles
- ✅ Rotate AWS credentials regularly
- ✅ Enable 2FA for GitHub accounts
- ✅ Require code review for all changes

### **Deployment Safety**

- ✅ Always test in staging first
- ✅ Use semantic versioning for releases
- ✅ Keep deployment logs for audit
- ✅ Set up rollback procedures

### **Monitoring**

- ✅ Monitor deployment success rates
- ✅ Set up alerts for failed deployments
- ✅ Track deployment frequency and timing
- ✅ Monitor infrastructure costs

## 🎯 **Next Steps**

1. **Set up GitHub secrets** as described above
2. **Create production environment** with protection rules
3. **Test the workflow** with a release branch
4. **Configure notifications** (Slack, Teams, etc.)
5. **Set up monitoring** for deployment metrics

## 📞 **Support**

For issues with the CI/CD pipeline:

1. Check the troubleshooting section above
2. Review GitHub Actions logs
3. Verify environment and secret configuration
4. Test deployment scripts locally

---

**Note**: This setup provides a production-ready CI/CD pipeline with proper safety gates and manual approval for production deployments.
