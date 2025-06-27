// Import the Lambda handler function to test
import { handler } from '../services/order-service/handler';

// Create a mock API Gateway event for testing
const mockEvent = {
  body: JSON.stringify({
    customerId: 'karl-001',
    items: [{ sku: 'JERS-1023', quantity: 2 }],
  }),
};

// Main test function - immediately invoked async function
(async () => {
  try {
    // Call the handler with the mock event
    const result = await handler(mockEvent as any);

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