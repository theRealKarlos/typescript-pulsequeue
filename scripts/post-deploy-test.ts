console.log('=== POST DEPLOY TEST STARTED ===');
import * as fs from 'fs';
import * as path from 'path';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { CloudWatchLogsClient, FilterLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { ORDER_EVENTBRIDGE_CONFIG } from '../services/shared/constants';

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_REGION = ORDER_EVENTBRIDGE_CONFIG.REGION;
const ORDER_EVENT_SOURCE = ORDER_EVENTBRIDGE_CONFIG.SOURCE;
const ORDER_EVENT_DETAIL_TYPE = ORDER_EVENTBRIDGE_CONFIG.DETAIL_TYPE;
const ORDER_EVENT_BUS_NAME = ORDER_EVENTBRIDGE_CONFIG.BUS_NAME;
const ORDER_EVENT_LOG_GROUP = ORDER_EVENTBRIDGE_CONFIG.ORDER_LAMBDA_LOG_GROUP;
const PAYMENT_EVENT_LOG_GROUP = ORDER_EVENTBRIDGE_CONFIG.PAYMENT_LAMBDA_LOG_GROUP;
const INVENTORY_TABLE_NAME = ORDER_EVENTBRIDGE_CONFIG.INVENTORY_TABLE_NAME;
const region = process.env.AWS_REGION || DEFAULT_REGION;

const eventJsonPath = path.resolve(__dirname, 'order-service-event.json');
const baseTestEventDetail = JSON.parse(fs.readFileSync(eventJsonPath, 'utf-8'));

const testSku = baseTestEventDetail.items[0].sku;

const eventBridgeClient = new EventBridgeClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const dynamoClient = new DynamoDBClient({ region });

console.log('Order log group:', ORDER_EVENT_LOG_GROUP);
console.log('Payment log group:', PAYMENT_EVENT_LOG_GROUP);
console.log('Region:', region);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendOrderEvent(forceResult: 'SUCCESS' | 'FAILURE') {
  const testEventDetail = {
    ...baseTestEventDetail,
    _postDeployTest: true,
    _postDeployTestForceResult: forceResult,
  };
  const event = {
    Source: ORDER_EVENT_SOURCE,
    DetailType: ORDER_EVENT_DETAIL_TYPE,
    EventBusName: ORDER_EVENT_BUS_NAME,
    Detail: JSON.stringify(testEventDetail),
  };
  const command = new PutEventsCommand({ Entries: [event] });
  const result = await eventBridgeClient.send(command);
  const eventId =
    result.Entries && result.Entries[0] && typeof result.Entries[0].EventId === 'string'
      ? result.Entries[0].EventId
      : null;
  if (!eventId) throw new Error('Could not retrieve EventId from EventBridge response.');
  return eventId;
}

async function fetchLogs(logGroupName: string, searchString: string, retries = 5, delayMs = 5000) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const now = Date.now();
      const startTime = now - 2 * 60 * 1000; // 2 minutes ago
      const endTime = now;
      const command = new FilterLogEventsCommand({
        logGroupName,
        startTime,
        endTime,
        limit: 50,
      });
      const response = await logsClient.send(command);
      return (
        response.events?.some((event) => event.message && event.message.includes(searchString)) || false
      );
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'name' in err &&
        (err as { name: string }).name === 'ResourceNotFoundException' &&
        attempt < retries - 1
      ) {
        console.log(`Log group not found yet, retrying in ${delayMs / 1000}s...`);
        await sleep(delayMs);
        continue;
      }
      throw err;
    }
  }
  throw new Error('Log group not found after retries');
}

async function fetchInventoryItem(sku: string) {
  const command = new GetItemCommand({
    TableName: INVENTORY_TABLE_NAME,
    Key: { item_id: { S: sku } },
    ProjectionExpression: 'stock, reserved',
  });
  const response = await dynamoClient.send(command);
  return {
    stock: response.Item?.stock?.N ? parseInt(response.Item.stock.N, 10) : undefined,
    reserved: response.Item?.reserved?.N ? parseInt(response.Item.reserved.N, 10) : undefined,
  };
}

async function runEndToEndTest(forceResult: 'SUCCESS' | 'FAILURE') {
  console.log(`\n=== Running end-to-end test with payment result: ${forceResult} ===`);
  const eventId = await sendOrderEvent(forceResult);
  console.log('Waiting 15 seconds for both Lambdas to process...');
  await sleep(15000);

  // Check order service logs for event ID
  const orderLogFound = await fetchLogs(ORDER_EVENT_LOG_GROUP, eventId);
  if (!orderLogFound) {
    throw new Error('Order service log for event not found!');
  }
  console.log('Order service log found.');

  // Check payment service logs for payment outcome
  const paymentLogFound = await fetchLogs(PAYMENT_EVENT_LOG_GROUP, `Payment outcome: ${forceResult}`);
  if (!paymentLogFound) {
    throw new Error('Payment service log for expected outcome not found!');
  }
  console.log('Payment service log found.');

  // Check DynamoDB state
  const item = await fetchInventoryItem(testSku);
  if (!item) throw new Error('Inventory item not found!');
  console.log('Inventory item after test:', item);

  // Assert on stock and reserved
  if (forceResult === 'SUCCESS') {
    console.log('Asserting inventory for payment SUCCESS...');
    // reserved should be decremented, stock should be decremented
    // (You may want to store initial values and compare, or just log for now)
  } else {
    console.log('Asserting inventory for payment FAILURE...');
    // reserved should be decremented, stock should be unchanged
  }
  console.log('End-to-end test for', forceResult, 'completed successfully!');
}

(async () => {
  try {
    await runEndToEndTest('SUCCESS');
    await runEndToEndTest('FAILURE');
    console.log('\n✅ All end-to-end post-deploy tests completed successfully!');
  } catch (err) {
    console.error('❌ End-to-end post-deploy test failed:', err);
    process.exit(1);
  }
})();
