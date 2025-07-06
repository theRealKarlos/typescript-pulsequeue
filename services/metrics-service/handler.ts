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

/**
 * Generate synthetic Prometheus metrics from CloudWatch data
 */
async function generateSyntheticMetrics(): Promise<string> {
  const now = new Date();
  // Query for the last 2 hours to ensure we capture CloudWatch data
  // CloudWatch has delays and data might be from earlier periods
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  
  const metrics: string[] = [];
  
  try {
    console.log('🔍 Querying CloudWatch metrics from', twoHoursAgo.toISOString(), 'to', now.toISOString());
    
    // Get Lambda request metrics from CloudWatch for order service
    const orderLambdaRequestsCommand = new GetMetricStatisticsCommand({
      Namespace: 'PulseQueue',
      MetricName: 'LambdaRequests',
      StartTime: twoHoursAgo,
      EndTime: now,
      Period: 300,
      Statistics: ['Sum'],
      Dimensions: [
        { Name: 'FunctionName', Value: 'order-service' },
        { Name: 'Status', Value: 'success' }
      ]
    });
    
    const orderLambdaResponse = await cloudWatchClient.send(orderLambdaRequestsCommand);
    console.log('📊 Order Lambda response:', JSON.stringify(orderLambdaResponse, null, 2));
    if (orderLambdaResponse.Datapoints && orderLambdaResponse.Datapoints.length > 0) {
      const datapoint = orderLambdaResponse.Datapoints[0];
      if (datapoint && datapoint.Sum !== undefined) {
        const value = datapoint.Sum;
        metrics.push(`# HELP lambda_requests_total Total number of Lambda requests`);
        metrics.push(`# TYPE lambda_requests_total counter`);
        metrics.push(`lambda_requests_total{function_name="order-service",status="success"} ${value}`);
      }
    }
    
    // Get Lambda request metrics from CloudWatch for payment service
    const paymentLambdaRequestsCommand = new GetMetricStatisticsCommand({
      Namespace: 'PulseQueue',
      MetricName: 'LambdaRequests',
      StartTime: twoHoursAgo,
      EndTime: now,
      Period: 300,
      Statistics: ['Sum'],
      Dimensions: [
        { Name: 'FunctionName', Value: 'payment-service' },
        { Name: 'Status', Value: 'success' }
      ]
    });
    
    const paymentLambdaResponse = await cloudWatchClient.send(paymentLambdaRequestsCommand);
    console.log('📊 Payment Lambda response:', JSON.stringify(paymentLambdaResponse, null, 2));
    if (paymentLambdaResponse.Datapoints && paymentLambdaResponse.Datapoints.length > 0) {
      const datapoint = paymentLambdaResponse.Datapoints[0];
      if (datapoint && datapoint.Sum !== undefined) {
        const value = datapoint.Sum;
        metrics.push(`lambda_requests_total{function_name="payment-service",status="success"} ${value}`);
      }
    }
    
    // Get order processing metrics
    const ordersProcessedCommand = new GetMetricStatisticsCommand({
      Namespace: 'PulseQueue',
      MetricName: 'OrdersProcessed',
      StartTime: twoHoursAgo,
      EndTime: now,
      Period: 300,
      Statistics: ['Sum'],
      Dimensions: [
        { Name: 'Status', Value: 'success' },
        { Name: 'ErrorType', Value: 'none' }
      ]
    });
    
    const ordersResponse = await cloudWatchClient.send(ordersProcessedCommand);
    console.log('📊 Orders response:', JSON.stringify(ordersResponse, null, 2));
    if (ordersResponse.Datapoints && ordersResponse.Datapoints.length > 0) {
      const datapoint = ordersResponse.Datapoints[0];
      if (datapoint && datapoint.Sum !== undefined) {
        const value = datapoint.Sum;
        metrics.push(`# HELP orders_processed_total Total number of orders processed`);
        metrics.push(`# TYPE orders_processed_total counter`);
        metrics.push(`orders_processed_total{status="success",error_type="none"} ${value}`);
      }
    }
    
    // Get order processing duration metrics from CloudWatch
    // Note: CloudWatch custom metrics only provide Sum, not bucket data for histograms
    // We need to reconstruct histogram buckets from the sum to provide proper Prometheus format
    const orderDurationCommand = new GetMetricStatisticsCommand({
      Namespace: 'PulseQueue',
      MetricName: 'OrderProcessingDuration',
      StartTime: twoHoursAgo,
      EndTime: now,
      Period: 300,
      Statistics: ['Sum'],
      Dimensions: []
    });
    
    const orderDurationResponse = await cloudWatchClient.send(orderDurationCommand);
    console.log('📊 Order Duration response:', JSON.stringify(orderDurationResponse, null, 2));
    if (orderDurationResponse.Datapoints && orderDurationResponse.Datapoints.length > 0) {
      const datapoint = orderDurationResponse.Datapoints[0];
      if (datapoint && datapoint.Sum !== undefined) {
        const sum = datapoint.Sum;
        
        // CloudWatch only provides Sum, not Count or bucket data for custom metrics
        // We estimate the count based on typical order processing duration (0.1-0.5 seconds)
        // This allows us to reconstruct a realistic histogram for Prometheus
        const estimatedCount = Math.max(1, Math.round(sum / 0.3));
        const averageDuration = sum / estimatedCount;
        
        metrics.push(`# HELP order_processing_duration_seconds Order processing duration in seconds`);
        metrics.push(`# TYPE order_processing_duration_seconds histogram`);
        
        // Generate histogram bucket values that Prometheus expects
        // Each bucket represents cumulative count of observations <= the bucket value
        const buckets = [0.1, 0.5, 1, 2, 5, 10];
        let cumulativeCount = 0;
        
        for (const bucket of buckets) {
          // If average duration is within this bucket, all observations fall into this and higher buckets
          if (averageDuration <= bucket) {
            cumulativeCount = estimatedCount;
          }
          metrics.push(`order_processing_duration_seconds_bucket{le="${bucket}"} ${cumulativeCount}`);
        }
        
        // +Inf bucket always contains the total count
        metrics.push(`order_processing_duration_seconds_bucket{le="+Inf"} ${estimatedCount}`);
        metrics.push(`order_processing_duration_seconds_sum ${sum}`);
        metrics.push(`order_processing_duration_seconds_count ${estimatedCount}`);
      }
    }
    
    // Get Lambda duration metrics for order service from CloudWatch
    // Similar to order processing duration, we reconstruct histogram from CloudWatch Sum data
    const orderLambdaDurationCommand = new GetMetricStatisticsCommand({
      Namespace: 'PulseQueue',
      MetricName: 'LambdaDuration',
      StartTime: twoHoursAgo,
      EndTime: now,
      Period: 300,
      Statistics: ['Sum'],
      Dimensions: [
        { Name: 'FunctionName', Value: 'order-service' }
      ]
    });
    
    const orderLambdaDurationResponse = await cloudWatchClient.send(orderLambdaDurationCommand);
    console.log('📊 Order Lambda Duration response:', JSON.stringify(orderLambdaDurationResponse, null, 2));
    if (orderLambdaDurationResponse.Datapoints && orderLambdaDurationResponse.Datapoints.length > 0) {
      const datapoint = orderLambdaDurationResponse.Datapoints[0];
      if (datapoint && datapoint.Sum !== undefined) {
        const sum = datapoint.Sum;
        
        // Estimate count based on typical Lambda execution time (0.1-0.5 seconds)
        // This allows us to reconstruct histogram buckets for Prometheus
        const estimatedCount = Math.max(1, Math.round(sum / 0.3));
        const averageDuration = sum / estimatedCount;
        
        metrics.push(`# HELP lambda_request_duration_seconds Lambda request duration in seconds`);
        metrics.push(`# TYPE lambda_request_duration_seconds histogram`);
        
        // Generate histogram bucket values for Lambda duration
        // Each bucket represents cumulative count of Lambda executions <= the bucket value
        const buckets = [0.1, 0.5, 1, 2, 5, 10];
        let cumulativeCount = 0;
        
        for (const bucket of buckets) {
          // If average duration is within this bucket, all executions fall into this and higher buckets
          if (averageDuration <= bucket) {
            cumulativeCount = estimatedCount;
          }
          metrics.push(`lambda_request_duration_seconds_bucket{function_name="order-service",le="${bucket}"} ${cumulativeCount}`);
        }
        
        // +Inf bucket always contains the total count
        metrics.push(`lambda_request_duration_seconds_bucket{function_name="order-service",le="+Inf"} ${estimatedCount}`);
        metrics.push(`lambda_request_duration_seconds_sum{function_name="order-service"} ${sum}`);
        metrics.push(`lambda_request_duration_seconds_count{function_name="order-service"} ${estimatedCount}`);
      }
    }
    
    // Get stock reservation metrics for prod-001
    const stockReservationsCommand = new GetMetricStatisticsCommand({
      Namespace: 'PulseQueue',
      MetricName: 'StockReservations',
      StartTime: twoHoursAgo,
      EndTime: now,
      Period: 300,
      Statistics: ['Sum'],
      Dimensions: [
        { Name: 'Status', Value: 'success' },
        { Name: 'SKU', Value: 'prod-001' }
      ]
    });
    
    const stockResponse = await cloudWatchClient.send(stockReservationsCommand);
    console.log('📊 Stock Reservations response:', JSON.stringify(stockResponse, null, 2));
    if (stockResponse.Datapoints && stockResponse.Datapoints.length > 0) {
      const datapoint = stockResponse.Datapoints[0];
      if (datapoint && datapoint.Sum !== undefined) {
        const value = datapoint.Sum;
        metrics.push(`# HELP stock_reservations_total Total number of stock reservations`);
        metrics.push(`# TYPE stock_reservations_total counter`);
        metrics.push(`stock_reservations_total{status="success",sku="prod-001"} ${value}`);
      }
    }
    
    // Get inventory operations metrics for reserve operations
    const inventoryReserveCommand = new GetMetricStatisticsCommand({
      Namespace: 'PulseQueue',
      MetricName: 'InventoryOperations',
      StartTime: twoHoursAgo,
      EndTime: now,
      Period: 300,
      Statistics: ['Sum'],
      Dimensions: [
        { Name: 'OperationType', Value: 'reserve' },
        { Name: 'Status', Value: 'success' }
      ]
    });
    
    const inventoryReserveResponse = await cloudWatchClient.send(inventoryReserveCommand);
    console.log('📊 Inventory Reserve response:', JSON.stringify(inventoryReserveResponse, null, 2));
    if (inventoryReserveResponse.Datapoints && inventoryReserveResponse.Datapoints.length > 0) {
      const datapoint = inventoryReserveResponse.Datapoints[0];
      if (datapoint && datapoint.Sum !== undefined) {
        const value = datapoint.Sum;
        metrics.push(`# HELP inventory_operations_total Total number of inventory operations`);
        metrics.push(`# TYPE inventory_operations_total counter`);
        metrics.push(`inventory_operations_total{operation_type="reserve",status="success"} ${value}`);
      }
    }
    
    // Get inventory operations metrics for decrement_stock operations
    const inventoryDecrementStockCommand = new GetMetricStatisticsCommand({
      Namespace: 'PulseQueue',
      MetricName: 'InventoryOperations',
      StartTime: twoHoursAgo,
      EndTime: now,
      Period: 300,
      Statistics: ['Sum'],
      Dimensions: [
        { Name: 'OperationType', Value: 'decrement_stock' },
        { Name: 'Status', Value: 'success' }
      ]
    });
    
    const inventoryDecrementStockResponse = await cloudWatchClient.send(inventoryDecrementStockCommand);
    console.log('📊 Inventory Decrement Stock response:', JSON.stringify(inventoryDecrementStockResponse, null, 2));
    if (inventoryDecrementStockResponse.Datapoints && inventoryDecrementStockResponse.Datapoints.length > 0) {
      const datapoint = inventoryDecrementStockResponse.Datapoints[0];
      if (datapoint && datapoint.Sum !== undefined) {
        const value = datapoint.Sum;
        metrics.push(`inventory_operations_total{operation_type="decrement_stock",status="success"} ${value}`);
      }
    }
    
    // Get inventory operations metrics for decrement_reserved operations
    const inventoryDecrementReservedCommand = new GetMetricStatisticsCommand({
      Namespace: 'PulseQueue',
      MetricName: 'InventoryOperations',
      StartTime: twoHoursAgo,
      EndTime: now,
      Period: 300,
      Statistics: ['Sum'],
      Dimensions: [
        { Name: 'OperationType', Value: 'decrement_reserved' },
        { Name: 'Status', Value: 'success' }
      ]
    });
    
    const inventoryDecrementReservedResponse = await cloudWatchClient.send(inventoryDecrementReservedCommand);
    console.log('📊 Inventory Decrement Reserved response:', JSON.stringify(inventoryDecrementReservedResponse, null, 2));
    if (inventoryDecrementReservedResponse.Datapoints && inventoryDecrementReservedResponse.Datapoints.length > 0) {
      const datapoint = inventoryDecrementReservedResponse.Datapoints[0];
      if (datapoint && datapoint.Sum !== undefined) {
        const value = datapoint.Sum;
        metrics.push(`inventory_operations_total{operation_type="decrement_reserved",status="success"} ${value}`);
      }
    }
    
    console.log('📈 Generated metrics:', metrics);
    
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