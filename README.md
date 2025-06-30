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
# Run local Lambda test
npm run test:dev

# Build Lambda package
npm run build:dev

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Plan Terraform changes
npm run plan:dev

# Apply Terraform changes
npm run apply:dev
```

### Local Testing

```bash
# Test Lambda handler locally
npm run test:dev
```

This will:

- Create a mock EventBridge or API Gateway event
- Execute the Lambda handler
- Validate the response
- Display results

## Deployment

### Full Deployment

```bash
npm run deploy:dev
```

This comprehensive deployment process:

1. **Local Test** - Validates Lambda handler locally
2. **Lint Check** - Ensures code quality
3. **Build** - Compiles TypeScript and creates deployment package
4. **Terraform Plan** - Shows infrastructure changes
5. **Terraform Apply** - Deploys to AWS
6. **Post-Deploy Test** - Validates EventBridge integration

### Manual Steps

```bash
# Step 1: Test locally
npm run test:dev

# Step 2: Build
npm run build:dev

# Step 3: Plan infrastructure changes
npm run plan:dev

# Step 4: Apply changes
npm run apply:dev

# Step 5: Test integration
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
│   ├── build-order.ts          # Build & package Lambda
│   ├── test-order.ts           # Local Lambda testing
│   ├── post-deploy-test.ts     # Integration testing
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
