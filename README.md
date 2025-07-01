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

- ✅ **Dual Event Handling** - Lambda handler can process both API Gateway and EventBridge events (the current concept focuses on EventBridge, but API Gateway support is built-in)
- ✅ **Type Safety** - Full TypeScript implementation with strict checking
- ✅ **Error Handling** - Comprehensive validation with dead letter queues
- ✅ **Code Quality** - ESLint integration and automated checks
- ✅ **Testing** - Local and integration testing
- ✅ **Infrastructure as Code** - Terraform-managed AWS resources

## Architecture

### Core Components

1. **Lambda Function** (`order-service-handler`)

   - Capable of processing both API Gateway and EventBridge events
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
[Optionally: API Gateway → Lambda → Order Processing Logic]
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
# Run local Lambda test for the order service
npm run test:lambda:dev -- --handler services/order-service/handler.ts --event scripts/order-service-event.json

# Build any Lambda handler (parameterized)
npm run build:lambda:dev -- --entry services/order-service/handler.ts --outdir dist/order-service --zip dist/order-service.zip
npm run build:lambda:dev -- --entry services/other-service/handler.ts --outdir dist/other-service --zip dist/other-service.zip

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Lint all files (for CI or pre-push)
npm run lint:all

# Plan Terraform changes
npm run plan:dev

# Apply Terraform changes
npm run apply:dev
```

### Local Testing

```bash
# Test Lambda handler locally (order service example)
npm run test:lambda:dev -- --handler services/order-service/handler.ts --event scripts/order-service-event.json
```

This will:

- Import and invoke the specified Lambda handler locally
- Use the provided event JSON as input
- Print the result to the console

## Deployment

### Recommended: TypeScript Deployment Pipeline

You can now run your full deployment pipeline using a TypeScript orchestration script for single, reliable execution:

```bash
npm run deploy:dev:ts
```

This will:

1. Run the local Lambda test
2. Build the Lambda package
3. Run Terraform plan
4. Run Terraform apply
5. Run the post-deploy integration test

**Benefits:**

- Each step runs exactly once (no double execution)
- Cross-platform (works on Windows, macOS, Linux)
- Clear, color-coded output for each step
- Easy to extend and maintain as your pipeline grows

### Manual Steps (if needed)

You can still run each step individually using the scripts in `package.json`:

```bash
npm run test:lambda:dev -- --handler services/order-service/handler.ts --event scripts/order-service-event.json
npm run build:lambda:dev -- --entry services/order-service/handler.ts --outdir dist/order-service --zip dist/order-service.zip
npm run plan:dev
npm run apply:dev
npm run postdeploy:dev
```

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
│   ├── test-lambda.ts          # Parameterized local Lambda test script
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

- **DynamoDB** - Order persistence
- **SNS** - Notifications
- **CloudWatch** - Enhanced monitoring
- **API Gateway** - REST API endpoints (Lambda handler supports this, but not included in this concept deployment)
- **Cognito** - Authentication
- **X-Ray** - Distributed tracing

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
