import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { eventBridge } from "../libs/aws-clients";
import { EVENTBRIDGE_CONFIG } from "../shared/constants";

// ============================================================================
// CONFIGURATION
// ============================================================================

const EVENT_SOURCE = EVENTBRIDGE_CONFIG.SOURCE;
const EVENT_DETAIL_TYPE = EVENTBRIDGE_CONFIG.DETAIL_TYPE;
const EVENT_BUS_NAME = EVENTBRIDGE_CONFIG.BUS_NAME;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface OrderDetail {
  customerId: string;
  items: Array<{ sku: string; quantity: number }>;
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
           typeof (item as any).sku === 'string' &&
           typeof (item as any).quantity === 'number'
         );
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

/**
 * Lambda function handler for processing order events from EventBridge
 * Validates the event structure and logs order details
 */
export const handler = async (event: any): Promise<any> => {
  console.log('🚀 Lambda handler received event:', JSON.stringify(event, null, 2));

  try {
    // Extract order details from the event
    const orderDetail = event.detail || event;
    console.log('📦 Processing order:', JSON.stringify(orderDetail, null, 2));

    // Generate a simple response
    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Order processed successfully',
        orderId: orderDetail.orderId || 'unknown',
        timestamp: new Date().toISOString()
      })
    };

    console.log('✅ Order processed successfully');
    return response;

  } catch (error) {
    console.error('❌ Error processing EventBridge event:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process order',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};