// ============================================================================
// PROMETHEUS METRICS FOR PULSEQUEUE
// ----------------------------------------------------------------------------
// Shared metrics module for order and payment services
// Collects business and performance metrics for Prometheus
// ============================================================================

import { Counter, Histogram, Gauge, Registry } from 'prom-client';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

// Create a registry to hold all metrics
export const metricsRegistry = new Registry();

// CloudWatch client for fallback metrics
const cloudWatchClient = new CloudWatchClient({ 
  region: process.env.AWS_REGION || 'eu-west-2'
});

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

/**
 * Record Lambda request metrics and also send to CloudWatch for persistence
 */
export function recordLambdaRequest(functionName: string, status: string, duration: number) {
  // Record in Prometheus registry
  lambdaRequestsTotal.inc({ function_name: functionName, status });
  lambdaRequestDuration.observe({ function_name: functionName }, duration);
  
  // Also send to CloudWatch for persistence across invocations
  sendCloudWatchMetric('LambdaRequests', 1, [
    { Name: 'FunctionName', Value: functionName },
    { Name: 'Status', Value: status }
  ]);
  
  sendCloudWatchMetric('LambdaDuration', duration, [
    { Name: 'FunctionName', Value: functionName }
  ]);
}

/**
 * Record Lambda error metrics
 */
export function recordLambdaError(functionName: string, errorType: string) {
  // Record in Prometheus registry
  lambdaErrorsTotal.inc({ function_name: functionName, error_type: errorType });
  
  // Also send to CloudWatch
  sendCloudWatchMetric('LambdaErrors', 1, [
    { Name: 'FunctionName', Value: functionName },
    { Name: 'ErrorType', Value: errorType }
  ]);
}

/**
 * Record order processing metrics
 */
export function recordOrderProcessed(status: string, duration: number, errorType?: string) {
  // Record in Prometheus registry
  ordersProcessedTotal.inc({ status, error_type: errorType || 'none' });
  orderProcessingDuration.observe({}, duration);
  
  // Also send to CloudWatch
  sendCloudWatchMetric('OrdersProcessed', 1, [
    { Name: 'Status', Value: status },
    { Name: 'ErrorType', Value: errorType || 'none' }
  ]);
  
  sendCloudWatchMetric('OrderProcessingDuration', duration, []);
}

/**
 * Record payment processing metrics
 */
export function recordPaymentProcessed(status: string, duration: number, errorType?: string) {
  // Record in Prometheus registry
  paymentsProcessedTotal.inc({ status, error_type: errorType || 'none' });
  paymentProcessingDuration.observe({}, duration);
  
  // Also send to CloudWatch
  sendCloudWatchMetric('PaymentsProcessed', 1, [
    { Name: 'Status', Value: status },
    { Name: 'ErrorType', Value: errorType || 'none' }
  ]);
  
  sendCloudWatchMetric('PaymentProcessingDuration', duration, []);
}

/**
 * Record stock reservation metrics
 */
export function recordStockReservation(status: string, sku: string) {
  // Record in Prometheus registry
  stockReservationsTotal.inc({ status, sku });
  
  // Also send to CloudWatch
  sendCloudWatchMetric('StockReservations', 1, [
    { Name: 'Status', Value: status },
    { Name: 'SKU', Value: sku }
  ]);
}

/**
 * Record inventory operation metrics
 */
export function recordInventoryOperation(operationType: string, status: string) {
  // Record in Prometheus registry
  inventoryOperationsTotal.inc({ operation_type: operationType, status });
  
  // Also send to CloudWatch
  sendCloudWatchMetric('InventoryOperations', 1, [
    { Name: 'OperationType', Value: operationType },
    { Name: 'Status', Value: status }
  ]);
}

/**
 * Update stock quantity gauge
 */
export function updateStockQuantity(sku: string, quantity: number) {
  // Record in Prometheus registry
  stockQuantity.set({ sku }, quantity);
  
  // Also send to CloudWatch
  sendCloudWatchMetric('StockQuantity', quantity, [
    { Name: 'SKU', Value: sku }
  ]);
}

/**
 * Send metric to CloudWatch for persistence across Lambda invocations
 */
async function sendCloudWatchMetric(
  metricName: string, 
  value: number, 
  dimensions: Array<{ Name: string; Value: string }>
) {
  // Skip CloudWatch in test environment
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  
  try {
    const command = new PutMetricDataCommand({
      Namespace: 'PulseQueue',
      MetricData: [{
        MetricName: metricName,
        Value: value,
        Unit: 'Count',
        Dimensions: dimensions,
        Timestamp: new Date()
      }]
    });
    
    await cloudWatchClient.send(command);
  } catch (error) {
    // Silently fail - CloudWatch metrics are optional
    console.warn('Failed to send CloudWatch metric:', error);
  }
}

// ============================================================================
// METRICS EXPORT
// ============================================================================

export async function getMetrics(): Promise<string> {
  return await metricsRegistry.metrics();
} 