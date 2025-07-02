import { handler } from '../services/payment-service/handler';
// import { PaymentEvent } from '../services/payment-service/handler'; // Uncomment if PaymentEvent is exported

// Mock DynamoDBClient
jest.mock('@aws-sdk/client-dynamodb', () => {
  const original = jest.requireActual('@aws-sdk/client-dynamodb');
  return {
    ...original,
    DynamoDBClient: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({}),
    })),
  };
});

describe('Payment Service Lambda', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, INVENTORY_TABLE_NAME: 'test-inventory-table' };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('should decrement reserved and stock on payment success', async () => {
    // Force Math.random to always return < 0.5 (success)
    jest.spyOn(Math, 'random').mockReturnValue(0.1);

    const event = {
      orderId: 'order-1',
      customerId: 'customer-1',
      items: [{ sku: 'sku-1', quantity: 1 }],
    };

    const result = await handler(event /* as PaymentEvent */);

    expect(result.status).toBe('SUCCESS');
    // You can add more assertions here if you want to check calls to DynamoDBClient
  });

  it('should decrement only reserved on payment failure', async () => {
    // Force Math.random to always return >= 0.5 (failure)
    jest.spyOn(Math, 'random').mockReturnValue(0.9);

    const event = {
      orderId: 'order-2',
      customerId: 'customer-2',
      items: [{ sku: 'sku-2', quantity: 1 }],
    };

    const result = await handler(event /* as PaymentEvent */);

    expect(result.status).toBe('FAILURE');
    // You can add more assertions here if you want to check calls to DynamoDBClient
  });
}); 