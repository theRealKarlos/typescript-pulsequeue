# Deployment Guide

This guide covers the complete deployment process for the TypeScript PulseQueue application, following industry best practices for production-ready deployments.

## 🚀 Prerequisites

### Required Tools

- **Node.js 22.x**: For TypeScript compilation and testing
- **Terraform 1.7.0+**: For infrastructure management
- **AWS CLI**: For AWS authentication and configuration
- **Git**: For version control

### AWS Account Setup

1. **IAM User with Permissions**:

   ```bash
   # Required permissions for deployment
   - Lambda: Full access
   - EventBridge: Full access
   - DynamoDB: Full access
   - API Gateway: Full access
   - CloudWatch: Full access
   - VPC: Full access
   - ECS: Full access (for monitoring)
   - S3: Full access (for Terraform state)
   ```

2. **AWS Credentials Configuration**:
   ```bash
   aws configure
   # Enter your AWS Access Key ID
   # Enter your AWS Secret Access Key
   # Enter your default region (eu-west-2)
   ```

## 📋 Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing (`npm test`)
- [ ] ESLint checks passing (`npm run lint:all`)
- [ ] TypeScript compilation successful (`npx tsc --noEmit`)
- [ ] No security vulnerabilities (`npm audit`)
- [ ] Code review completed

### Infrastructure

- [ ] Terraform state backend configured
- [ ] Environment variables set
- [ ] Secrets management configured
- [ ] Network configuration reviewed
- [ ] Security groups configured

### Monitoring

- [ ] CloudWatch dashboards configured
- [ ] Alerting rules set up
- [ ] Log retention policies configured
- [ ] Metrics collection enabled

## 🔧 Local Development Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd TypeScript-PulseQueue
npm install
```

### 2. Environment Configuration

```bash
# Create environment-specific configuration
cp infra/envs/dev/terraform.tfvars.example infra/envs/dev/terraform.tfvars

# Edit terraform.tfvars with your values
# Set grafana_admin_password via environment variable
export TF_VAR_grafana_admin_password="your-secure-password"
```

### 3. Build and Test

```bash
# Run all tests
npm test

# Build Lambda packages
npm run build:lambda:dev

# Run linting
npm run lint:all
```

## 🏗️ Infrastructure Deployment

### 1. Bootstrap (First Time Only)

```bash
# Initialize Terraform state backend
cd infra/bootstrap
terraform init
terraform apply
```

### 2. Environment Deployment

```bash
# Navigate to environment directory
cd infra/envs/dev

# Initialize Terraform
terraform init

# Plan deployment
terraform plan -var-file=terraform.tfvars

# Apply deployment
terraform apply -var-file=terraform.tfvars
```

### 3. Post-Deployment Verification

```bash
# Run integration tests
npm run postdeploy:dev

# Check Lambda functions
aws lambda list-functions --region eu-west-2

# Verify EventBridge buses
aws events list-event-buses --region eu-west-2

# Check DynamoDB table
aws dynamodb describe-table --table-name dev-inventory --region eu-west-2
```

## 🔄 **Environment-Agnostic Deployment**

### **🎯 Deployment Strategy**

This project uses a **two-tier deployment approach**:

#### **1. Development Environment (Manual)**

- **Purpose**: Local development, testing, and experimentation
- **Method**: Direct deployment using `deploy.ts` script
- **Usage**: `npm run deploy -- --env=dev`

#### **2. Staging & Production (Automated CI/CD)**

- **Purpose**: Pre-production testing and live production
- **Method**: GitHub Actions with branch-based triggers
- **Intended Workflow**:
  - Push to `release*` branch → **Auto-deploy to staging**
  - Push to `main` branch → **Manual approval required for production**

### **Automated Deployment Pipeline**

The project includes a **completely environment-agnostic deployment script** that handles all environments consistently:

```bash
# Deploy to development (intended for local development)
npm run deploy -- --env=dev

