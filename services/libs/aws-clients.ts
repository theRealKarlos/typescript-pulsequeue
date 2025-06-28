console.log("📦 Module loaded successfully");
import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import { SQSClient } from "@aws-sdk/client-sqs";
// Add more clients here as needed (e.g., DynamoDB, SNS, etc.)

const REGION = process.env.AWS_REGION || "eu-west-2";

export const eventBridge = new EventBridgeClient({ region: REGION });

export const sqs = new SQSClient({ region: REGION });