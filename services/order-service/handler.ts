import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { EventBridgeEvent } from 'aws-lambda';
import { EventBridge } from 'aws-sdk';

// Initialize EventBridge client for API-originated requests
const eventBridge = new EventBridge();

type OrderPlacedDetail = {
  orderId: string;
  customerId: string;
  items: Array<{ sku: string; quantity: number }>;
  _postDeployTest?: boolean;
};

// Main handler – handles both API Gateway and EventBridge sources
export const handler = async (  
  event: APIGatewayProxyEvent | EventBridgeEvent<string, OrderPlacedDetail>
): Promise<APIGatewayProxyResult | void> => {
  console.log("🧪 Lambda cold start successful");
  console.log("🔍 Incoming event type:", JSON.stringify(Object.keys(event)));

  // --- EventBridge invocation ---
  if ('detail' in event) {
    const { orderId, customerId, items, _postDeployTest } = event.detail;

    if (_postDeployTest) {
      console.log("📥 Post-deploy test event received:", { orderId, customerId, items });
    } else {
      console.log("🧾 Real OrderPlaced event received:", { orderId, customerId, items });
    }

    return;
  }

  // --- API Gateway invocation ---
  const orderId = `order-${Date.now()}`;
  const { customerId, items } = event.body
    ? JSON.parse(event.body)
    : { customerId: undefined, items: undefined };

  await eventBridge.putEvents({
    Entries: [
      {
        Source: 'pulsequeue.orders',
        DetailType: 'OrderPlaced',
        EventBusName: 'pulsequeue-bus',
        Detail: JSON.stringify({ orderId, customerId, items }),
      },
    ],
  }).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Order created', orderId }),
  };
};