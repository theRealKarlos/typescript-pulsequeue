import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { eventBridge } from "./libs/aws-clients";

// ============================================================================
// CONFIGURATION
// ============================================================================

const EVENT_SOURCE = "order.service";
const EVENT_DETAIL_TYPE = "OrderPlaced";
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || "dev-pulsequeue-bus";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface OrderDetail {
  orderId?: string;
  customerId: string;
  items: Array<{ productId: string; name: string; quantity: number; price: number }>;
  totalAmount: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

interface APIGatewayEvent {
  httpMethod: string;
  path: string;
  headers: Record<string, string>;
  body: string;
  requestContext: {
    requestId: string;
    requestTime: string;
  };
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
  return typeof order.customerId === 'string' && 
         Array.isArray(order.items) &&
         order.items.every(item => 
           typeof item === 'object' && 
           item !== null &&
           typeof (item as Record<string, unknown>).productId === 'string' &&
           typeof (item as Record<string, unknown>).name === 'string' &&
           typeof (item as Record<string, unknown>).quantity === 'number' &&
           typeof (item as Record<string, unknown>).price === 'number'
         ) &&
         typeof order.totalAmount === 'number' &&
         typeof order.shippingAddress === 'object' &&
         order.shippingAddress !== null;
}

// ============================================================================
// EVENTBRIDGE FUNCTIONS
// ============================================================================

/**
 * Put an event on EventBridge
 */
async function putEventOnEventBridge(orderDetail: OrderDetail) {
  const command = new PutEventsCommand({
    Entries: [
      {
        Source: EVENT_SOURCE,
        DetailType: EVENT_DETAIL_TYPE,
        EventBusName: EVENT_BUS_NAME,
        Detail: JSON.stringify(orderDetail)
      }
    ]
  });

  console.log('📤 Putting event on EventBridge:', JSON.stringify(command.input, null, 2));
  const result = await eventBridge.send(command);
  console.log('✅ EventBridge response:', JSON.stringify(result, null, 2));
  return result;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

/**
 * Lambda function handler for API Gateway requests
 * Receives order data from API Gateway and puts it on EventBridge
 */
export const handler = async (event: APIGatewayEvent): Promise<{
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}> => {
  console.log('🚀 API Proxy handler received event:', JSON.stringify(event, null, 2));

  try {
    // Parse the request body
    const orderDetail: OrderDetail = JSON.parse(event.body);
    console.log('📦 Processing order from API Gateway:', JSON.stringify(orderDetail, null, 2));

    // Validate the order
    if (!isValidOrderDetail(orderDetail)) {
      console.error('❌ Invalid order detail');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({
          error: 'Invalid order format',
          message: 'Order must include customerId, items, totalAmount, and shippingAddress'
        })
      };
    }

    // Put the event on EventBridge
    await putEventOnEventBridge(orderDetail);

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({
        message: 'Order placed successfully',
        orderId: event.requestContext.requestId,
        timestamp: event.requestContext.requestTime
      })
    };

  } catch (error) {
    console.error('❌ Error processing API Gateway request:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({
        error: 'Failed to process order',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}; 