console.log('=== POST DEPLOY TEST STARTED ===');
import * as fs from 'fs';
import * as path from 'path';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { CloudWatchLogsClient, FilterLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { ORDER_EVENTBRIDGE_CONFIG } from '../services/shared/constants';
import { execSync } from 'child_process';

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

const eventsJsonPath = path.resolve(__dirname, 'order-service-events.json');
const allTestEvents = JSON.parse(fs.readFileSync(eventsJsonPath, 'utf-8'));

const testSku = allTestEvents.success.items[0].sku;

const eventBridgeClient = new EventBridgeClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const dynamoClient = new DynamoDBClient({ region });

console.log('Order log group:', ORDER_EVENT_LOG_GROUP);
console.log('Payment log group:', PAYMENT_EVENT_LOG_GROUP);
console.log('Region:', region);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getTestEvent(forceResult: 'SUCCESS' | 'FAILURE') {
  // Clone the event to avoid mutation
  const base = JSON.parse(JSON.stringify(forceResult === 'SUCCESS' ? allTestEvents.success : allTestEvents.failure));
  // Set a unique orderId for each test run
  base.orderId = `${base.orderId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  return base;
}

async function sendOrderEvent(forceResult: 'SUCCESS' | 'FAILURE') {
  const testEventDetail = {
    ...getTestEvent(forceResult),
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
  return { eventId, testEventDetail };
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

async function resetInventory() {
  // Run the inventory seed script to reset stock and reserved
  const seedScriptPath = path.resolve(__dirname, 'seed-inventory.ts');
  try {
    execSync(`npx ts-node "${seedScriptPath}"`, { stdio: 'inherit' });
    console.log('Inventory reset to known state.');
  } catch (err) {
    throw new Error('Failed to reset inventory: ' + (err instanceof Error ? err.message : String(err)));
  }
}

async function assertOrderLambdaReservedLog(orderId: string, expectedReserved: number) {
  const now = Date.now();
  const startTime = now - 60 * 1000; // 1 minute ago
  const command = new FilterLogEventsCommand({
    logGroupName: ORDER_EVENT_LOG_GROUP,
    startTime,
    endTime: now,
    limit: 50,
  });
  const response = await logsClient.send(command);
  const found = response.events?.some(
    (event) =>
      event.message &&
      event.message.includes(orderId) &&
      event.message.includes(`reserved: { N: '${expectedReserved}' }`)
  );
  if (!found) {
    throw new Error(
      `Order Lambda log for orderId=${orderId} with reserved=${expectedReserved} not found in the last minute`
    );
  }
}

async function runEndToEndTest(forceResult: 'SUCCESS' | 'FAILURE', initialStock: number, initialReserved: number) {
  await resetInventory();
  const before = await fetchInventoryItem(testSku);
  console.log('Inventory item before test:', before);
  if (before.stock !== initialStock || before.reserved !== initialReserved) {
    throw new Error(`Inventory not at expected initial state. Got stock=${before.stock}, reserved=${before.reserved}`);
  }
  console.log(`\n=== Running end-to-end test with payment result: ${forceResult} ===`);
  const { eventId, testEventDetail } = await sendOrderEvent(forceResult);

  console.log('Waiting 12 seconds for payment Lambda to process...');
  await sleep(12000);

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

  // Check DynamoDB state after payment Lambda
  const item = await fetchInventoryItem(testSku);
  if (!item) throw new Error('Inventory item not found!');
  console.log('Inventory item after test:', item);

  // Assert on stock and reserved after payment Lambda
  if (forceResult === 'SUCCESS') {
    console.log('Asserting inventory for payment SUCCESS...');
    if (item.stock !== initialStock - testEventDetail.items[0].quantity || item.reserved !== initialReserved) {
      throw new Error(`Expected stock=${initialStock - testEventDetail.items[0].quantity}, reserved=${initialReserved} but got stock=${item.stock}, reserved=${item.reserved}`);
    }
  } else {
    console.log('Asserting inventory for payment FAILURE...');
    if (item.stock !== initialStock || item.reserved !== initialReserved) {
      throw new Error(`Expected stock=${initialStock}, reserved=${initialReserved} but got stock=${item.stock}, reserved=${item.reserved}`);
    }
  }
  // Assert order Lambda log for reserved state
  await assertOrderLambdaReservedLog(testEventDetail.orderId, testEventDetail.items[0].quantity);
  console.log('End-to-end test for', forceResult, 'completed successfully!');
}

(async () => {
  try {
    await runEndToEndTest('SUCCESS', 100, 0);
    await runEndToEndTest('FAILURE', 100, 0);
    console.log('\n✅ All end-to-end post-deploy tests completed successfully!');
  } catch (err) {
    console.error('❌ End-to-end post-deploy test failed:', err);
    process.exit(1);
  }
})();
