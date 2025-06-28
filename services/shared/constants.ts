// ============================================================================
// SHARED EVENTBRIDGE CONSTANTS
// ============================================================================

export const EVENTBRIDGE_CONFIG = {
  SOURCE: "order.service",
  DETAIL_TYPE: "OrderPlaced",
  BUS_NAME: "dev-pulsequeue-bus",
  REGION: "eu-west-2"
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type EventBridgeConfig = typeof EVENTBRIDGE_CONFIG; 