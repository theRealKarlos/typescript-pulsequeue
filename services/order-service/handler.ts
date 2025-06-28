import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { EventBridgeEvent, Context } from "aws-lambda";
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

interface OrderItem {
  sku: string;
  quantity: number;
}

interface OrderPlacedDetail {
  orderId?: string;
  customerId: string;
  items: OrderItem[];
  _postDeployTest?: boolean;
}

// ============================================================================
// CUSTOM ERROR TYPES
// ============================================================================

class ValidationError extends Error {
  constructor(message: string, public details: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Type guard to check if a value is a record with string keys
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validates if an object is a valid order item
 */
function isValidOrderItem(item: unknown): item is OrderItem {
  if (!isRecord(item)) return false;
  
  return typeof item.sku === 'string' && 
         typeof item.quantity === 'number' && 
         item.quantity > 0;
}

/**
 * Validates if an object is a valid order detail
 */
function isValidOrderDetail(detail: unknown): detail is OrderPlacedDetail {
  if (!isRecord(detail)) return false;
  
  return typeof detail.customerId === 'string' && 
         Array.isArray(detail.items) && 
         detail.items.every(isValidOrderItem);
}

// ============================================================================
// EVENT TYPE DEFINITIONS
// ============================================================================

type LambdaEvent = APIGatewayProxyEvent | EventBridgeEvent<typeof EVENT_DETAIL_TYPE, OrderPlacedDetail>;

// ============================================================================
// MAIN HANDLER FUNCTION
// ============================================================================

/**
 * Lambda handler that processes both API Gateway and EventBridge events
 * - API Gateway: Creates orders and publishes to EventBridge
 * - EventBridge: Processes order events from "order.service"
 */
export const handler = async (
  event: LambdaEvent,
  context: Context
): Promise<APIGatewayProxyResult | void> => {
  try {
    // Handle EventBridge events (order processing)
    if ("detail" in event) {
      return handleEventBridgeEvent(event);
    }

    // Handle API Gateway events (order creation)
    return handleApiGatewayEvent(event);
  } catch (error) {
    console.error("💥 Unhandled exception in Lambda:", error);

    // Return structured error for API Gateway requests
    if ("httpMethod" in event) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Internal server error" }),
      };
    }

    // For EventBridge, fail silently after logging
    throw error;
  }
};

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Processes EventBridge events (order processing)
 * Accepts events from "order.service" source
 */
function handleEventBridgeEvent(event: EventBridgeEvent<typeof EVENT_DETAIL_TYPE, OrderPlacedDetail>): void {
  const detail = event.detail ?? {};
  
  if (!isValidOrderDetail(detail)) {
    console.error("❌ Malformed EventBridge payload:", JSON.stringify(detail));
    throw new ValidationError("Missing required fields in EventBridge payload", detail);
  }

  const { orderId, customerId, items, _postDeployTest } = detail;
  const source = event.source;

  if (_postDeployTest) {
    console.log("📥 Post-deploy test event received:", { source, orderId, customerId, items });
  } else {
    console.log("🧾 Real OrderPlaced event received:", { source, orderId, customerId, items });
  }
}

/**
 * Processes API Gateway events (order creation)
 */
async function handleApiGatewayEvent(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const parsed = event.body ? JSON.parse(event.body) : {};
  
  if (!isValidOrderDetail(parsed)) {
    console.error("❌ Missing fields in API Gateway body:", parsed);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing customerId or items in request body" }),
    };
  }

  const { customerId, items } = parsed;
  const orderId = `order-${Date.now()}`;

  // Publish order event to EventBridge
  const putEventsCommand = new PutEventsCommand({
    Entries: [
      {
        Source: EVENT_SOURCE,
        DetailType: EVENT_DETAIL_TYPE,
        EventBusName: EVENT_BUS_NAME,
        Detail: JSON.stringify({ orderId, customerId, items }),
      },
    ],
  });

  await eventBridge.send(putEventsCommand);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Order created", orderId }),
  };
}