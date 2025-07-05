// ============================================================================
// METRICS SERVICE HANDLER
// ----------------------------------------------------------------------------
// Exposes Prometheus metrics endpoint for scraping
// Generates synthetic Prometheus metrics from CloudWatch data
// since Lambda in-memory metrics are lost between invocations
// ============================================================================

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';
import { getMetrics } from '../shared/metrics';

const cloudWatchClient = new CloudWatchClient({ 
  region: process.env.AWS_REGION || 'eu-west-2'
});

/**
 * Generate synthetic Prometheus metrics from CloudWatch data
 */
async function generateSyntheticMetrics(): Promise<string> {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  
  const metrics: string[] = [];
  
  try {
    // Get Lambda request metrics from CloudWatch
    const lambdaRequestsCommand = new GetMetricStatisticsCommand({
      Namespace: 'PulseQueue',
      MetricName: 'LambdaRequests',
      StartTime: fiveMinutesAgo,
      EndTime: now,
      Period: 300,
      Statistics: ['Sum'],
      Dimensions: [
        { Name: 'FunctionName', Value: 'order-service-handler' },
        { Name: 'Status', Value: 'success' }
      ]
    });
    
    const lambdaRequestsResponse = await cloudWatchClient.send(lambdaRequestsCommand);
    if (lambdaRequestsResponse.Datapoints && lambdaRequestsResponse.Datapoints.length > 0) {
      const datapoint = lambdaRequestsResponse.Datapoints[0];
      if (datapoint && datapoint.Sum !== undefined) {
        const value = datapoint.Sum;
        metrics.push(`# HELP lambda_requests_total Total number of Lambda requests`);
        metrics.push(`# TYPE lambda_requests_total counter`);
        metrics.push(`lambda_requests_total{function_name="order-service",status="success"} ${value}`);
      }
    }
    
    // Get order processing metrics
    const ordersProcessedCommand = new GetMetricStatisticsCommand({
      Namespace: 'PulseQueue',
      MetricName: 'OrdersProcessed',
      StartTime: fiveMinutesAgo,
      EndTime: now,
      Period: 300,
      Statistics: ['Sum'],
      Dimensions: [
        { Name: 'Status', Value: 'success' }
      ]
    });
    
    const ordersResponse = await cloudWatchClient.send(ordersProcessedCommand);
    if (ordersResponse.Datapoints && ordersResponse.Datapoints.length > 0) {
      const datapoint = ordersResponse.Datapoints[0];
      if (datapoint && datapoint.Sum !== undefined) {
        const value = datapoint.Sum;
        metrics.push(`# HELP orders_processed_total Total number of orders processed`);
        metrics.push(`# TYPE orders_processed_total counter`);
        metrics.push(`orders_processed_total{status="success",error_type="none"} ${value}`);
      }
    }
    
    // Get payment processing metrics
    const paymentsProcessedCommand = new GetMetricStatisticsCommand({
      Namespace: 'PulseQueue',
      MetricName: 'PaymentsProcessed',
      StartTime: fiveMinutesAgo,
      EndTime: now,
      Period: 300,
      Statistics: ['Sum'],
      Dimensions: [
        { Name: 'Status', Value: 'success' }
      ]
    });
    
    const paymentsResponse = await cloudWatchClient.send(paymentsProcessedCommand);
    if (paymentsResponse.Datapoints && paymentsResponse.Datapoints.length > 0) {
      const datapoint = paymentsResponse.Datapoints[0];
      if (datapoint && datapoint.Sum !== undefined) {
        const value = datapoint.Sum;
        metrics.push(`# HELP payments_processed_total Total number of payments processed`);
        metrics.push(`# TYPE payments_processed_total counter`);
        metrics.push(`payments_processed_total{status="success",error_type="none"} ${value}`);
      }
    }
    
    // Get stock reservation metrics
    const stockReservationsCommand = new GetMetricStatisticsCommand({
      Namespace: 'PulseQueue',
      MetricName: 'StockReservations',
      StartTime: fiveMinutesAgo,
      EndTime: now,
      Period: 300,
      Statistics: ['Sum'],
      Dimensions: [
        { Name: 'Status', Value: 'success' }
      ]
    });
    
    const stockResponse = await cloudWatchClient.send(stockReservationsCommand);
    if (stockResponse.Datapoints && stockResponse.Datapoints.length > 0) {
      const datapoint = stockResponse.Datapoints[0];
      if (datapoint && datapoint.Sum !== undefined) {
        const value = datapoint.Sum;
        metrics.push(`# HELP stock_reservations_total Total number of stock reservations`);
        metrics.push(`# TYPE stock_reservations_total counter`);
        metrics.push(`stock_reservations_total{status="success",sku="TEST-SKU-001"} ${value}`);
      }
    }
    
    // Get inventory operations metrics
    const inventoryOperationsCommand = new GetMetricStatisticsCommand({
      Namespace: 'PulseQueue',
      MetricName: 'InventoryOperations',
      StartTime: fiveMinutesAgo,
      EndTime: now,
      Period: 300,
      Statistics: ['Sum'],
      Dimensions: [
        { Name: 'OperationType', Value: 'reserve' },
        { Name: 'Status', Value: 'success' }
      ]
    });
    
    const inventoryResponse = await cloudWatchClient.send(inventoryOperationsCommand);
    if (inventoryResponse.Datapoints && inventoryResponse.Datapoints.length > 0) {
      const datapoint = inventoryResponse.Datapoints[0];
      if (datapoint && datapoint.Sum !== undefined) {
        const value = datapoint.Sum;
        metrics.push(`# HELP inventory_operations_total Total number of inventory operations`);
        metrics.push(`# TYPE inventory_operations_total counter`);
        metrics.push(`inventory_operations_total{operation_type="reserve",status="success"} ${value}`);
      }
    }
    
  } catch (error) {
    console.warn('Failed to generate synthetic metrics from CloudWatch:', error);
  }
  
  return metrics.join('\n');
}

export const handler = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Get in-memory metrics (primary source)
    const inMemoryMetrics = await getMetrics();
    
    // Try to get synthetic CloudWatch metrics (fallback)
    let syntheticMetrics = '';
    try {
      syntheticMetrics = await generateSyntheticMetrics();
    } catch (cloudWatchError) {
      console.warn('CloudWatch metrics unavailable:', cloudWatchError);
      // Continue without CloudWatch metrics
    }
    
    // Combine metrics, with in-memory metrics taking priority
    const combinedMetrics = syntheticMetrics 
      ? `${inMemoryMetrics}\n\n# Synthetic metrics from CloudWatch\n${syntheticMetrics}`
      : inMemoryMetrics;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
      body: combinedMetrics,
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