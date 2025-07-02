# TypeScript PulseQueue

A concept serverless application built with TypeScript, AWS Lambda, and EventBridge to demonstrate event-driven architecture patterns in a simple, decoupled, and scalable way.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Development](#development)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Event Reference](#event-reference)

## Overview

TypeScript PulseQueue is a **concept/prototype app** that demonstrates event-driven architecture using AWS services and TypeScript. It processes order events through a decoupled system with EventBridge routing and SQS dead letter queues for reliability. The goal is to showcase best practices for TypeScript, AWS Lambda, and infrastructure-as-code in a modern event-driven design.

### Key Features

- ✅ **EventBridge-Driven Lambda** - Focused on event-driven flows
- ✅ **Type Safety** - Full TypeScript implementation with strict checking
- ✅ **Error Handling** - Comprehensive validation with dead letter queues
- ✅ **Code Quality** - ESLint integration and automated checks
- ✅ **Testing** - Jest-based local unit testing and integration testing
- ✅ **Infrastructure as Code** - Terraform-managed AWS resources

## Architecture

### Core Components

1. **Lambda Function** (`order-service-handler`)
   - Processes EventBridge events
   - Contains order processing logic
   - Runs on Node.js 22.x runtime

2. **EventBridge Bus** (`dev-pulsequeue-bus`)
   - Central event routing system
   - Handles order events with dead letter queue

3. **SQS Dead Letter Queue**
   - Captures failed event processing
   - Provides reliability and error handling

### Event Flow

```
EventBridge → Lambda → Order Processing Logic → (DLQ on failure)
```

## Technology Stack

### Backend

- **TypeScript** - Type-safe development
- **AWS Lambda** - Serverless compute
- **AWS EventBridge** - Event routing
- **AWS SQS** - Dead letter queue
- **AWS SDK v3** - Modern AWS client libraries

### Infrastructure

- **Terraform** - Infrastructure as Code
- **esbuild** - Fast TypeScript bundling
- **ESLint** - Code quality enforcement
- **Jest** - Unit testing

### Development

- **Node.js 22.x** - Current LTS runtime
- **ts-node** - TypeScript execution
- **Cross-env** - Environment variable management

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

## Development

### Available Scripts

```bash
# Run Jest unit tests for all Lambdas
npm test

# Run Jest unit tests for the order service Lambda only
npm run test:order-service

# Build any Lambda handler (parameterized)
npm run build:lambda:dev -- --entry services/order-service/handler.ts --outdir dist/order-service --zip dist/order-service.zip
npm run build:lambda:dev -- --entry services/other-service/handler.ts --outdir dist/other-service --zip dist/other-service.zip

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Lint all files (for CI or pre-push)
npm run lint:all
```

### Local Unit Testing (Jest)

Jest is used for all Lambda unit tests. Each handler has its own test file (e.g., `scripts/order-service-handler.test.ts`).

```bash
npm test
# or for a specific handler
npm run test:order-service
```

- All AWS SDK calls are mocked (no real AWS calls are made)
- Event payloads are provided as JSON files or inline in the test
- Tests are fast, isolated, and CI-friendly

### Local Integration Testing

You can still run integration tests (e.g., EventBridge, post-deploy) using the provided scripts.

## Deployment

### Recommended: TypeScript Deployment Pipeline

Run your full deployment pipeline using the TypeScript orchestration script:

```bash
npm run deploy:dev:ts
```

This will:

1. Run ESLint code quality checks
2. Run all Jest unit tests
3. Build the Lambda package
4. Run Terraform plan
5. Run Terraform apply
6. Run the post-deploy integration test

**Benefits:**

- Each step runs exactly once (no double execution)
- Cross-platform (works on Windows, macOS, Linux)
- Clear, color-coded output for each step
- Easy to extend and maintain as your pipeline grows

## Project Structure

```
TypeScript-PulseQueue/
├── services/
│   ├── order-service/
│   │   └── handler.ts          # Main Lambda handler
│   ├── libs/
│   │   └── aws-clients.ts      # AWS SDK v3 clients
│   └── shared/
│       └── constants.ts        # Shared configuration
├── scripts/
│   ├── build-lambda.ts         # Parameterized Lambda build script
│   ├── order-service-handler.test.ts # Jest unit tests for order-service Lambda
│   ├── order-service-event.local.json # Sample event for local unit test
│   ├── order-service-event.postdeploy.json # Sample event for post-deploy test
│   ├── post-deploy-test.ts     # Integration testing
│   ├── deploy-dev.ts           # TypeScript deployment pipeline
│   └── lint-test.ts            # Code quality checks
├── infra/
│   ├── modules/
│   │   ├── lambda/             # Lambda infrastructure
│   │   └── eventbridge/        # EventBridge infrastructure
│   └── envs/dev/               # Development environment
├── dist/                       # Build artifacts
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── eslint.config.mjs           # ESLint configuration
└── README.md                   # This file
```

## Lambda Unit Testing with Jest

- Each Lambda handler has a dedicated Jest test file
- AWS SDK v3 clients are mocked using `aws-sdk-client-mock`
- Event payloads are provided as JSON or inline
- Tests are fast, reliable, and do not require AWS credentials

## Event Reference

### EventBridge Event Example

```json
{
  "Source": "order.service",
  "DetailType": "OrderPlaced",
  "EventBusName": "dev-pulsequeue-bus",
  "Detail": {
    "orderId": "order-1751123046215",
    "customerId": "karl-001",
    "items": [{ "sku": "JERS-1023", "quantity": 2 }]
  }
}
```

### Lambda Response Format

#### Success Response

```json
{
  "statusCode": 200,
  "body": "{\"message\":\"Order created\",\"orderId\":\"order-1751123046215\"}"
}
```

#### Error Response

```json
{
  "statusCode": 400,
  "body": "{\"error\":\"Missing customerId or items in request body\"}"
}
```

## Environment

### Current Configuration

- **Region**: eu-west-2 (London)
- **Environment**: dev
- **Runtime**: Node.js 22.x
- **Memory**: Default Lambda allocation
- **Timeout**: Default Lambda timeout

### Environment Variables

- `AWS_REGION` - AWS region (default: eu-west-2)
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key

## Future Enhancements

### Potential Additions

- More Lambda handlers and event types
- End-to-end integration tests
- CI/CD pipeline integration
- Monitoring and alerting
- Advanced error handling and retries

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For issues and questions:

1. Check the existing issues
2. Create a new issue with detailed information
3. Include logs and error messages

---

**Built as a concept with ❤️ using TypeScript and AWS Serverless**

## Environment-Aware Resource Naming

All AWS resources (EventBridge buses, rules, DynamoDB tables, etc.) are named using the pattern `${var.environment}-<base-name>`. This ensures clear separation and isolation between environments (e.g., dev, staging, prod) and makes the infrastructure modular and reusable.

## Terraform Module Usage

When using Terraform modules, only the base name of a resource (e.g., `order-bus`, `order-placed`, `inventory-table`) is passed from the environment configuration. The module itself prepends the environment name, so you do not need to hardcode environment prefixes in your environment configs. Example:

```hcl
module "order_eventbridge_bus" {
  source      = "../../modules/eventbridge/bus"
  environment = var.environment
  bus_name    = "order-bus"
}
```

## Running Scripts and Import Paths

> **Note:** If you run scripts directly with `ts-node`, use relative imports for internal modules (e.g., `../services/shared/constants`). Path aliases (like `@services/...`) require extra setup (such as `tsconfig-paths`) and may not work out-of-the-box with direct script execution. For reliability, prefer relative imports in scripts.

## Seeding the Inventory Table

To seed the DynamoDB inventory table with initial data, run:

```bash
npx ts-node scripts/seed-inventory.ts
```

If you encounter module resolution errors, ensure your imports in the script are relative (not using path aliases).
