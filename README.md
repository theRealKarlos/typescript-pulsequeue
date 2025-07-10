# TypeScript PulseQueue

A modern, type-safe, event-driven serverless e-commerce application built with TypeScript, AWS Lambda, EventBridge, DynamoDB, and comprehensive monitoring. This project demonstrates best practices for scalable, decoupled architectures, robust testing, infrastructure-as-code, and observability.

**⚠️ Disclaimer:** This is a lab project designed to demonstrate production-ready patterns and best practices. While every effort has been made to follow industry standards and ensure robustness, **no guarantees are given for actual production use**. Users should thoroughly review, test, and adapt the code and infrastructure to their own requirements before deploying in a real-world environment.

**🚀 Production-Ready (Aspirational):** The aim of this project is to be as close to production-ready as possible for educational and demonstration purposes.

---

## Environment-Agnostic Deployment

- **Strict Environment Variable Requirement:** All scripts and Lambda code require the `ENVIRONMENT` environment variable to be set. If not set, deployment and tests will fail fast.
- **No Fallbacks:** There is no default to `dev`—the environment must be explicitly specified for every deployment, test, or script run.
- **Terraform State Isolation:** Each environment (dev, staging, prod, etc.) has its own `backend.tf` file with a hardcoded S3 key for state isolation. Variables are not used in the backend block.
- **Lambda Environment Variables:** The `ENVIRONMENT` variable is injected into all Lambda functions via Terraform, ensuring dynamic resource naming and true environment agnosticism.
- **Deployment Script:** The `deploy.ts` script requires `--env` to be specified and propagates the environment variable to all build, test, and deployment steps.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Security Features](#security-features)
- [Getting Started](#getting-started)
- [Development & Testing](#development--testing)
- [Deployment](#deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring](#monitoring)
- [Project Structure](#project-structure)
- [Event & Test File Reference](#event--test-file-reference)
- [Best Practices](#best-practices)
- [Future Improvements](#future-improvements)
- [License](#license)

---

## Overview

TypeScript PulseQueue is a concept/prototype app that demonstrates event-driven architecture using AWS services and TypeScript. It processes order events through a decoupled system with EventBridge routing and DynamoDB for inventory management. The goal is to showcase best practices for TypeScript, AWS Lambda, and infrastructure-as-code in a modern event-driven design.

### Key Features

- **EventBridge-Driven Lambda**: End-to-end event-driven flows
- **Type Safety**: Full TypeScript implementation, no `any` types
- **Robust Testing**: Jest-based unit tests, automated post-deploy integration tests
- **Environment-Aware Infrastructure**: Modular, reusable, and isolated by environment
- **Code Quality**: ESLint integration and automated checks
- **Infrastructure as Code**: Terraform-managed AWS resources
- **Comprehensive Monitoring**: Prometheus metrics, Grafana dashboards, CloudWatch integration
- **Inventory Management**: DynamoDB-based stock reservation and tracking
- **Payment Processing**: Simulated payment flows with success/failure scenarios
- **Security First**: IAM least privilege, encryption at rest, comprehensive security practices
- **CI/CD Pipeline**: Automated testing, security scanning, and deployment

---

## Architecture

### Core Components

- **Order Lambda**: Receives order events, reserves inventory, emits payment events
- **Payment Lambda**: Processes payment events, updates inventory based on payment outcome
- **Metrics Lambda**: Exposes Prometheus metrics for monitoring
- **EventBridge Buses**: Route events between services
- **DynamoDB Table**: Stores inventory state
- **API Gateway**: Exposes metrics endpoint for Prometheus scraping
- **Monitoring Stack**: Prometheus and Grafana for observability

### Event Flow

```
OrderPlaced (EventBridge) → Order Lambda → PaymentRequested (EventBridge) → Payment Lambda → DynamoDB
                                                      ↓
                                              Metrics Collection
                                                      ↓
                                              Prometheus → Grafana
```

- **Order Lambda** increments `reserved` in DynamoDB and emits a payment event
- **Payment Lambda** decrements `reserved` and, on success, decrements `stock`
- **Metrics Collection** tracks performance, errors, and business metrics
- **Monitoring** provides real-time visibility into system health and performance

---

## Technology Stack

- **TypeScript** (strict, type-safe)
- **AWS Lambda** (Node.js 22.x)
- **AWS EventBridge** (event routing)
- **AWS DynamoDB** (inventory state)
- **AWS API Gateway** (metrics endpoint)
- **AWS CloudWatch** (metrics persistence)
- **Prometheus** (metrics collection)
- **Grafana** (monitoring dashboards)
- **Terraform** (infrastructure as code)
- **Jest** (unit testing)
- **ESLint** (code quality)
- **ts-node** (script execution)

---

## Security Features

### 🔐 Infrastructure Security

- **IAM Least Privilege**: All Lambda functions have minimal required permissions
- **Encryption at Rest**: DynamoDB tables use AWS managed KMS keys
- **Point-in-Time Recovery**: Enabled for data protection
- **VPC Security**: Resources deployed in private subnets where applicable
- **Security Groups**: Minimal required access rules

### 🛡️ Application Security

- **Type Safety**: No `any` types, comprehensive input validation
- **Error Handling**: Proper error boundaries and logging
- **Dependency Scanning**: Regular security audits via `npm audit`
- **Secrets Management**: Externalized configuration, no hardcoded secrets

### 🔍 Security Monitoring

- **CloudWatch Logs**: Centralized logging with retention policies
- **Security Scanning**: Trivy vulnerability scanning in CI/CD
- **Audit Trail**: Complete event flow tracking
- **Error Tracking**: Comprehensive error logging and alerting

For detailed security information, see [SECURITY.md](./SECURITY.md).

---

## Getting Started

### Prerequisites

- Node.js 22.x
- AWS CLI configured
- Terraform installed
- AWS credentials with appropriate permissions

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd TypeScript-PulseQueue

# Install dependencies
npm install

# Set up AWS credentials
aws configure
```

---

## Development & Testing

### Unit Testing (Jest)

- All Lambda handlers have dedicated Jest test files (e.g., `scripts/order-service-handler.test.ts`)
- AWS SDK calls are mocked (no real AWS calls)
- Event payloads are provided as JSON files (see below)
- Run all unit tests:
  ```bash
  npm test
  # or for a specific handler
  npm run test:order-service
  ```
- **Unit test event file:** `scripts/order-service-event.local.json`
  ```json
  {
    "orderId": "test-order-123",
    "customerId": "test-customer-123",
    "items": [{ "sku": "prod-001", "quantity": 2 }]
  }
  ```

### Integration/Post-Deploy Testing

- Automated end-to-end test script: `scripts/post-deploy-test.ts`
- Uses `scripts/order-service-events.json` for test scenarios:
  ```json
  {
    "success": {
      "orderId": "test-success-123",
      "customerId": "customer-1",
      "items": [{ "sku": "prod-001", "quantity": 2 }]
    },
    "failure": {
      "orderId": "test-failure-456",
      "customerId": "customer-1",
      "items": [{ "sku": "prod-001", "quantity": 2 }]
    }
  }
  ```
- The script:
  - Resets inventory before each test
  - Sends both success and failure events
  - Waits for both Lambdas to process
  - Checks logs for expected outcomes
  - Asserts DynamoDB state is correct
- Run manually:
  ```bash
  npx ts-node scripts/post-deploy-test.ts
  ```
- Or as part of the deployment pipeline (see below)

---

## Deployment

### 🎯 **Deployment Strategy**

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

### **Development Deployment**

For local development and testing:

```bash
# Deploy to development environment
npm run deploy -- --env=dev

# Or use the shortcut
npm run deploy:dev
```

This will:

1. Run ESLint code quality checks
2. Run all Jest unit tests
3. Build the Lambda package(s)
4. Run Terraform plan & apply
5. Run the post-deploy integration test
6. Set up monitoring infrastructure (Prometheus & Grafana)

### **Staging & Production Deployment**

**⚠️ Important**: The `deploy.ts` script supports staging and production environments for **completeness and testing purposes only**. The intended deployment method for staging and production is via **GitHub Actions CI/CD pipeline**.

#### **Intended CI/CD Workflow**:

```bash
# For staging deployment
git checkout -b release/v1.2.3
git push origin release/v1.2.3
# → Automatically deploys to staging environment

# For production deployment
git checkout master
git merge release/v1.2.3
git push origin master
# → Requires manual approval for production deployment
```

#### **Branch Naming Convention**:

- `release*` branches → **Auto-deploy to staging**
- `master` branch → **Manual approval for production**

#### **Manual Deployment (For Testing)**:

```bash
# Only use these for testing the deployment scripts
npm run deploy -- --env=staging  # Testing only
npm run deploy -- --env=prod     # Testing only
```

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## CI/CD Pipeline

### **Automated Pipeline Features**

- **Code Quality**: ESLint, TypeScript compilation, unit tests
- **Security Scanning**: Trivy vulnerability scanning, dependency audits
- **Infrastructure Validation**: Terraform format check, validation, plan review
- **Automated Deployment**: Build, test, and deploy on master branch
- **Post-Deployment Testing**: Integration tests after deployment
- **Security Notifications**: Alert on security issues

### **Pipeline Stages**

1. **Code Quality & Testing**
   - ESLint validation
   - TypeScript compilation
   - Unit tests
   - Security audit

2. **Infrastructure Validation**
   - Terraform format check
   - Terraform validation
   - Terraform plan (dry run)

3. **Security Scanning**
   - Trivy vulnerability scan
   - Dependency analysis
   - Code security review

4. **Deployment** (Master branch only)
   - Build Lambda packages
   - Terraform apply
   - Post-deployment tests
   - Monitoring setup

### **Branch-Based Deployment Strategy**

#### **Development Branch** (`development`, `feature/*`)

- ✅ **Code Quality Checks**: ESLint, TypeScript, unit tests
- ✅ **Security Scanning**: Vulnerability checks, dependency audits
- ✅ **Infrastructure Validation**: Terraform plan (dry run)
- ❌ **No Deployment**: Only validation and testing

#### **Release Branch** (`release*`)

- ✅ **All Development Checks**: Code quality, security, validation
- ✅ **Staging Deployment**: Automatic deployment to staging environment
- ✅ **Post-Deploy Tests**: Integration tests on staging
- ❌ **No Production Deployment**: Staging only

#### **Master Branch** (`master`)

- ✅ **All Previous Checks**: Code quality, security, validation
- ✅ **Production Deployment**: Manual approval required
- ✅ **Production Tests**: Post-deploy tests on production
- ✅ **Monitoring Setup**: Production monitoring configuration

For detailed CI/CD configuration, see [.github/workflows/ci-cd.yml](./.github/workflows/ci-cd.yml).

For GitHub Actions setup and manual approval configuration, see [GITHUB_SETUP.md](./GITHUB_SETUP.md).

For detailed branch strategy and workflow, see [BRANCH_STRATEGY.md](./BRANCH_STRATEGY.md).

---

## Monitoring

### Overview

The application includes comprehensive monitoring with Prometheus metrics collection and Grafana dashboards for real-time observability. The monitoring architecture is designed to handle the challenges of serverless environments where Lambda functions have no persistent state between invocations.

### Monitoring Architecture

#### Why CloudWatch + Prometheus?

**Problem**: Lambda functions lose in-memory metrics between invocations. Traditional Prometheus scraping from Lambda endpoints would only capture metrics from the current invocation, missing historical data.

**Solution**: Hybrid approach using both CloudWatch and Prometheus:

1. **CloudWatch Metrics**: Real-time Lambda metrics (invocations, errors, duration)
2. **Prometheus Metrics**: Custom business metrics (order processing, inventory levels)
3. **Grafana Dashboards**: Unified view combining both metric sources

### Monitoring Components

#### CloudWatch Dashboards

- **Lambda Performance**: Invocations, errors, duration, memory usage
- **EventBridge Metrics**: Event processing, failures, throughput
- **DynamoDB Metrics**: Read/write capacity, throttling, errors
- **API Gateway Metrics**: Request count, latency, error rates

#### Prometheus Metrics

- **Business Metrics**: Order processing rates, inventory levels
- **Custom Counters**: Stock reservations, payment success/failure
- **Performance Metrics**: Lambda execution times, error rates
- **Inventory Tracking**: Stock levels, reserved quantities

#### Grafana Dashboards

- **Application Overview**: End-to-end system health
- **Performance Metrics**: Response times, throughput, error rates
- **Business Metrics**: Order processing, inventory management
- **Infrastructure Health**: AWS service status, resource utilization

### Alerting Configuration

```yaml
# Example CloudWatch Alarms
- High Error Rate: > 5% error rate
- High Latency: > 30 seconds response time
- Low Inventory: < 10 items in stock
- EventBridge Failures: > 0 failed events
```

### Accessing Monitoring

1. **Grafana Dashboard**: Access via the deployed Grafana instance
   - URL: `http://<ecs-public-ip>:3000`
   - Username: `admin`
   - Password: Set via `TF_VAR_grafana_admin_password`

2. **CloudWatch Dashboards**: Access via AWS Console
   - Navigate to CloudWatch > Dashboards
   - Look for dashboards prefixed with `dev-pulsequeue-dashboard`

3. **Prometheus Metrics**: Access via API Gateway
   - URL: `https://<api-gateway-url>/metrics`
   - Returns Prometheus-formatted metrics

### Setting Up Monitoring

```bash
# Deploy monitoring infrastructure
npm run deploy:dev:ts

# Access Grafana dashboard
# Navigate to the ECS public IP on port 3000
# Login with admin / your-password

# View CloudWatch dashboards
# Navigate to AWS Console > CloudWatch > Dashboards
```

For detailed monitoring setup, see [MONITORING.md](./MONITORING.md).

---

## Project Structure

```
TypeScript-PulseQueue/
├── .github/workflows/          # CI/CD pipeline configuration
├── infra/                      # Terraform infrastructure
│   ├── bootstrap/              # Terraform state backend setup
│   ├── envs/dev/              # Development environment
│   └── modules/               # Reusable Terraform modules
│       ├── api-gateway/       # API Gateway configuration
│       ├── cloudwatch/        # CloudWatch dashboards
│       ├── dynamodb/          # DynamoDB tables
│       ├── eventbridge/       # EventBridge buses and rules
│       ├── lambda/            # Lambda functions and policies
│       ├── monitoring/        # Prometheus and Grafana
│       └── vpc/              # VPC and networking
├── services/                  # Lambda function code
│   ├── libs/                 # AWS client libraries
│   ├── order-service/        # Order processing Lambda
│   ├── payment-service/      # Payment processing Lambda
│   ├── metrics-service/      # Metrics collection Lambda
│   └── shared/              # Shared utilities and constants
├── scripts/                  # Build and test scripts
├── .gitignore               # Git ignore rules
├── DEPLOYMENT.md            # Deployment guide
├── MONITORING.md            # Monitoring documentation
├── SECURITY.md              # Security best practices
├── package.json             # Node.js dependencies
├── tsconfig.json            # TypeScript configuration
├── jest.config.js           # Jest test configuration
└── eslint.config.mjs        # ESLint configuration
```

---

## Event & Test File Reference

### Event Structure

All events follow a consistent structure:

```typescript
interface OrderEvent {
  orderId: string;
  customerId: string;
  items: Array<{
    sku: string;
    quantity: number;
  }>;
  timestamp?: string;
}
```

### Test Files

- **`scripts/order-service-event.local.json`**: Unit test events
- **`scripts/order-service-events.json`**: Integration test scenarios
- **`scripts/inventory-seed.json`**: Initial inventory data

### Event Flow Examples

#### Successful Order Processing

```json
{
  "orderId": "order-123",
  "customerId": "customer-456",
  "items": [{ "sku": "prod-001", "quantity": 2 }]
}
```

#### Failed Order Processing

```json
{
  "orderId": "order-456",
  "customerId": "customer-789",
  "items": [{ "sku": "prod-002", "quantity": 100 }]
}
```

---

## Best Practices

- **Type Safety**: All handlers and scripts are fully type-safe (no `any`)
- **Centralized Configuration**: All config in `services/shared/constants.ts`
- **Environment-Aware Resource Naming**: All AWS resources are named with environment prefixes (e.g., `dev-inventory-table`)
- **Infrastructure as Code**: All AWS resources managed via Terraform modules
- **Testing**: Robust unit and integration tests, with inventory reset and log assertions
- **Code Quality**: ESLint enforced, no explicit `any` allowed

---

## Planned DevOps Improvements

- **CI/CD Automation:** A GitHub Actions workflow will be added to fully automate deployments for staging and production environments, replacing the current `deploy.ts` script for those environments. This will ensure robust, auditable, and team-friendly deployments.
- **Multi-Environment Support:** Additional environment directories and backend files for `staging` and `prod` will be created, following the same strict environment isolation and state management as `dev`.
- **Strict Environment Propagation:** All scripts, Lambdas, and infrastructure will continue to require explicit environment specification—no fallbacks—ensuring safe, environment-agnostic deployments.
- **Advanced Security:** Plans include AWS WAF integration, VPC endpoints, and enhanced IAM policies for production.
- **Performance Optimization:** Lambda provisioned concurrency, DynamoDB auto-scaling, and CDN integration are on the roadmap.
- **Enhanced Monitoring:** Custom CloudWatch dashboards, advanced alerting, and cost optimization monitoring will be expanded.
- **Developer Experience:** Improvements such as local development environment, hot reloading, and enhanced debugging tools are planned.

---

## Future Improvements

### Planned Enhancements

1. **Multi-Environment Support**
   - Staging environment configuration
   - Production environment with enhanced security
   - Environment-specific monitoring

2. **Advanced Security**
   - AWS WAF integration
   - VPC endpoints for private AWS access
   - Enhanced IAM policies with conditions

3. **Performance Optimization**
   - Lambda provisioned concurrency
   - DynamoDB auto-scaling
   - CDN integration for static assets

4. **Enhanced Monitoring**
   - Custom CloudWatch dashboards
   - Advanced alerting rules
   - Cost optimization monitoring

5. **Developer Experience**
   - Local development environment
   - Hot reloading for Lambda development
   - Enhanced debugging tools

### Architecture Evolution

- **Microservices**: Break down into smaller, focused services
- **Event Sourcing**: Complete audit trail of all events
- **CQRS**: Separate read and write models
- **Saga Pattern**: Distributed transaction management

---

## License

This project is licensed under the ISC License. See the LICENSE file for details.

---

**Note**: This project is designed as a learning tool and demonstration of best practices. For production use, additional security, monitoring, and operational considerations should be implemented.
