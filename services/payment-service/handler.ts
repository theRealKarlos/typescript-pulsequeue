// ============================================================================
// PAYMENT SERVICE LAMBDA HANDLER
// ----------------------------------------------------------------------------
// This Lambda is triggered by payment events from the payment EventBridge bus.
// It simulates payment processing, logs the event, and randomly determines
// success or failure. On either outcome, it decrements the 'reserved' count
// in the DynamoDB inventory table. On success, it also decrements 'stock'.
// The handler is ready to process multiple items per event, but the concept
// currently assumes single-product purchases.
// ============================================================================

import { DynamoDBClient, UpdateItemCommand, UpdateItemCommandInput } from '@aws-sdk/client-dynamodb';
import { randomUUID } from 'crypto';

const TABLE_NAME = process.env.INVENTORY_TABLE_NAME!;
const client = new DynamoDBClient({});

interface PaymentEvent {
  orderId: string;
  customerId: string;
  items: Array<{ sku: string; quantity: number }>;
}

// Type guard to check if an object has a 'detail' property
function hasDetail(obj: unknown): obj is { detail: PaymentEvent & { _postDeployTestForceResult?: 'SUCCESS' | 'FAILURE' } } {
  return typeof obj === 'object' && obj !== null && 'detail' in obj && typeof (obj as { detail?: unknown }).detail === 'object';
}

export const handler = async (event: PaymentEvent & { _postDeployTestForceResult?: 'SUCCESS' | 'FAILURE' }) => {
  console.log('Received payment event:', JSON.stringify(event));

  // EventBridge wraps the original event in a 'detail' property when invoking the Lambda.
  // Normalise to always use the payload, whether invoked directly or via EventBridge.
  const payload: PaymentEvent & { _postDeployTestForceResult?: 'SUCCESS' | 'FAILURE' } = hasDetail(event) ? event.detail : event;
  console.log('DEBUG payment event payload:', JSON.stringify(payload));
  if (!Array.isArray(payload.items)) {
    throw new Error('Payment event missing items array');
  }

  // Support forced payment result for post-deploy tests
  let paymentSuccess: boolean;
  if (payload._postDeployTestForceResult === 'SUCCESS') {
    paymentSuccess = true;
  } else if (payload._postDeployTestForceResult === 'FAILURE') {
    paymentSuccess = false;
  } else {
    paymentSuccess = Math.random() < 0.5;
  }
  console.log(`Payment outcome: ${paymentSuccess ? 'SUCCESS' : 'FAILURE'}`);

  for (const item of payload.items) {
    // Always decrement reserved by the quantity
    const updateParams: UpdateItemCommandInput = {
      TableName: TABLE_NAME,
      Key: { item_id: { S: item.sku } },
      UpdateExpression: 'ADD reserved :minusQty',
      ExpressionAttributeValues: { ':minusQty': { N: (-item.quantity).toString() } },
    };
    await client.send(new UpdateItemCommand(updateParams));
    console.log(`Decremented reserved for item ${item.sku} by ${item.quantity}`);

    if (paymentSuccess) {
      // On success, also decrement stock by the quantity
      const updateStockParams: UpdateItemCommandInput = {
        TableName: TABLE_NAME,
        Key: { item_id: { S: item.sku } },
        UpdateExpression: 'ADD stock :minusQty',
        ExpressionAttributeValues: { ':minusQty': { N: (-item.quantity).toString() } },
      };
      await client.send(new UpdateItemCommand(updateStockParams));
      console.log(`Decremented stock for item ${item.sku} by ${item.quantity}`);
    }
  }

  return {
    orderId: payload.orderId,
    paymentId: randomUUID(),
    status: paymentSuccess ? 'SUCCESS' : 'FAILURE',
  };
}; 