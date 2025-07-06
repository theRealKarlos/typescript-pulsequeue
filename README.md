# TypeScript PulseQueue

A modern, type-safe, event-driven serverless e-commerce application built with TypeScript, AWS Lambda, EventBridge, DynamoDB, and comprehensive monitoring. This project demonstrates best practices for scalable, decoupled architectures, robust testing, infrastructure-as-code, and observability.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Development & Testing](#development--testing)
- [Deployment](#deployment)
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
- **Type Safety**: Full TypeScript implementation, no `any`
- **Robust Testing**: Jest-based unit tests, automated post-deploy integration tests
- **Environment-Aware Infrastructure**: Modular, reusable, and isolated by environment
- **Code Quality**: ESLint integration and automated checks
- **Infrastructure as Code**: Terraform-managed AWS resources
- **Comprehensive Monitoring**: Prometheus metrics, Grafana dashboards, CloudWatch integration
- **Inventory Management**: DynamoDB-based stock reservation and tracking
- **Payment Processing**: Simulated payment flows with success/failure scenarios

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

### TypeScript Deployment Pipeline

Run the full deployment pipeline:

```bash
npm run deploy:dev:ts
```

This will:

1. Run ESLint code quality checks
2. Run all Jest unit tests
3. Build the Lambda package(s)
4. Run Terraform plan & apply
5. Run the post-deploy integration test
6. Set up monitoring infrastructure (Prometheus & Grafana)

---

## Monitoring

### Overview

The application includes comprehensive monitoring with Prometheus metrics collection and Grafana dashboards for real-time observability. The monitoring architecture is designed to handle the challenges of serverless environments where Lambda functions have no persistent state between invocations.

### Monitoring Architecture

#### Why CloudWatch + Prometheus?

**Problem**: Lambda functions lose in-memory metrics between invocations. Traditional Prometheus scraping from Lambda endpoints would only capture metrics from the current invocation, missing historical data.

**Solution**: Hybrid approach using both CloudWatch and Prometheus:

1. **Lambda Functions** send metrics to CloudWatch for persistence
2. **Metrics Service** queries CloudWatch and converts to Prometheus format
3. **Prometheus** scrapes the metrics service every 30 seconds
4. **Grafana** visualizes the data from Prometheus

#### Metrics Flow

```
Lambda Functions → CloudWatch (persistence)
       ↓
Metrics Service → Prometheus Format
       ↓
Prometheus (scrapes every 30s) → Grafana Dashboards
```

### Metrics Collection

- **Lambda Performance**: Request rates, durations, error rates
- **Business Metrics**: Orders processed, payments processed, success/failure rates
- **Inventory Metrics**: Stock reservations, inventory operations
- **Custom Metrics**: CloudWatch integration for persistence across Lambda invocations

### Histogram Metrics Reconstruction

**Challenge**: CloudWatch custom metrics only provide Sum values, not bucket data required for Prometheus histograms.

**Solution**: The metrics service reconstructs histogram buckets by:

1. Estimating count from sum using typical duration assumptions
2. Calculating average duration from sum/count
3. Generating bucket values based on average duration
4. Providing proper Prometheus histogram format

Example for `order_processing_duration_seconds`:

```prometheus
# CloudWatch provides: Sum = 1.5 seconds
# Metrics service estimates: Count = 5 operations (1.5/0.3)
# Generates buckets: [0.1, 0.5, 1, 2, 5, 10, +Inf]
order_processing_duration_seconds_bucket{le="0.1"} 0
order_processing_duration_seconds_bucket{le="0.5"} 5  # All operations fall here
order_processing_duration_seconds_bucket{le="1"} 5
order_processing_duration_seconds_bucket{le="2"} 5
order_processing_duration_seconds_bucket{le="5"} 5
order_processing_duration_seconds_bucket{le="10"} 5
order_processing_duration_seconds_bucket{le="+Inf"} 5
order_processing_duration_seconds_sum 1.5
order_processing_duration_seconds_count 5
```

### Monitoring Stack

- **Prometheus**: Metrics collection and storage
- **Grafana**: Dashboard visualization
- **CloudWatch**: Metrics persistence and fallback
- **API Gateway**: Metrics endpoint for Prometheus scraping

### Dashboard Setup

After deployment, set up the Grafana dashboard:

```bash
# Get the Grafana URL from Terraform outputs
cd infra/envs/dev && terraform output grafana_access_instructions

# Set up the dashboard with the provided credentials
npm run setup-grafana <grafana-url> <username> <password> <prometheus-url>
```

### Dashboard Features

- **Lambda Performance**: Request rates, durations, error rates by function
- **Order Processing**: Success/failure rates, processing times
- **Payment Processing**: Payment success rates, processing durations
- **Inventory Operations**: Stock reservation rates, inventory operation success
- **Real-time Updates**: 10-second refresh intervals

### Metrics Endpoint

The metrics service exposes Prometheus-compatible metrics at:

```
https://<api-gateway-url>/dev/metrics
```

---

## Project Structure

```
TypeScript-PulseQueue/
├── dist/
├── infra/
│   ├── bootstrap/
│   │   ├── main.tf
│   │   ├── outputs.tf
│   │   ├── terraform.tfstate
│   │   ├── terraform.tfstate.backup
│   │   ├── tfplan
│   │   └── .terraform.lock.hcl
│   ├── envs/
│   │   └── dev/
│   │       ├── backend.tf
│   │       ├── main.tf
│   │       ├── variables.tf
│   │       ├── tfplan
│   │       └── .terraform.lock.hcl
│   └── modules/
│       ├── dynamodb/
│       │   └── table/
│       │       ├── main.tf
│       │       ├── outputs.tf
│       │       └── variables.tf
│       ├── eventbridge/
│       │   ├── bus/
│       │   │   ├── main.tf
│       │   │   ├── outputs.tf
│       │   │   └── variables.tf
│       │   └── rule/
│       │       ├── main.tf
│       │       ├── outputs.tf
│       │       └── variables.tf
│       └── lambda/
│           └── lambda-function/
│               ├── iam.tf
│               ├── main.tf
│               ├── outputs.tf
│               └── variables.tf
├── node_modules/
├── scripts/
│   ├── build-lambda.ts
│   ├── deploy-dev.ts
│   ├── inventory-seed.json
│   ├── lambdas.config.ts
│   ├── lint-test.ts
│   ├── order-service-event.json
│   ├── order-service-event.local.json
│   ├── order-service-events.json
│   ├── order-service-handler.test.ts
│   ├── payment-service-handler.test.ts
│   ├── post-deploy-test.ts
│   ├── seed-inventory.ts
│   ├── test-eventbridge-cli.ts
├── services/
│   ├── libs/
│   │   └── aws-clients.ts
│   ├── order-service/
│   │   └── handler.ts
│   ├── payment-service/
│   │   └── handler.ts
│   └── shared/
│       └── constants.ts
├── .gitignore
├── eslint.config.mjs
├── jest.config.js
├── package-lock.json
├── package.json
├── pulsequeue-notes.txt
├── README.md
├── response.json
├── tsconfig.json
```

---

## Event & Test File Reference

### Unit Test Event File (`order-service-event.local.json`)

- Used for local Jest unit tests
- Must include `orderId`, `customerId`, and `items`

### Integration/Post-Deploy Event File (`order-service-events.json`)

- Used for end-to-end and post-deploy tests
- Must include both `success` and `failure` events, each with `orderId`, `customerId`, and `items`

---

## Best Practices

- **Type Safety**: All handlers and scripts are fully type-safe (no `any`)
- **Centralized Configuration**: All config in `services/shared/constants.ts`
- **Environment-Aware Resource Naming**: All AWS resources are named with environment prefixes (e.g., `dev-inventory-table`)
- **Infrastructure as Code**: All AWS resources managed via Terraform modules
- **Testing**: Robust unit and integration tests, with inventory reset and log assertions
- **Code Quality**: ESLint enforced, no explicit `any` allowed

---

## Future Improvements

### E-commerce Pipeline Extension

The current implementation covers the core order processing flow. Future enhancements will extend the event-driven architecture to include the complete e-commerce pipeline:

#### Planned Event Types

1. **Customer Events**
   - `CustomerRegistered` - New customer account creation
   - `CustomerProfileUpdated` - Profile information changes
   - `CustomerLogin` - Authentication events

2. **Catalog Events**
   - `ProductCreated` - New product addition
   - `ProductUpdated` - Product information changes
   - `ProductInventoryUpdated` - Stock level changes
   - `CategoryCreated` - Product categorization

3. **Shopping Cart Events**
   - `CartItemAdded` - Items added to cart
   - `CartItemRemoved` - Items removed from cart
   - `CartCleared` - Cart abandonment
   - `CartCheckoutInitiated` - Checkout process start

4. **Order Processing Events** (Current)
   - `OrderPlaced` - Order creation (✅ Implemented)
   - `OrderValidated` - Order validation
   - `OrderConfirmed` - Order confirmation
   - `OrderShipped` - Shipping status
   - `OrderDelivered` - Delivery confirmation
   - `OrderCancelled` - Order cancellation

5. **Payment Events** (Current)
   - `PaymentRequested` - Payment initiation (✅ Implemented)
   - `PaymentProcessed` - Payment completion
   - `PaymentFailed` - Payment failure
   - `RefundRequested` - Refund initiation
   - `RefundProcessed` - Refund completion

6. **Fulfillment Events**
   - `ShipmentCreated` - Shipping label generation
   - `ShipmentTracked` - Delivery tracking
   - `ShipmentDelivered` - Delivery confirmation

7. **Customer Service Events**
   - `SupportTicketCreated` - Customer support requests
   - `SupportTicketResolved` - Issue resolution
   - `CustomerFeedback` - Reviews and ratings

#### Architecture Enhancements

- **Event Sourcing**: Complete audit trail of all business events
- **CQRS Pattern**: Separate read and write models for scalability
- **Saga Pattern**: Distributed transaction management for complex workflows
- **Event Replay**: Ability to replay events for debugging and analytics

### Automated Dashboard Creation

Currently, the Grafana dashboard setup requires manual configuration. Future improvements will automate this process:

#### Planned Automation

1. **Terraform Integration**
   - Automate Grafana dashboard creation via Terraform providers
   - Store dashboard configurations as code
   - Version control dashboard changes

2. **Deployment Pipeline Enhancement**
   - Include dashboard setup in the deployment script
   - Automatic dashboard provisioning after infrastructure deployment
   - Environment-specific dashboard configurations

3. **Dashboard Templates**
   - Reusable dashboard templates for different environments
   - Dynamic metric configuration based on deployed services
   - Automated alert rule creation

4. **Monitoring as Code**
   - Grafana dashboard definitions in JSON/YAML
   - Prometheus alert rules as code
   - Automated monitoring stack deployment

#### Implementation Benefits

- **Reduced Manual Work**: No manual dashboard setup required
- **Consistency**: Same dashboards across all environments
- **Version Control**: Dashboard changes tracked in Git
- **Scalability**: Easy to add new metrics and dashboards
- **Reliability**: Automated setup reduces human error

### Additional Improvements

- **Real-time Notifications**: Slack/Teams integration for alerts
- **Performance Optimization**: Lambda cold start optimization
- **Security Enhancements**: Enhanced IAM policies, encryption
- **Cost Optimization**: Resource right-sizing, auto-scaling
- **Disaster Recovery**: Multi-region deployment, backup strategies

---

## License

This project is licensed under the ISC License.
