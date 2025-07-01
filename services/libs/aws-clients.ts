import { EventBridgeClient, EventBridgeClientConfig } from '@aws-sdk/client-eventbridge';
import { SQSClient, SQSClientConfig } from '@aws-sdk/client-sqs';
import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
// Add more clients here as needed (e.g., DynamoDB, SNS, etc.)

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_REGION = process.env.AWS_REGION || 'eu-west-2';

// ============================================================================
// CLIENT FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates an EventBridge client for a specific region (defaults to process.env.AWS_REGION)
 * @param config Optional EventBridgeClientConfig (e.g., { region: 'us-east-1' })
 */
export function createEventBridgeClient(config?: EventBridgeClientConfig) {
  return new EventBridgeClient({ region: DEFAULT_REGION, ...config });
}

/**
 * Creates an SQS client for a specific region (defaults to process.env.AWS_REGION)
 * @param config Optional SQSClientConfig (e.g., { region: 'us-east-1' })
 */
export function createSQSClient(config?: SQSClientConfig) {
  return new SQSClient({ region: DEFAULT_REGION, ...config });
}

export function createDynamoDBClient(config?: DynamoDBClientConfig) {
  return new DynamoDBClient({ region: DEFAULT_REGION, ...config });
}

// ============================================================================
// DEFAULT CLIENT EXPORTS (for backward compatibility)
// ============================================================================

export const eventBridge = createEventBridgeClient();
export const sqs = createSQSClient();
export const dynamoDB = createDynamoDBClient();

// ============================================================================
// USAGE EXAMPLES
// ============================================================================
// import { createEventBridgeClient } from '@services/libs/aws-clients';
// const paymentBusClient = createEventBridgeClient({ region: 'eu-west-2' });
// const orderBusClient = createEventBridgeClient({ region: 'us-east-1' });
// Usage: const inventoryDb = createDynamoDBClient({ region: 'eu-west-2' });
