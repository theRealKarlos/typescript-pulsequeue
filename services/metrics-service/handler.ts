// ============================================================================
// METRICS SERVICE HANDLER
// ----------------------------------------------------------------------------
// Exposes Prometheus metrics endpoint for scraping
// Used by Prometheus to collect metrics from Lambda functions
// ============================================================================

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getMetrics } from '../shared/metrics';

export const handler = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Get Prometheus metrics
    const metrics = await getMetrics();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
      body: metrics,
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