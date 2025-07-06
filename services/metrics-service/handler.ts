// ============================================================================
// METRICS SERVICE HANDLER
// ----------------------------------------------------------------------------
// Exposes Prometheus metrics endpoint for scraping
// Generates synthetic Prometheus metrics from CloudWatch data
// since Lambda in-memory metrics are lost between invocations
// ============================================================================

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';

const cloudWatchClient = new CloudWatchClient({ 
  region: process.env.AWS_REGION || 'eu-west-2'
});

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type CloudWatchDimension = { Name: string; Value: string };
type PrometheusMetricLine = string;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Query CloudWatch for a metric sum value
 * Handles the common pattern of building a GetMetricStatisticsCommand and processing the response
 */
async function getCloudWatchSum(
  metricName: string,
  dimensions: CloudWatchDimension[],
  startTime: Date,
  endTime: Date
): Promise<number | undefined> {
  const command = new GetMetricStatisticsCommand({
    Namespace: 'PulseQueue',
    MetricName: metricName,
    StartTime: startTime,
    EndTime: endTime,
    Period: 300,
    Statistics: ['Sum'],
    Dimensions: dimensions,
  });
  
  const response = await cloudWatchClient.send(command);
  console.log(`📊 ${metricName} response:`, JSON.stringify(response, null, 2));
  
  const datapoint = response.Datapoints?.[0];
  if (datapoint && datapoint.Sum !== undefined) {
    return datapoint.Sum;
  }
  return undefined;
}

/**
 * Generate Prometheus histogram buckets from CloudWatch sum data
 * Reconstructs histogram buckets since CloudWatch only provides Sum, not bucket data
 */
function generateHistogramBuckets(
  metricName: string,
  sum: number,
  labels: Record<string, string> = {},
  buckets: number[] = [0.1, 0.5, 1, 2, 5, 10]
): PrometheusMetricLine[] {
  const lines: PrometheusMetricLine[] = [];
  
  // Estimate count based on typical duration (0.1-0.5 seconds)
  const estimatedCount = Math.max(1, Math.round(sum / 0.3));
  const averageDuration = sum / estimatedCount;
  
  // Build label string for the metric
  const labelString = Object.entries(labels)
    .map(([key, value]) => `${key}="${value}"`)
    .join(',');
  const labelPrefix = labelString ? `{${labelString}}` : '';
  
  lines.push(`# HELP ${metricName} ${metricName.replace(/_/g, ' ')}`);
  lines.push(`# TYPE ${metricName} histogram`);
  
  // Generate bucket values that Prometheus expects
  // Each bucket represents cumulative count of observations <= the bucket value
  let cumulativeCount = 0;
  
  for (const bucket of buckets) {
    // If average duration is within this bucket, all observations fall into this and higher buckets
    if (averageDuration <= bucket) {
      cumulativeCount = estimatedCount;
    }
    lines.push(`${metricName}_bucket${labelPrefix}{le="${bucket}"} ${cumulativeCount}`);
  }
  
  // +Inf bucket always contains the total count
  lines.push(`${metricName}_bucket${labelPrefix}{le="+Inf"} ${estimatedCount}`);
  lines.push(`${metricName}_sum${labelPrefix} ${sum}`);
  lines.push(`${metricName}_count${labelPrefix} ${estimatedCount}`);
  
  return lines;
}

/**
 * Generate a simple Prometheus counter metric
 */
function generateCounterMetric(
  metricName: string,
  value: number,
  labels: Record<string, string> = {}
): PrometheusMetricLine[] {
  const lines: PrometheusMetricLine[] = [];
  
  // Build label string for the metric
  const labelString = Object.entries(labels)
    .map(([key, value]) => `${key}="${value}"`)
    .join(',');
  const labelSuffix = labelString ? `{${labelString}}` : '';
  
  lines.push(`# HELP ${metricName} ${metricName.replace(/_/g, ' ')}`);
  lines.push(`# TYPE ${metricName} counter`);
  lines.push(`${metricName}${labelSuffix} ${value}`);
  
  return lines;
}

// ============================================================================
// MAIN METRICS GENERATION
// ============================================================================

/**
 * Generate synthetic Prometheus metrics from CloudWatch data
 */
