# Branch Strategy Guide

This guide explains the proper branch strategy for the TypeScript PulseQueue project, ensuring clean separation between development and production code.

## 🎯 **Branch Strategy Overview**

### **Branch Hierarchy**

```
master (production)
├── development (integration)
│   ├── feature/new-feature
│   ├── feature/bug-fix
│   └── release/v1.2.3
```

### **Branch Purposes**

#### **`master` Branch**

- **Purpose**: Production-ready code only
- **Deployment**: Production environment (with manual approval)
- **Workflow**: Only receives merges from release branches
- **Protection**: Should be protected in GitHub settings

#### **`development` Branch**

- **Purpose**: Integration branch for ongoing development
- **Deployment**: None (validation only)
- **Workflow**: Receives merges from feature branches
- **Protection**: Should be protected in GitHub settings

#### **`release/*` Branches**

- **Purpose**: Pre-production testing and staging deployment
- **Deployment**: Staging environment (automatic)
- **Workflow**: Created from development, merged to master
- **Naming**: `release/v1.2.3`, `release/hotfix-123`

#### **`feature/*` Branches**

- **Purpose**: Individual feature development
- **Deployment**: None (validation only)
- **Workflow**: Created from development, merged back to development
- **Naming**: `feature/user-authentication`, `feature/payment-integration`

## 🔄 **Development Workflow**

### **1. Starting New Development**

```bash
# Ensure you're on development branch
git checkout development
git pull origin development

# Create feature branch
git checkout -b feature/new-feature
```

### **2. Development Process**

```bash
# Make your changes
# ... edit files ...

# Commit your changes
git add .
git commit -m "Add new feature: user authentication"

# Push to remote
git push origin feature/new-feature
# → Triggers: Code quality, testing, security scanning, Terraform validation
# → No deployment (validation only)
```

### **3. Feature Completion**

```bash
# Create pull request from feature branch to development
# GitHub will run all validation checks

# After approval, merge to development
git checkout development
git pull origin development
git merge feature/new-feature
git push origin development

# Clean up feature branch
git branch -d feature/new-feature
git push origin --delete feature/new-feature
```

## 🚀 **Release Workflow**

### **1. Creating a Release**

```bash
# Start from development branch
git checkout development
git pull origin development

# Create release branch
git checkout -b release/v1.2.3

# Make any release-specific changes
# ... version updates, release notes, etc ...

# Commit release changes
git add .
git commit -m "Release v1.2.3"

# Push to trigger staging deployment
git push origin release/v1.2.3
# → Automatically deploys to staging environment
# → Runs post-deploy tests
```

### **2. Staging Testing**

- ✅ **Verify staging deployment** is successful
- ✅ **Run integration tests** on staging environment
- ✅ **Perform user acceptance testing**
- ✅ **Check monitoring and logs**

### **3. Production Deployment**

```bash
# Merge release to master
git checkout master
git pull origin master
git merge release/v1.2.3

# Push to trigger production deployment
git push origin master
# → Requires manual approval for production deployment
# → Runs all validation + production deployment
```

### **4. Release Cleanup**

```bash
# Clean up release branch
git branch -d release/v1.2.3
git push origin --delete release/v1.2.3

# Tag the release
git tag v1.2.3
git push origin v1.2.3
```

## 🛠️ **Hotfix Workflow**

### **1. Critical Bug Fix**

```bash
# Create hotfix from master
git checkout master
git pull origin master
git checkout -b hotfix/critical-bug-123

# Make the fix
# ... emergency changes ...

# Commit the fix
git add .
git commit -m "Hotfix: Fix critical authentication bug"

# Push to trigger staging deployment
git push origin hotfix/critical-bug-123
# → Deploys to staging for quick testing
```

### **2. Emergency Production Deployment**

```bash
# Merge hotfix to master
git checkout master
git pull origin master
git merge hotfix/critical-bug-123

# Push to trigger production deployment
git push origin master
# → Requires manual approval for production deployment
```

### **3. Backport to Development**

```bash
# Merge hotfix to development
git checkout development
git pull origin development
git merge hotfix/critical-bug-123
git push origin development

# Clean up hotfix branch
git branch -d hotfix/critical-bug-123
git push origin --delete hotfix/critical-bug-123
```

## 📋 **Branch Protection Rules**

### **Master Branch Protection**

- ✅ **Require pull request reviews** (at least 2 reviewers)
- ✅ **Require status checks to pass** before merging
- ✅ **Require branches to be up to date** before merging
- ✅ **Restrict pushes** (no direct pushes to master)
- ✅ **Require linear history** (no merge commits)

### **Development Branch Protection**

- ✅ **Require pull request reviews** (at least 1 reviewer)
- ✅ **Require status checks to pass** before merging
- ✅ **Allow force pushes** (for rebasing)
- ✅ **Allow deletions** (for cleanup)

## 🔍 **CI/CD Integration**

### **Branch-Specific Actions**

#### **Feature Branches**

- ✅ **Code quality checks** (ESLint, TypeScript)
- ✅ **Unit tests** (Jest)
- ✅ **Security scanning** (Trivy)
- ✅ **Terraform validation** (plan only)
- ❌ **No deployment**

#### **Development Branch**

- ✅ **All feature branch checks**
- ✅ **Integration tests**
- ✅ **Infrastructure validation**
- ❌ **No deployment**

#### **Release Branches**

- ✅ **All development checks**
- ✅ **Staging deployment** (automatic)
- ✅ **Post-deploy tests**
- ✅ **Monitoring setup**

#### **Master Branch**

- ✅ **All release checks**
- ✅ **Production deployment** (manual approval)
- ✅ **Production tests**
- ✅ **Production monitoring**

## 🎯 **Best Practices**

### **Commit Messages**

```bash
# Feature commits
git commit -m "feat: Add user authentication system"

# Bug fixes
git commit -m "fix: Resolve payment processing timeout"

# Documentation
git commit -m "docs: Update deployment guide"

# Release commits
git commit -m "release: v1.2.3 - User authentication and payment improvements"
```

### **Branch Naming**

```bash
# Features
feature/user-authentication
feature/payment-integration
feature/monitoring-dashboard

# Bug fixes
fix/payment-timeout
fix/auth-validation

# Releases
release/v1.2.3
release/v2.0.0

# Hotfixes
hotfix/critical-security-patch
hotfix/database-connection-issue
```

### **Code Review Guidelines**

- ✅ **Review for functionality** and correctness
- ✅ **Check for security** vulnerabilities
- ✅ **Verify test coverage** is adequate
- ✅ **Ensure documentation** is updated
- ✅ **Validate infrastructure** changes

## 🚨 **Emergency Procedures**

### **Rollback Production**

```bash
# Revert to previous release
git checkout master
git revert HEAD
git push origin master
# → Triggers production deployment with rollback
```

### **Hotfix Deployment**

```bash
# Create emergency hotfix
git checkout master
git checkout -b hotfix/emergency-fix
# ... make changes ...
git push origin hotfix/emergency-fix
# → Deploy to staging for quick validation
# → Then merge to master for production
```

## 📊 **Monitoring & Metrics**

### **Deployment Tracking**

- ✅ **Track deployment frequency** by branch
- ✅ **Monitor deployment success rates**
- ✅ **Track time from commit to production**
- ✅ **Monitor rollback frequency**

### **Quality Metrics**

- ✅ **Code coverage** trends
- ✅ **Security vulnerability** detection
- ✅ **Test failure rates**
- ✅ **Build time** optimization

---

**Note**: This branch strategy ensures clean separation between development and production code, with proper validation at each stage and safe deployment practices.
