import { EventBridgeClient, PutEventsCommand, PutEventsCommandInput } from "@aws-sdk/client-eventbridge";

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_REGION = "eu-west-2";
const EVENT_SOURCE = "order.service";
const EVENT_DETAIL_TYPE = "OrderPlaced";
const EVENT_BUS_NAME = "pulsequeue-bus";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface TestEventDetail {
  customerId: string;
  items: Array<{ sku: string; quantity: number }>;
  _postDeployTest: boolean;
}

interface EventBridgeEvent {
  Source: string;
  DetailType: string;
  EventBusName: string;
  Detail: string;
}

// ============================================================================
// CLIENT SETUP
// ============================================================================

const region = process.env.AWS_REGION || DEFAULT_REGION;
const client = new EventBridgeClient({ region });

// ============================================================================
// TEST DATA
// ============================================================================

const testEventDetail: TestEventDetail = {
  customerId: "test",
  items: [{ sku: "debug", quantity: 1 }],
  _postDeployTest: true
};

const event: EventBridgeEvent = {
  Source: EVENT_SOURCE,
  DetailType: EVENT_DETAIL_TYPE,
  EventBusName: EVENT_BUS_NAME,
  Detail: JSON.stringify(testEventDetail)
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates if the EventBridge response has the expected structure
 */
function isValidEventBridgeResponse(result: any): boolean {
  return result && 
         typeof result.FailedEntryCount === 'number' && 
         Array.isArray(result.Entries);
}

// ============================================================================
// MAIN TEST FUNCTION
// ============================================================================

/**
 * Sends a test event to EventBridge to verify the deployed Lambda function
 * Validates the response and handles errors appropriately
 */
async function runPostDeployTest(): Promise<void> {
  try {
    const command = new PutEventsCommand({ Entries: [event] });
    const result = await client.send(command);

    if (!isValidEventBridgeResponse(result)) {
      console.error("Invalid EventBridge response:", result);
      process.exit(1);
    }

    if (result.FailedEntryCount && result.FailedEntryCount > 0) {
      console.error("Event submission failed:", result.Entries);
      process.exit(1);
    }

    console.log("EventBridge test event successfully sent:", result.Entries);
  } catch (err) {
    console.error(`Failed to send EventBridge event: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}

// ============================================================================
// EXECUTION
// ============================================================================

runPostDeployTest();