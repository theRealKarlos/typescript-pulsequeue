# TypeScript PulseQueue

A modern, type-safe, event-driven serverless application built with TypeScript, AWS Lambda, EventBridge, and DynamoDB. This project demonstrates best practices for scalable, decoupled architectures, robust testing, and infrastructure-as-code.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Development & Testing](#development--testing)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Event & Test File Reference](#event--test-file-reference)
- [Best Practices](#best-practices)
- [Contributing](#contributing)
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

---

## Architecture

### Core Components

- **Order Lambda**: Receives order events, reserves inventory, emits payment events
- **Payment Lambda**: Processes payment events, updates inventory based on payment outcome
- **EventBridge Buses**: Route events between services
- **DynamoDB Table**: Stores inventory state

### Event Flow

```
OrderPlaced (EventBridge) → Order Lambda → PaymentRequested (EventBridge) → Payment Lambda → DynamoDB
```

- **Order Lambda** increments `reserved` in DynamoDB and emits a payment event
- **Payment Lambda** decrements `reserved` and, on success, decrements `stock`

---

## Technology Stack

- **TypeScript** (strict, type-safe)
- **AWS Lambda** (Node.js 22.x)
- **AWS EventBridge** (event routing)
- **AWS DynamoDB** (inventory state)
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

---

## Project Structure

```
TypeScript-PulseQueue/
├── services/
│   ├── order-service/
│   │   └── handler.ts          # Main Lambda handler
│   ├── payment-service/
│   │   └── handler.ts          # Payment Lambda handler
│   ├── libs/
│   │   └── aws-clients.ts      # AWS SDK v3 clients
│   └── shared/
│       └── constants.ts        # Shared configuration
├── scripts/
│   ├── build-lambda.ts         # Lambda build script
│   ├── order-service-handler.test.ts # Jest unit tests for order-service Lambda
│   ├── order-service-event.local.json # Event for local unit test
│   ├── order-service-events.json      # Events for integration/post-deploy tests
│   ├── post-deploy-test.ts     # End-to-end integration test
│   ├── seed-inventory.ts       # Inventory seeding script
│   └── ...                     # Other scripts
├── infra/
│   ├── modules/                # Terraform modules
│   └── envs/dev/               # Dev environment config
├── dist/                       # Build artifacts
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript config
├── eslint.config.mjs           # ESLint config
└── README.md                   # This file
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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

---

## License

This project is licensed under the ISC License.
