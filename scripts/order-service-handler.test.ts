// Jest unit tests for the order-service Lambda handler.
// - Mocks DynamoDBClient using aws-sdk-client-mock
// - Mocks EventBridgeClient using aws-sdk-client-mock
// - Validates correct processing of order events and error handling
// - Ensures no real AWS calls are made during tests

import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { handler } from '../services/order-service/handler';
import fs from 'fs';
import path from 'path';

const ddbMock = mockClient(DynamoDBClient);
const eventBridgeMock = mockClient(EventBridgeClient);

beforeEach(() => {
  ddbMock.reset();
  ddbMock.on(UpdateItemCommand).resolves({ Attributes: {} });
  
  eventBridgeMock.reset();
  eventBridgeMock.on(PutEventsCommand).resolves({ 
    Entries: [{ EventId: 'mock-event-id' }] 
  });
});

describe('order-service handler', () => {
  it('should process a valid order and return 200', async () => {
    const eventPath = path.resolve(__dirname, 'order-service-event.local.json');
    const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).message).toMatch(/Order processed/);
  });

  it('should return 400 for invalid order (missing customerId)', async () => {
    const invalidEvent = {
      items: [{ sku: 'prod-001', quantity: 2 }]
    };
    const result = await handler(invalidEvent);
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toMatch(/Invalid order detail structure/);
  });
});