# Deploy to staging (for testing deployment scripts only)
npm run deploy -- --env=staging

# Deploy to production (for testing deployment scripts only)
npm run deploy -- --env=prod
```

**⚠️ Important**: The `deploy.ts` script supports staging and production environments for **completeness and testing purposes only**. The intended deployment method for staging and production is via **GitHub Actions CI/CD pipeline**.

### **Intended CI/CD Workflow**

#### **For Staging Deployment**:

```bash
# Create a release branch
git checkout -b release/v1.2.3

# Make your changes
git add .
git commit -m "Release v1.2.3"

# Push to trigger staging deployment
git push origin release/v1.2.3
# → Automatically deploys to staging environment
```

#### **For Production Deployment**:

```bash
# Merge release branch to master
git checkout master
git merge release/v1.2.3

# Push to trigger production deployment (requires manual approval)
git push origin master
# → Requires manual approval for production deployment
```

### **Branch Naming Convention**

- `release*` branches → **Auto-deploy to staging**
- `master` branch → **Manual approval for production**

### **Deployment Pipeline Steps**

The automated pipeline includes:

1. **Code Quality Check** (ESLint)
2. **Unit Tests** (Jest)
3. **Lambda Build** (esbuild)
4. **Terraform Plan**
5. **Terraform Apply**
6. **Post-Deploy Tests**

### **Environment-Specific Scripts**

All environments have dedicated npm scripts:

```bash
# Development (intended for local development)
npm run deploy:dev
npm run plan:dev
npm run apply:dev
npm run postdeploy:dev

# Staging (for testing deployment scripts only)
npm run deploy:staging
npm run plan:staging
npm run apply:staging
npm run postdeploy:staging

