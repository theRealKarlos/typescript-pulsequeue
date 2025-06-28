// Ensure region is set early
process.env.AWS_REGION = process.env.AWS_REGION || 'eu-west-2';

// Import the Lambda handler function to test
import { handler } from '../services/order-service/handler';

// Create a mock API Gateway event for testing
const mockEvent = {
  body: JSON.stringify({
    customerId: 'karl-001',
    items: [{ sku: 'JERS-1023', quantity: 2 }],
  }),
};

// Create a mock context for testing
const mockContext = {
  callbackWaitsForEmptyEventLoop: true,
  functionName: 'order-service-handler',
  functionVersion: '$LATEST',
  invokedFunctionArn: 'arn:aws:lambda:eu-west-2:123456789012:function:order-service-handler',
  memoryLimitInMB: '128',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/order-service-handler',
  logStreamName: '2025/06/28/[$LATEST]test-stream',
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

// Main test function - immediately invoked async function
(async () => {
  try {
    // Call the handler with the mock event and context
    const result = await handler(mockEvent as any, mockContext);

    // Validate the response - check if status code is 200 (success)
    if (!result || result.statusCode !== 200) {
      console.error(`
❌  Local test failed: Expected statusCode 200, got ${result?.statusCode}
🚫  Deployment aborted.
`);
      process.exit(1); // Exit with error code to indicate test failure
    }

    // Test passed - log the successful result
    console.log('✅ Local test passed:', result);
  } catch (error) {
    // Handle any errors thrown during the test
    console.error(`
❌  Local test threw an error
-----------------------------
Reason: ${error instanceof Error ? error.message : error}
🚫  Deployment aborted.
`);
    process.exit(1); // Exit with error code to indicate test failure
  }
})();