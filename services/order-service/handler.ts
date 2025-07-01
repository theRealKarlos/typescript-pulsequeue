// AWS Lambda handler for order processing events.
// - Validates and processes order events from EventBridge
// - Interacts with DynamoDB for stock reservation
// - Emits payment events to EventBridge
// - Designed for production use and testability

// ============================================================================
// IMPORTS
// ============================================================================
import { UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { createDynamoDBClient, createEventBridgeClient } from '@services/libs/aws-clients';
import { INVENTORY_DYNAMODB_CONFIG, PAYMENT_EVENTBRIDGE_CONFIG } from '@services/shared/constants';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface OrderDetail {
  readonly customerId: string;
  readonly items: ReadonlyArray<{ readonly sku: string; readonly quantity: number }>;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Type guard to check if a value is a valid order detail
 */
function isValidOrderDetail(value: unknown): value is OrderDetail {
  if (typeof value !== 'object' || value === null) return false;

  const order = value as Record<string, unknown>;
  return (
    typeof order.customerId === 'string' &&
    Array.isArray(order.items) &&
    order.items.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Record<string, unknown>).sku === 'string' &&
        typeof (item as Record<string, unknown>).quantity === 'number',
    )
  );
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

/**
 * Lambda function handler for processing order events from EventBridge
 * Validates the event structure and logs order details
 */
export const handler = async (
  event: Record<string, unknown>,
): Promise<{
  statusCode: number;
  body: string;
}> => {
  console.log('🚀 Lambda handler received event:', JSON.stringify(event, null, 2));

  try {
    // Extract order details from the event
    const orderDetail = event.detail || event;
    console.log('📦 Processing order:', JSON.stringify(orderDetail, null, 2));

    if (!isValidOrderDetail(orderDetail)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid order detail structure' }),
      };
    }

    // Reserve stock in DynamoDB for each item
    const dynamoDB = createDynamoDBClient();
    for (const item of orderDetail.items) {
      const updateCmd = new UpdateItemCommand({
        TableName: INVENTORY_DYNAMODB_CONFIG.TABLE_NAME,
        Key: { item_id: { S: item.sku } },
        UpdateExpression:
          'SET stock = if_not_exists(stock, :zero) - :qty, reserved = if_not_exists(reserved, :zero) + :qty',
        ConditionExpression: 'stock >= :qty OR attribute_not_exists(stock)',
        ExpressionAttributeValues: {
          ':qty': { N: item.quantity.toString() },
          ':zero': { N: '0' },
        },
        ReturnValues: 'UPDATED_NEW',
      });
      try {
        const result = await dynamoDB.send(updateCmd);
        console.log(`✅ Reserved stock for SKU ${item.sku}:`, result.Attributes);
      } catch (err) {
        console.error(`❌ Failed to reserve stock for SKU ${item.sku}:`, err);
        return {
          statusCode: 409,
          body: JSON.stringify({ error: `Insufficient stock for SKU ${item.sku}` }),
        };
      }
    }

    // Emit PaymentRequested event to the payment bus
    const paymentEvent = {
      Source: PAYMENT_EVENTBRIDGE_CONFIG.SOURCE,
      DetailType: PAYMENT_EVENTBRIDGE_CONFIG.DETAIL_TYPE,
      EventBusName: PAYMENT_EVENTBRIDGE_CONFIG.BUS_NAME,
      Detail: JSON.stringify({
        orderId:
          typeof orderDetail === 'object' && orderDetail !== null && 'orderId' in orderDetail && typeof (orderDetail as Record<string, unknown>).orderId === 'string'
            ? (orderDetail as Record<string, unknown>).orderId
            : 'unknown',
        customerId: orderDetail.customerId,
        items: orderDetail.items,
        timestamp: new Date().toISOString(),
      }),
    };
    const eventBridge = createEventBridgeClient({ region: PAYMENT_EVENTBRIDGE_CONFIG.REGION });
    const putEventsCmd = new PutEventsCommand({ Entries: [paymentEvent] });
    const putResult = await eventBridge.send(putEventsCmd);
    console.log('📤 PaymentRequested event sent:', putResult);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Order processed, stock reserved, payment event emitted',
        orderId:
          typeof orderDetail === 'object' && orderDetail !== null && 'orderId' in orderDetail && typeof (orderDetail as Record<string, unknown>).orderId === 'string'
            ? (orderDetail as Record<string, unknown>).orderId
            : 'unknown',
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('❌ Error processing order event:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process order',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
