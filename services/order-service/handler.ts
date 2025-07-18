// AWS Lambda handler for order processing events.
// - Validates and processes order events from EventBridge
// - Interacts with DynamoDB for stock reservation
// - Emits payment events to EventBridge
// - Collects Prometheus metrics for monitoring
// - Designed for production use and testability

// ============================================================================
// IMPORTS
// ============================================================================
import { UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { createDynamoDBClient, createEventBridgeClient } from '@services/libs/aws-clients';
import { PAYMENT_EVENTBRIDGE_CONFIG } from '@services/shared/constants';
import { 
  recordLambdaRequest, 
  recordLambdaError, 
  recordOrderProcessed, 
  recordStockReservation,
  recordInventoryOperation,
  updateStockQuantity 
} from '@services/shared/metrics';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface OrderDetail {
  readonly customerId: string;
  readonly items: ReadonlyArray<{ readonly sku: string; readonly quantity: number }>;
  readonly orderId: string;
}

interface PaymentEventDetail {
  orderId: string;
  customerId: string;
  items: Array<{ sku: string; quantity: number }>;
  timestamp: string;
  _postDeployTest?: boolean;
  _postDeployTestForceResult?: 'SUCCESS' | 'FAILURE';
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

// Type guard for order items
function isOrderItem(item: unknown): item is { sku: string; quantity: number } {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof (item as { sku?: unknown }).sku === 'string' &&
    typeof (item as { quantity?: unknown }).quantity === 'number'
  );
}

/**
 * Type guard to check if a value is a valid order detail
 */
function isValidOrderDetail(value: unknown): value is OrderDetail {
  if (typeof value !== 'object' || value === null) return false;
  const order = value as { [key: string]: unknown };
  if (typeof order.customerId !== 'string' || typeof order.orderId !== 'string' || !Array.isArray(order.items)) {
    return false;
  }
  return order.items.every(isOrderItem);
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
  // Track execution time for Prometheus metrics
  const startTime = Date.now();
  const functionName = 'order-service';
  
  console.log('🚀 Lambda handler received event:', JSON.stringify(event, null, 2));

  try {
    // Extract order details from the event
    type OrderDetailWithTestFields = OrderDetail & {
      _postDeployTest?: boolean;
      _postDeployTestForceResult?: 'SUCCESS' | 'FAILURE';
    };
    const orderDetail = (event.detail || event) as OrderDetailWithTestFields;
    console.log('📦 Processing order:', JSON.stringify(orderDetail, null, 2));

    if (!isValidOrderDetail(orderDetail)) {
      // Record validation error metrics for Prometheus
      const duration = (Date.now() - startTime) / 1000;
      recordLambdaRequest(functionName, 'error', duration);        // Track Lambda request with error status
      recordLambdaError(functionName, 'validation_error');         // Increment error counter for validation errors
      recordOrderProcessed('error', duration, 'validation_error'); // Track order processing failure
      
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid order detail structure' }),
      };
    }

    // Reserve stock in DynamoDB for each item
    const dynamoDB = createDynamoDBClient();
    for (const item of orderDetail.items) {
      const updateCmd = new UpdateItemCommand({
        TableName: process.env.INVENTORY_TABLE_NAME,
        Key: { item_id: { S: item.sku } },
        UpdateExpression:
          'SET reserved = if_not_exists(reserved, :zero) + :qty',
        ConditionExpression: 'stock >= :qty OR attribute_not_exists(stock)',
        ExpressionAttributeValues: {
          ':qty': { N: item.quantity.toString() },
          ':zero': { N: '0' },
        },
        ReturnValues: 'UPDATED_NEW',
      });
      try {
        const result = await dynamoDB.send(updateCmd);
        console.log(`✅ Reserved stock for SKU ${item.sku} (orderId: ${orderDetail.orderId}):`, result.Attributes);
        
        // Record successful stock reservation metrics for Prometheus
        recordStockReservation('success', item.sku);           // Track successful stock reservations by SKU
        recordInventoryOperation('reserve', 'success');        // Track successful inventory reserve operations
        
        // Update stock quantity metric with the current stock value
        // Note: We don't update the reserved count as a metric since it's temporary
        const currentStock = parseInt(result.Attributes?.stock?.N || '0');
        updateStockQuantity(item.sku, currentStock);
        
      } catch (err) {
        console.error(`❌ Failed to reserve stock for SKU ${item.sku}:`, err);
        
        // Record stock reservation failure metrics for Prometheus
        recordStockReservation('insufficient_stock', item.sku); // Track insufficient stock errors by SKU
        recordInventoryOperation('reserve', 'error');          // Track failed inventory reserve operations
        
        // Record overall Lambda error metrics
        const duration = (Date.now() - startTime) / 1000;
        recordLambdaRequest(functionName, 'error', duration);    // Track Lambda request with error status
        recordLambdaError(functionName, 'stock_error');          // Increment error counter for stock errors
        recordOrderProcessed('error', duration, 'stock_error');  // Track order processing failure due to stock
        
        return {
          statusCode: 409,
          body: JSON.stringify({ error: `Insufficient stock for SKU ${item.sku}` }),
        };
      }
    }

    // Emit PaymentRequested event to the payment bus
    const paymentEventDetail: PaymentEventDetail = {
      orderId: orderDetail.orderId,
      customerId: orderDetail.customerId,
      items: [...orderDetail.items],
      timestamp: new Date().toISOString(),
    };
    // Forward post-deploy test fields if present (for deterministic testing)
    if (orderDetail._postDeployTest !== undefined) paymentEventDetail._postDeployTest = orderDetail._postDeployTest;
    if (orderDetail._postDeployTestForceResult !== undefined) paymentEventDetail._postDeployTestForceResult = orderDetail._postDeployTestForceResult;

    const paymentEvent = {
      Source: PAYMENT_EVENTBRIDGE_CONFIG.SOURCE,
      DetailType: PAYMENT_EVENTBRIDGE_CONFIG.DETAIL_TYPE,
      EventBusName: process.env.PAYMENT_EVENTBRIDGE_BUS_NAME,
      Detail: JSON.stringify(paymentEventDetail),
    };
    const eventBridge = createEventBridgeClient({ region: PAYMENT_EVENTBRIDGE_CONFIG.REGION });
    const putEventsCmd = new PutEventsCommand({ Entries: [paymentEvent] });
    const putResult = await eventBridge.send(putEventsCmd);
    console.log('📤 PaymentRequested event sent:', putResult);

    // Record successful order processing metrics for Prometheus
    const duration = (Date.now() - startTime) / 1000;
    recordLambdaRequest(functionName, 'success', duration);     // Track successful Lambda request
    recordOrderProcessed('success', duration);                  // Track successful order processing

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Order processed, stock reserved, payment event emitted',
        orderId: orderDetail.orderId,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('❌ Error processing order event:', error);
    
    // Record unexpected error metrics for Prometheus
    const duration = (Date.now() - startTime) / 1000;
    recordLambdaRequest(functionName, 'error', duration);       // Track Lambda request with error status
    recordLambdaError(functionName, 'unknown_error');           // Increment error counter for unknown errors
    recordOrderProcessed('error', duration, 'unknown_error');   // Track order processing failure due to unknown error
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process order',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
