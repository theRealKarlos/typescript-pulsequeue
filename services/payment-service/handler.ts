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

export const handler = async (event: PaymentEvent & { _postDeployTestForceResult?: 'SUCCESS' | 'FAILURE' }) => {
  console.log('Received payment event:', JSON.stringify(event));

  // Support forced payment result for post-deploy tests
  let paymentSuccess: boolean;
  if (event._postDeployTestForceResult === 'SUCCESS') {
    paymentSuccess = true;
  } else if (event._postDeployTestForceResult === 'FAILURE') {
    paymentSuccess = false;
  } else {
    paymentSuccess = Math.random() < 0.5;
  }
  console.log(`Payment outcome: ${paymentSuccess ? 'SUCCESS' : 'FAILURE'}`);

  for (const item of event.items) {
    // Always decrement reserved
    const updateParams: UpdateItemCommandInput = {
      TableName: TABLE_NAME,
      Key: { item_id: { S: item.sku } },
      UpdateExpression: 'ADD reserved :minusOne',
      ExpressionAttributeValues: { ':minusOne': { N: '-1' } },
    };
    await client.send(new UpdateItemCommand(updateParams));
    console.log(`Decremented reserved for item ${item.sku}`);

    if (paymentSuccess) {
      // On success, also decrement stock
      const updateStockParams: UpdateItemCommandInput = {
        TableName: TABLE_NAME,
        Key: { item_id: { S: item.sku } },
        UpdateExpression: 'ADD stock :minusOne',
        ExpressionAttributeValues: { ':minusOne': { N: '-1' } },
      };
      await client.send(new UpdateItemCommand(updateStockParams));
      console.log(`Decremented stock for item ${item.sku}`);
    }
  }

  return {
    orderId: event.orderId,
    paymentId: randomUUID(),
    status: paymentSuccess ? 'SUCCESS' : 'FAILURE',
  };
}; 