async function generateSyntheticMetrics(): Promise<string> {
  const now = new Date();
  // Query for the last 2 hours to ensure we capture CloudWatch data
  // CloudWatch has delays and data might be from earlier periods
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  
  const metrics: PrometheusMetricLine[] = [];
  
  try {
    console.log('🔍 Querying CloudWatch metrics from', twoHoursAgo.toISOString(), 'to', now.toISOString());
    
    // Get Lambda request metrics for order service
    const orderLambdaRequests = await getCloudWatchSum(
      'LambdaRequests',
      [
        { Name: 'FunctionName', Value: 'order-service' },
        { Name: 'Status', Value: 'success' }
      ],
      twoHoursAgo,
      now
    );
    
    if (orderLambdaRequests !== undefined) {
      metrics.push(...generateCounterMetric('lambda_requests_total', orderLambdaRequests, {
        function_name: 'order-service',
        status: 'success'
      }));
    }
    
    // Get Lambda request metrics for payment service
    const paymentLambdaRequests = await getCloudWatchSum(
      'LambdaRequests',
      [
        { Name: 'FunctionName', Value: 'payment-service' },
        { Name: 'Status', Value: 'success' }
      ],
      twoHoursAgo,
      now
    );
    
    if (paymentLambdaRequests !== undefined) {
      metrics.push(...generateCounterMetric('lambda_requests_total', paymentLambdaRequests, {
        function_name: 'payment-service',
        status: 'success'
      }));
    }
    
    // Get order processing metrics
    const ordersProcessed = await getCloudWatchSum(
      'OrdersProcessed',
      [
        { Name: 'Status', Value: 'success' },
        { Name: 'ErrorType', Value: 'none' }
      ],
      twoHoursAgo,
      now
    );
    
    if (ordersProcessed !== undefined) {
      metrics.push(...generateCounterMetric('orders_processed_total', ordersProcessed, {
        status: 'success',
        error_type: 'none'
      }));
    }
    
    // Get order processing duration metrics
    const orderDuration = await getCloudWatchSum(
      'OrderProcessingDuration',
      [],
      twoHoursAgo,
      now
    );
    
    if (orderDuration !== undefined) {
      metrics.push(...generateHistogramBuckets('order_processing_duration_seconds', orderDuration));
    }
    
    // Get Lambda duration metrics for order service
    const orderLambdaDuration = await getCloudWatchSum(
      'LambdaDuration',
      [
        { Name: 'FunctionName', Value: 'order-service' }
      ],
      twoHoursAgo,
      now
    );
    
    if (orderLambdaDuration !== undefined) {
      metrics.push(...generateHistogramBuckets('lambda_request_duration_seconds', orderLambdaDuration, {
        function_name: 'order-service'
      }));
    }
    
    // Get stock reservation metrics for prod-001
    const stockReservations = await getCloudWatchSum(
      'StockReservations',
      [
        { Name: 'Status', Value: 'success' },
        { Name: 'SKU', Value: 'prod-001' }
      ],
      twoHoursAgo,
      now
    );
    
    if (stockReservations !== undefined) {
      metrics.push(...generateCounterMetric('stock_reservations_total', stockReservations, {
        status: 'success',
        sku: 'prod-001'
      }));
    }
    
    // Get inventory operations metrics for reserve operations
    const inventoryReserve = await getCloudWatchSum(
      'InventoryOperations',
      [
        { Name: 'OperationType', Value: 'reserve' },
        { Name: 'Status', Value: 'success' }
      ],
      twoHoursAgo,
      now
    );
    
    if (inventoryReserve !== undefined) {
      metrics.push(...generateCounterMetric('inventory_operations_total', inventoryReserve, {
        operation_type: 'reserve',
        status: 'success'
      }));
    }
    
    // Get inventory operations metrics for decrement_stock operations
    const inventoryDecrementStock = await getCloudWatchSum(
      'InventoryOperations',
      [
        { Name: 'OperationType', Value: 'decrement_stock' },
        { Name: 'Status', Value: 'success' }
      ],
      twoHoursAgo,
      now
    );
    
    if (inventoryDecrementStock !== undefined) {
      metrics.push(...generateCounterMetric('inventory_operations_total', inventoryDecrementStock, {
        operation_type: 'decrement_stock',
        status: 'success'
      }));
    }
    
    // Get inventory operations metrics for decrement_reserved operations
    const inventoryDecrementReserved = await getCloudWatchSum(
      'InventoryOperations',
      [
        { Name: 'OperationType', Value: 'decrement_reserved' },
        { Name: 'Status', Value: 'success' }
      ],
      twoHoursAgo,
      now
    );
    
    if (inventoryDecrementReserved !== undefined) {
      metrics.push(...generateCounterMetric('inventory_operations_total', inventoryDecrementReserved, {
        operation_type: 'decrement_reserved',
        status: 'success'
      }));
    }
    
    // Get payment processing metrics from CloudWatch
    // Tracks successful payment processing events from the payment service
    const paymentsProcessed = await getCloudWatchSum(
      'PaymentsProcessed',
      [
        { Name: 'Status', Value: 'success' },
        { Name: 'ErrorType', Value: 'none' }
      ],
      twoHoursAgo,
      now
    );
    
    if (paymentsProcessed !== undefined) {
      metrics.push(...generateCounterMetric('payments_processed_total', paymentsProcessed, {
        status: 'success',
        error_type: 'none'
      }));
    }
    
    // Get payment processing duration metrics from CloudWatch
    // Similar to order processing duration, we reconstruct histogram from CloudWatch Sum data
    // This tracks how long payment processing takes, including DynamoDB operations
    const paymentDuration = await getCloudWatchSum(
      'PaymentProcessingDuration',
      [],
      twoHoursAgo,
      now
    );
    
    if (paymentDuration !== undefined) {
      metrics.push(...generateHistogramBuckets('payment_processing_duration_seconds', paymentDuration));
    }
    
    // Get Lambda duration metrics for payment service from CloudWatch
    // Tracks execution time of the payment service Lambda function
    // Important for monitoring payment service performance and costs
    const paymentLambdaDuration = await getCloudWatchSum(
      'LambdaDuration',
      [
        { Name: 'FunctionName', Value: 'payment-service' }
      ],
      twoHoursAgo,
      now
    );
    
    if (paymentLambdaDuration !== undefined) {
      metrics.push(...generateHistogramBuckets('lambda_request_duration_seconds', paymentLambdaDuration, {
        function_name: 'payment-service'
      }));
    }
    
    console.log('📈 Generated metrics:', metrics);
    
  } catch (error) {
    console.warn('Failed to generate synthetic metrics from CloudWatch:', error);
  }
  
  return metrics.join('\n');
}

// ============================================================================
// LAMBDA HANDLER
// ============================================================================

export const handler = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Generate synthetic CloudWatch metrics (primary source for serverless environment)
    // Note: In-memory metrics are not used because Lambda functions lose state between invocations
    const syntheticMetrics = await generateSyntheticMetrics();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
      body: syntheticMetrics,
    };
  } catch (error) {
    console.error('Error generating metrics:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Failed to generate metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}; 