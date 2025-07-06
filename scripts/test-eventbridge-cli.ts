import { execSync } from 'child_process';

// ============================================================================
// CONFIGURATION
// ============================================================================

const EVENT_BUS_NAME = 'dev-order-bus'; // Fixed: Use correct bus name
const EVENT_SOURCE = 'order.service';
const EVENT_DETAIL_TYPE = 'OrderPlaced';
const AWS_REGION = process.env.AWS_REGION || 'eu-west-2';

// ============================================================================
// TEST DATA
// ============================================================================

const testOrder = {
  customerId: 'test-customer-123',
  items: [
    {
      productId: 'prod-001',
      name: 'Test Product',
      quantity: 2,
      price: 29.99,
    },
  ],
  totalAmount: 59.98,
  shippingAddress: {
    street: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    country: 'US',
  },
};

// ============================================================================
// AWS CLI EVENTBRIDGE TEST
// ============================================================================
// 
// USAGE:
// 1. Ensure AWS CLI is installed and configured
// 2. Set AWS_REGION environment variable (optional, defaults to eu-west-2)
// 3. Run: npm run test:eventbridge
// 4. Check CloudWatch logs for Lambda processing
//
// This script tests EventBridge by sending a test order event directly to the bus
// without going through API Gateway, useful for debugging EventBridge configuration.

async function testEventBridgeCLI() {
  console.log('🚀 Testing EventBridge with AWS CLI...');
  console.log('📤 Sending order to EventBridge bus:', EVENT_BUS_NAME);
  console.log('🌍 AWS Region:', AWS_REGION);
  console.log('📦 Order data:', JSON.stringify(testOrder, null, 2));

  // Validate AWS CLI availability
  try {
    execSync('aws --version', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ AWS CLI not found. Please install AWS CLI and configure credentials.');
    process.exit(1);
  }

  try {
    const command = `aws events put-events --entries '[{
      "Source": "${EVENT_SOURCE}",
      "DetailType": "${EVENT_DETAIL_TYPE}",
      "EventBusName": "${EVENT_BUS_NAME}",
      "Detail": "${JSON.stringify(testOrder).replace(/"/g, '\\"')}"
    }]' --region ${AWS_REGION}`;

    console.log('🔧 Executing command:', command);

    const result = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
    });

    console.log('✅ EventBridge CLI response:');
    console.log(result);

    // Parse the response to check for success
    const response = JSON.parse(result);
    if (response.FailedEntryCount === 0) {
      console.log('🎉 Event successfully sent to EventBridge!');
      console.log(
        '📋 Event IDs:',
        response.Entries?.map((entry: { EventId: string }) => entry.EventId).join(', '),
      );
    } else {
      console.error('❌ Failed to send event to EventBridge');
      console.error('📋 Failed entries:', response.Entries);
    }
  } catch (error) {
    console.error('❌ EventBridge CLI test failed:');
    if (error instanceof Error) {
      console.error('Error:', error.message);
      if (error.message.includes('stdout')) {
        console.error('STDOUT:', error.message);
      }
    } else {
      console.error('Unknown error:', error);
    }
  }
}

// ============================================================================
// EXECUTION
// ============================================================================

testEventBridgeCLI();
