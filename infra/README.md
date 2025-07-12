# Terraform Infrastructure

This directory contains the infrastructure-as-code configuration for the PulseQueue application, following **DRY (Don't Repeat Yourself)** principles with a shared root module approach.

## 🚀 Bootstrap Infrastructure (S3 State Bucket + OIDC Provider)

Before deploying any environment, you must provision the foundational infrastructure:

- **S3 bucket** for Terraform state storage
- **OIDC provider and IAM role** for secure GitHub Actions authentication (no AWS access keys required)

**Deploy with:**

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

See [../../OIDC_SETUP.md](../OIDC_SETUP.md) for full details and migration steps.

**All environments depend on this bootstrap step being run first.**

---

## 🏗️ Architecture Overview

### **Shared Root Module Pattern**

Instead of duplicating `main.tf` files across environments, we use a **shared root module** (`modules/root/`) that contains all the common infrastructure configuration. Environment-specific values are passed via variables, making the infrastructure truly environment-agnostic.

```
infra/
├── modules/
│   ├── root/                    # 🎯 SHARED ROOT MODULE
│   │   ├── main.tf             # Complete infrastructure stack
│   │   ├── variables.tf        # All required variables
│   │   └── outputs.tf          # All resource outputs
│   ├── vpc/                    # VPC module
│   ├── lambda/                 # Lambda modules
│   ├── eventbridge/            # EventBridge modules
│   ├── dynamodb/               # DynamoDB modules
│   ├── monitoring/             # Monitoring modules
│   └── cloudwatch/             # CloudWatch modules
└── envs/
    ├── dev/                    # Development environment
    │   ├── main.tf            # 🎯 SIMPLE: Just calls root module
    │   ├── variables.tf       # Environment variables
    │   ├── terraform.tfvars   # Environment-specific values
    │   ├── dashboard-body.json # 🎯 TEMPLATE: Environment-agnostic dashboard
    │   └── backend.tf         # State configuration
    ├── staging/               # Staging environment
    │   ├── main.tf            # 🎯 SIMPLE: Just calls root module
    │   ├── variables.tf       # Environment variables
    │   ├── terraform.tfvars   # Environment-specific values
    │   ├── dashboard-body.json # 🎯 TEMPLATE: Environment-agnostic dashboard
    │   └── backend.tf         # State configuration
    └── prod/                  # Production environment
        ├── main.tf            # 🎯 SIMPLE: Just calls root module
        ├── variables.tf       # Environment variables
        ├── terraform.tfvars   # Environment-specific values
        ├── dashboard-body.json # 🎯 TEMPLATE: Environment-agnostic dashboard
        └── backend.tf         # State configuration
```

## 🎯 **Benefits of This Approach**

### ✅ **DRY Principle**

- **Single source of truth** for infrastructure configuration
- **No code duplication** across environments
- **Consistent architecture** across all environments

### ✅ **Environment-Agnostic**

- **True environment isolation** with separate state files
- **Environment-specific values** via variables only
- **No hardcoded environment values** in the shared module
- **Template-based dashboard configuration** with automatic substitution

### ✅ **Maintainability**

- **Changes in one place** affect all environments
- **Easy to add new environments** (just copy and configure)
- **Clear separation** between shared and environment-specific code

### ✅ **Best Practices**

- **Modular design** with reusable components
- **Comprehensive validation** on all variables
- **Proper state isolation** per environment
- **Security best practices** built-in

## 🚀 **Usage**

### **Deploy to Development**

```bash
cd infra/envs/dev
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

### **Deploy to Staging**

```bash
cd infra/envs/staging
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

### **Deploy to Production**

```bash
cd infra/envs/prod
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

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

This architecture provides a **production-ready, maintainable, and scalable** infrastructure foundation that follows industry best practices and can easily accommodate future growth and changes.
