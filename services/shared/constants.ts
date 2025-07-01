// ============================================================================
// SHARED EVENTBRIDGE CONSTANTS
// ============================================================================

export const ORDER_EVENTBRIDGE_CONFIG = {
  SOURCE: 'order.service',
  DETAIL_TYPE: 'OrderPlaced',
  BUS_NAME: 'dev-order-bus',
  REGION: 'eu-west-2',
} as const;

export const PAYMENT_EVENTBRIDGE_CONFIG = {
  SOURCE: 'payment.service',
  DETAIL_TYPE: 'PaymentRequested',
  BUS_NAME: 'dev-payment-bus',
  REGION: 'eu-west-2',
} as const;

export const INVENTORY_DYNAMODB_CONFIG = {
  TABLE_NAME: 'dev-inventory-table',
  REGION: 'eu-west-2',
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type OrderEventBridgeConfig = typeof ORDER_EVENTBRIDGE_CONFIG;
export type PaymentEventBridgeConfig = typeof PAYMENT_EVENTBRIDGE_CONFIG;
export type InventoryDynamoDBConfig = typeof INVENTORY_DYNAMODB_CONFIG;
