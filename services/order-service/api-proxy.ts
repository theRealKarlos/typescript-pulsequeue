import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

// ============================================================================
// CONFIGURATION
// ============================================================================

const EVENTBRIDGE_CONFIG = {
  REGION: process.env.AWS_REGION || 'eu-west-2',
  SOURCE: 'order.service',
  DETAIL_TYPE: 'OrderPlaced',
  BUS_NAME: process.env.EVENT_BUS_NAME || 'dev-pulsequeue-bus'
};

// ============================================================================
// CLIENT SETUP
// ============================================================================

const eventBridgeClient = new EventBridgeClient({ 
  region: EVENTBRIDGE_CONFIG.REGION 
});

// ============================================================================
// MAIN HANDLER
// ============================================================================

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('🚀 API Proxy received event:', JSON.stringify(event, null, 2));

  try {
    // Parse the request body
    const orderData = JSON.parse(event.body || '{}');
    console.log('📦 Order data received:', JSON.stringify(orderData, null, 2));

    // Create EventBridge event
    const eventBridgeEvent = {
      Source: EVENTBRIDGE_CONFIG.SOURCE,
      DetailType: EVENTBRIDGE_CONFIG.DETAIL_TYPE,
      EventBusName: EVENTBRIDGE_CONFIG.BUS_NAME,
      Detail: JSON.stringify(orderData)
    };

    console.log('📡 Sending to EventBridge:', JSON.stringify(eventBridgeEvent, null, 2));

    // Send to EventBridge
    const command = new PutEventsCommand({
      Entries: [eventBridgeEvent]
    });

    const result = await eventBridgeClient.send(command);
    console.log('✅ EventBridge response:', JSON.stringify(result, null, 2));

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({
        message: 'Order sent to EventBridge successfully',
        eventId: result.Entries?.[0]?.EventId || 'unknown',
        orderId: orderData.orderId
      })
    };

  } catch (error) {
    console.error('❌ Error processing order:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
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