# Production (for testing deployment scripts only)
npm run deploy:prod
npm run plan:prod
npm run apply:prod
npm run postdeploy:prod
```

### **Environment Variables**

The deployment automatically sets environment variables:

- `ENVIRONMENT`: `dev`, `staging`, or `prod`
- `AWS_REGION`: `eu-west-2` (or configured region)

## 📋 **Environment Configuration**

### **Development (`dev/`)**

- **Purpose**: Local development and testing
- **Settings**: Lower resources, faster deployments
- **CIDR**: `10.0.0.0/16`
- **Lambda Memory**: 256MB
- **Lambda Timeout**: 30s

### **Staging (`staging/`)**

- **Purpose**: Pre-production testing
- **Settings**: Production-like configuration
- **CIDR**: `10.1.0.0/16`
- **Lambda Memory**: 512MB
- **Lambda Timeout**: 60s

### **Production (`prod/`)**

- **Purpose**: Live production environment
- **Settings**: High-performance configuration
- **CIDR**: `10.2.0.0/16`
- **Lambda Memory**: 1024MB
- **Lambda Timeout**: 60s

## 🔧 **Adding a New Environment**

To add a new environment (e.g., `test`):

1. **Create environment directory**:

   ```bash
   mkdir infra/envs/test
   ```

2. **Copy base files**:

   ```bash
   cp infra/envs/dev/* infra/envs/test/
   ```

3. **Update configuration**:
   - Edit `terraform.tfvars` with environment-specific values
   - Update `backend.tf` with correct state key
   - Update `main.tf` if needed (usually not required)

4. **Deploy**:
   ```bash
   cd infra/envs/test
   terraform init
   terraform apply -var-file=terraform.tfvars
   ```

## 🏗️ **Infrastructure Components**

The shared root module deploys:

### **Networking**

- VPC with public subnets
- Security groups
- Internet Gateway

### **Compute**

- Lambda functions (order, payment, metrics services)
- API Gateway for metrics endpoint

### **Data**

- DynamoDB inventory table
- EventBridge buses (order, payment)

### **Monitoring**

- Prometheus for metrics collection
- Grafana for visualization
- CloudWatch dashboards with **template-based configuration**

### **Security**

- IAM roles and policies
- Encryption at rest
- Point-in-time recovery

## 📊 **Template-Based Dashboard Configuration**

### **Environment-Agnostic Dashboard Templates**

The dashboard configuration uses **template substitution** to automatically adapt to each environment:

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Lambda", "Invocations", "FunctionName", "${environment}-order-service-handler"],
          [".", "Errors", ".", "."]
        ],
        "region": "${region}",
        "title": "Order Lambda Invocations & Errors"
      }
    }
  ]
}
```

### **Automatic Substitution**

The root module automatically replaces:

- `${environment}` → `dev`, `staging`, or `prod`
- `${region}` → `eu-west-2` (or configured region)

This ensures that:

- ✅ **No hardcoded environment names** in dashboard configuration
- ✅ **Consistent dashboard structure** across environments
- ✅ **Automatic resource name adaptation** per environment
- ✅ **Single dashboard template** for all environments

## 🔍 **State Management**

Each environment has its own Terraform state file:

- **Development**: `envs/dev/terraform.tfstate`
- **Staging**: `envs/staging/terraform.tfstate`
- **Production**: `envs/prod/terraform.tfstate`

This ensures complete isolation between environments and prevents accidental cross-environment deployments.

## 🛡️ **Security Considerations**

### **Secrets Management**

- **Grafana passwords** via environment variables
- **No hardcoded secrets** in configuration
- **Sensitive variables** properly marked

### **Network Security**

- **VPC isolation** per environment
- **Security groups** with minimal required access
- **Encryption** enabled for all data

### **Access Control**

- **IAM least privilege** principles
- **Environment-specific roles**
- **Proper resource tagging**

## 📊 **Monitoring and Observability**

### **Infrastructure Monitoring**

- **CloudWatch dashboards** for AWS resources
- **Custom metrics** via Lambda functions
- **Log aggregation** and analysis

### **Application Monitoring**

- **Prometheus** for application metrics
- **Grafana** for visualization
- **X-Ray tracing** for distributed tracing

## 🔄 **CI/CD Integration**

The infrastructure is designed to work seamlessly with CI/CD pipelines:

- **Environment-agnostic deployment** scripts
- **Automated testing** post-deployment
- **Rollback capabilities** via Terraform
- **State locking** for concurrent deployments

## 📚 **Best Practices Followed**

1. **DRY Principle**: No code duplication
2. **Environment Isolation**: Separate state files
3. **Modular Design**: Reusable components
4. **Security First**: Encryption and IAM best practices
5. **Monitoring**: Comprehensive observability
6. **Documentation**: Clear and comprehensive
7. **Validation**: Input validation on all variables
8. **Tagging**: Consistent resource tagging strategy
9. **Template-Based Configuration**: Environment-agnostic dashboard templates

## 🎯 **Deployment Strategy Summary**

### **Development Environment**

- ✅ **Manual deployment** using `deploy.ts` script
- ✅ **Local development** and testing
- ✅ **Direct control** over deployment process

### **Staging Environment**

- ✅ **Automated deployment** via GitHub Actions
- ✅ **Triggered by** `release*` branch pushes
- ✅ **Pre-production testing** and validation

### **Production Environment**

- ✅ **Automated deployment** via GitHub Actions
- ✅ **Triggered by** `main` branch pushes
- ✅ **Manual approval** required for safety
- ✅ **Production-grade** security and monitoring

This deployment system provides a **production-ready, maintainable, and scalable** deployment foundation that follows industry best practices and can easily accommodate future growth and changes.

## 🔗 **Related Documentation**

- **[GITHUB_SETUP.md](./GITHUB_SETUP.md)**: Complete guide for setting up GitHub Actions with manual approval
- **[MONITORING.md](./MONITORING.md)**: Monitoring and observability configuration
- **[SECURITY.md](./SECURITY.md)**: Security best practices and considerations
