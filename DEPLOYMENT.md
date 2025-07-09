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

## 🔄 CI/CD Pipeline Deployment

### GitHub Actions Setup

1. **Repository Secrets**:
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
   - `GRAFANA_ADMIN_PASSWORD`: Grafana admin password

2. **Pipeline Triggers**:
   - Push to `main` branch: Full deployment
   - Push to `develop` branch: Testing only
   - Pull requests: Validation and testing

### Pipeline Stages

1. **Code Quality**:
   - ESLint validation
   - TypeScript compilation
   - Unit tests
   - Security audit

2. **Infrastructure Validation**:
   - Terraform format check
   - Terraform validation
   - Terraform plan (dry run)

3. **Security Scanning**:
   - Trivy vulnerability scan
   - Dependency analysis
   - Code security review

4. **Deployment** (Main branch only):
   - Build Lambda packages
   - Terraform apply
   - Post-deployment tests
   - Monitoring setup

## 🔍 Monitoring and Observability

### CloudWatch Dashboards

- **Lambda Metrics**: Invocations, errors, duration
- **EventBridge Metrics**: Event processing, failures
- **DynamoDB Metrics**: Read/write capacity, throttling
- **Custom Metrics**: Business-specific KPIs

### Grafana Dashboards

- **Application Overview**: End-to-end system health
- **Performance Metrics**: Response times, throughput
- **Error Tracking**: Error rates, failure patterns
- **Business Metrics**: Order processing, inventory levels

### Alerting

```yaml
# Example CloudWatch Alarms
- High Error Rate: > 5% error rate
- High Latency: > 30 seconds response time
- Low Inventory: < 10 items in stock
- EventBridge Failures: > 0 failed events
```

## 🛡️ Security Considerations

### Secrets Management

```bash
# Use AWS Secrets Manager for production
aws secretsmanager create-secret \
  --name "pulsequeue/grafana-password" \
  --secret-string "your-secure-password"

# Reference in Terraform
data "aws_secretsmanager_secret" "grafana_password" {
  name = "pulsequeue/grafana-password"
}
```

### Network Security

- **VPC Configuration**: Private subnets for monitoring
- **Security Groups**: Minimal required access
- **NACLs**: Additional network layer security
- **VPC Endpoints**: Private AWS service access

### IAM Best Practices

- **Least Privilege**: Minimal required permissions
- **Role-Based Access**: Environment-specific roles
- **Temporary Credentials**: Use AWS STS for CI/CD
- **Cross-Account Access**: Proper trust relationships

## 🔄 Environment Management

### Development Environment

```bash
# Deploy to dev
cd infra/envs/dev
terraform apply -var-file=terraform.tfvars
```

### Staging Environment

```bash
# Create staging configuration
cp infra/envs/dev infra/envs/staging
# Modify terraform.tfvars for staging
terraform apply -var-file=staging.tfvars
```

### Production Environment

```bash
# Production deployment with additional security
cd infra/envs/prod
terraform apply -var-file=prod.tfvars
```

## 🚨 Troubleshooting

### Common Issues

1. **Terraform State Lock**:

   ```bash
   terraform force-unlock <lock-id>
   ```

2. **Lambda Deployment Issues**:

   ```bash
   # Check Lambda logs
   aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/dev-"
   ```

3. **EventBridge Rule Issues**:

   ```bash
   # Test event routing
   aws events test-event-pattern --event-pattern file://pattern.json --event file://event.json
   ```

4. **DynamoDB Access Issues**:
   ```bash
   # Verify table permissions
   aws dynamodb describe-table --table-name dev-inventory
   ```

### Rollback Procedures

```bash
# Infrastructure rollback
terraform plan -var-file=terraform.tfvars -destroy
terraform apply -var-file=terraform.tfvars

# Application rollback
# Deploy previous Lambda version
aws lambda update-function-code --function-name dev-order-service-handler --zip-file fileb://previous.zip
```

## 📊 Performance Optimization

### Lambda Optimization

- **Memory Allocation**: Optimize based on workload
- **Timeout Configuration**: Balance between cost and reliability
- **Cold Start Mitigation**: Provisioned concurrency for critical functions
- **Code Optimization**: Minimize bundle size

### DynamoDB Optimization

- **Read/Write Capacity**: Monitor and adjust as needed
- **Indexing Strategy**: Optimize for query patterns
- **Partition Key Design**: Even distribution of data
- **TTL Configuration**: Automatic cleanup of old data

### Monitoring Optimization

- **Metric Retention**: Configure appropriate retention periods
- **Log Aggregation**: Centralized logging strategy
- **Alert Thresholds**: Fine-tune based on business requirements
- **Cost Monitoring**: Track AWS resource costs

## 📚 Additional Resources

- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/index.html)
- [EventBridge Best Practices](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-best-practices.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)

---

**Note**: This deployment guide should be updated as the application evolves and new best practices emerge.
