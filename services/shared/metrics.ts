// ============================================================================
// PROMETHEUS METRICS FOR PULSEQUEUE
// ----------------------------------------------------------------------------
// Shared metrics module for order and payment services
// Collects business and performance metrics for Prometheus
// ============================================================================

import { Counter, Histogram, Gauge, Registry } from 'prom-client';

// Create a registry to hold all metrics
export const metricsRegistry = new Registry();

// ============================================================================
// LAMBDA PERFORMANCE METRICS
// ============================================================================

export const lambdaRequestsTotal = new Counter({
  name: 'lambda_requests_total',
  help: 'Total number of Lambda requests',
  labelNames: ['function_name', 'status'],
  registers: [metricsRegistry],
});

export const lambdaRequestDuration = new Histogram({
  name: 'lambda_request_duration_seconds',
  help: 'Lambda request duration in seconds',
  labelNames: ['function_name'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [metricsRegistry],
});

export const lambdaErrorsTotal = new Counter({
  name: 'lambda_errors_total',
  help: 'Total number of Lambda errors',
  labelNames: ['function_name', 'error_type'],
  registers: [metricsRegistry],
});

// ============================================================================
// BUSINESS METRICS
// ============================================================================

export const ordersProcessedTotal = new Counter({
  name: 'orders_processed_total',
  help: 'Total number of orders processed',
  labelNames: ['status', 'error_type'],
  registers: [metricsRegistry],
});

export const orderProcessingDuration = new Histogram({
  name: 'order_processing_duration_seconds',
  help: 'Order processing duration in seconds',
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [metricsRegistry],
});

export const paymentsProcessedTotal = new Counter({
  name: 'payments_processed_total',
  help: 'Total number of payments processed',
  labelNames: ['status', 'error_type'],
  registers: [metricsRegistry],
});

export const paymentProcessingDuration = new Histogram({
  name: 'payment_processing_duration_seconds',
  help: 'Payment processing duration in seconds',
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [metricsRegistry],
});

// ============================================================================
// INVENTORY METRICS
// ============================================================================

export const stockReservationsTotal = new Counter({
  name: 'stock_reservations_total',
  help: 'Total number of stock reservations',
  labelNames: ['status', 'sku'],
  registers: [metricsRegistry],
});

export const inventoryOperationsTotal = new Counter({
  name: 'inventory_operations_total',
  help: 'Total number of inventory operations',
  labelNames: ['operation_type', 'status'],
  registers: [metricsRegistry],
});

export const stockQuantity = new Gauge({
  name: 'stock_quantity',
  help: 'Current stock quantity by SKU',
  labelNames: ['sku'],
  registers: [metricsRegistry],
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function recordLambdaRequest(functionName: string, status: string, duration: number) {
  lambdaRequestsTotal.inc({ function_name: functionName, status });
  lambdaRequestDuration.observe({ function_name: functionName }, duration);
}

export function recordLambdaError(functionName: string, errorType: string) {
  lambdaErrorsTotal.inc({ function_name: functionName, error_type: errorType });
}

export function recordOrderProcessed(status: string, duration: number, errorType?: string) {
  ordersProcessedTotal.inc({ status, error_type: errorType || 'none' });
  orderProcessingDuration.observe({}, duration);
}

export function recordPaymentProcessed(status: string, duration: number, errorType?: string) {
  paymentsProcessedTotal.inc({ status, error_type: errorType || 'none' });
  paymentProcessingDuration.observe({}, duration);
}

export function recordStockReservation(status: string, sku: string) {
  stockReservationsTotal.inc({ status, sku });
}

export function recordInventoryOperation(operationType: string, status: string) {
  inventoryOperationsTotal.inc({ operation_type: operationType, status });
}

export function updateStockQuantity(sku: string, quantity: number) {
  stockQuantity.set({ sku }, quantity);
}

// ============================================================================
// METRICS EXPORT
// ============================================================================

export async function getMetrics(): Promise<string> {
  return await metricsRegistry.metrics();
} 