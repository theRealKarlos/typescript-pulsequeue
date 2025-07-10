// ============================================================================
// SHARED EVENTBRIDGE CONSTANTS
// ============================================================================

const ENV = process.env.ENVIRONMENT;
if (!ENV) {
  throw new Error('ENVIRONMENT environment variable must be set');
}

export const ORDER_EVENTBRIDGE_CONFIG = {
  REGION: 'eu-west-2',
  SOURCE: 'order.service',
  DETAIL_TYPE: 'OrderPlaced',
  BUS_NAME: `${ENV}-order-bus`,
  ORDER_LAMBDA_LOG_GROUP: `/aws/lambda/${ENV}-order-service-handler`,
  PAYMENT_LAMBDA_LOG_GROUP: `/aws/lambda/${ENV}-payment-service-handler`,
  INVENTORY_TABLE_NAME: `${ENV}-inventory-table`,
} as const;

export const PAYMENT_EVENTBRIDGE_CONFIG = {
  SOURCE: 'payment.service',
  DETAIL_TYPE: 'PaymentRequested',
  REGION: 'eu-west-2',
} as const;

export const INVENTORY_DYNAMODB_CONFIG = {
  TABLE_NAME: `${ENV}-inventory-table`,
  REGION: 'eu-west-2',
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type OrderEventBridgeConfig = typeof ORDER_EVENTBRIDGE_CONFIG;
export type PaymentEventBridgeConfig = typeof PAYMENT_EVENTBRIDGE_CONFIG;
export type InventoryDynamoDBConfig = typeof INVENTORY_DYNAMODB_CONFIG;
