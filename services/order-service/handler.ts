import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { EventBridgeEvent, Context } from "aws-lambda";
import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { eventBridge } from "../libs/aws-clients";

interface OrderPlacedDetail {
  orderId?: string;
  customerId: string;
  items: Array<{ sku: string; quantity: number }>;
  _postDeployTest?: boolean;
}

export const handler = async (
  event: APIGatewayProxyEvent | EventBridgeEvent<string, OrderPlacedDetail>,
  context: Context
): Promise<APIGatewayProxyResult | void> => {
  console.log("🚀 LAMBDA INVOKED - Event received:", JSON.stringify(event, null, 2));
  console.log("🧪 Lambda cold start successful");
  console.log("🔍 Incoming event keys:", Object.keys(event));

  try {
    // --- EventBridge Invocation ---
    if ("detail" in event) {
      const detail = event.detail ?? {};
      const { orderId, customerId, items, _postDeployTest } = detail;

      if (!customerId || !items) {
        console.error("❌ Malformed EventBridge payload:", JSON.stringify(detail));
        throw new Error("Missing required fields in EventBridge payload");
      }

      if (_postDeployTest) {
        console.log("📥 Post-deploy test event received:", { orderId, customerId, items });
      } else {
        console.log("🧾 Real OrderPlaced event received:", { orderId, customerId, items });
      }

      return;
    }

    // --- API Gateway Invocation ---
    const parsed = event.body ? JSON.parse(event.body) : {};
    const { customerId, items } = parsed;
    const orderId = `order-${Date.now()}`;

    if (!customerId || !items) {
      console.error("❌ Missing fields in API Gateway body:", parsed);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing customerId or items in request body" }),
      };
    }

    const putEventsCommand = new PutEventsCommand({
      Entries: [
        {
          Source: "pulsequeue.orders",
          DetailType: "OrderPlaced",
          EventBusName: "pulsequeue-bus",
          Detail: JSON.stringify({ orderId, customerId, items }),
        },
      ],
    });

    await eventBridge.send(putEventsCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Order created", orderId }),
    };
  } catch (error) {
    console.error("💥 Unhandled exception in Lambda:", error);

    // Return a structured error only for API Gateway requests
    if ("httpMethod" in event) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Internal server error" }),
      };
    }

    // For EventBridge, just fail silently after logging
    throw error;
  }
};