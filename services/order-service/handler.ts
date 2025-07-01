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

    // Validate the order if needed
    if (isValidOrderDetail(orderDetail)) {
      console.log('✅ Order validation passed');
    } else {
      console.warn('⚠️ Order validation failed, but continuing processing');
    }

    // Generate a simple response
    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Order processed successfully',
        orderId: (orderDetail as Record<string, unknown>).orderId || 'unknown',
        timestamp: new Date().toISOString(),
      }),
    };

    console.log('✅ Order processed successfully');
    return response;
  } catch (error) {
    console.error('❌ Error processing EventBridge event:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process order',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
