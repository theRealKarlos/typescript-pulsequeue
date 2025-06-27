// Import types for AWS Lambda event and result objects
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
// Import AWS EventBridge client
import { EventBridge } from 'aws-sdk';

// Initialize EventBridge client
const eventBridge = new EventBridge();

// Lambda handler function to process API Gateway events
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Log the received event for debugging purposes
  console.log('Received event:', JSON.stringify(event));
  
  // Generate a unique order ID using the current timestamp
  const orderId = `order-${Date.now()}`;

  // Parse the request body to extract order details
  const { customerId, items } = event.body ? JSON.parse(event.body) : { customerId: undefined, items: undefined };

  // Emit OrderPlaced event to EventBridge
  await eventBridge.putEvents({
    Entries: [{
      Source: 'pulsequeue.orders', // Event source identifier
      DetailType: 'OrderPlaced',   // Type of event
      Detail: JSON.stringify({ orderId, customerId, items }), // Event details (order info)
      EventBusName: 'pulsequeue-bus',     // EventBridge bus name, our custom bus
    }]
  }).promise();

  // Return a successful response with the order ID
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Order created', orderId }),
  };
};