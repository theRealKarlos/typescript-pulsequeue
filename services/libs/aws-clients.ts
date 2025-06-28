import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import { SQSClient } from "@aws-sdk/client-sqs";
// Add more clients here as needed (e.g., DynamoDB, SNS, etc.)

// ============================================================================
// CONFIGURATION
// ============================================================================

const AWS_CONFIG = {
  region: process.env.AWS_REGION || "eu-west-2",
} as const;

// ============================================================================
// CONFIGURATION VALIDATION
// ============================================================================

if (!AWS_CONFIG.region) {
  throw new Error("AWS_REGION environment variable is required");
}

// ============================================================================
// CLIENT FACTORY
// ============================================================================

/**
 * Creates AWS clients with consistent configuration and error handling
 */
function createAWSClient<T>(ClientClass: new (config: typeof AWS_CONFIG) => T): T {
  return new ClientClass(AWS_CONFIG);
}

// ============================================================================
// AWS CLIENT EXPORTS
// ============================================================================

export const eventBridge = createAWSClient(EventBridgeClient);
export const sqs = createAWSClient(SQSClient);