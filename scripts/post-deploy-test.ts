console.log('=== POST DEPLOY TEST STARTED ===');
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { ORDER_EVENTBRIDGE_CONFIG } from '../services/shared/constants';
import { CloudWatchLogsClient, FilterLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_REGION = ORDER_EVENTBRIDGE_CONFIG.REGION;
const EVENT_SOURCE = ORDER_EVENTBRIDGE_CONFIG.SOURCE;
const EVENT_DETAIL_TYPE = ORDER_EVENTBRIDGE_CONFIG.DETAIL_TYPE;
const EVENT_BUS_NAME = ORDER_EVENTBRIDGE_CONFIG.BUS_NAME;

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
  customerId: 'test',
  items: [{ sku: 'debug', quantity: 1 }],
  _postDeployTest: true,
};

const event: EventBridgeEvent = {
  Source: EVENT_SOURCE,
  DetailType: EVENT_DETAIL_TYPE,
  EventBusName: EVENT_BUS_NAME,
  Detail: JSON.stringify(testEventDetail),
};

// ============================================================================
// LOG FETCHING UTILS
// ============================================================================

const LOG_GROUP_NAME = '/aws/lambda/dev-order-service-handler';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchRecentLogs(eventBridgeEventId: string) {
  const logsClient = new CloudWatchLogsClient({ region });
  const now = Date.now();
  const startTime = now - 1 * 60 * 1000; // 1 minute ago
  const endTime = now;

  const command = new FilterLogEventsCommand({
    logGroupName: LOG_GROUP_NAME,
    startTime,
    endTime,
    limit: 50,
  });

  try {
    const response = await logsClient.send(command);
    let found = false;
    if (response.events && response.events.length > 0) {
      console.log(`\n=== Last 1 minute of logs from ${LOG_GROUP_NAME} ===`);
      for (const event of response.events) {
        const ts = event.timestamp ? new Date(event.timestamp).toISOString() : '';
        console.log(`[${ts}] ${event.message}`);
        if (event.message && event.message.includes(eventBridgeEventId)) {
          found = true;
        }
      }
    } else {
      console.log(`\nNo log events found in the last 1 minute for ${LOG_GROUP_NAME}.`);
    }
    if (found) {
      console.log(`\n✅ EventBridge EventId '${eventBridgeEventId}' found in logs. Test PASSED.`);
      process.exit(0);
    } else {
      console.log(
        `\n❌ EventBridge EventId '${eventBridgeEventId}' NOT found in logs. Test FAILED.`,
      );
      process.exit(1);
    }
  } catch (err) {
    console.error(`Failed to fetch logs: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Type guard to check if a value is a record with string keys
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if a value is a valid EventBridge response
 */
function isValidEventBridgeResponse(result: unknown): result is {
  FailedEntryCount: number;
  Entries: Array<Record<string, unknown>>;
} {
  if (!isRecord(result)) return false;

  return typeof result.FailedEntryCount === 'number' && Array.isArray(result.Entries);
}

// ============================================================================
// MAIN TEST FUNCTION
// ============================================================================

/**
 * Sends a test event to EventBridge to verify the deployed Lambda function
 * Validates the response and handles errors appropriately
 */
async function runPostDeployTest(): Promise<string> {
  try {
    const command = new PutEventsCommand({ Entries: [event] });
    const result = await client.send(command);

    if (!isValidEventBridgeResponse(result)) {
      console.error('Invalid EventBridge response:', result);
      process.exit(1);
    }

    if (result.FailedEntryCount && result.FailedEntryCount > 0) {
      console.error('Event submission failed:', result.Entries);
      process.exit(1);
    }

    const eventId =
      result.Entries && result.Entries[0] && typeof result.Entries[0].EventId === 'string'
        ? result.Entries[0].EventId
        : null;
    console.log('EventBridge test event successfully sent:', result.Entries);
    if (!eventId) {
      console.error('Could not retrieve EventId from EventBridge response.');
      process.exit(1);
    }
    return eventId;
  } catch (err) {
    console.error(`Failed to send EventBridge event: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}

// ============================================================================
// EXECUTION
// ============================================================================

(async () => {
  const eventBridgeEventId = await runPostDeployTest();
  console.log('Waiting 10 seconds for logs to appear...');
  await sleep(10000);
  await fetchRecentLogs(eventBridgeEventId);
})();
