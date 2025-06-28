import { execSync } from 'child_process';

// ============================================================================
// CONFIGURATION
// ============================================================================

const EVENT_BUS_NAME = 'dev-pulsequeue-bus';
const EVENT_SOURCE = 'order.service';
const EVENT_DETAIL_TYPE = 'OrderPlaced';

// ============================================================================
// TEST DATA
// ============================================================================

const testOrder = {
  customerId: "test-customer-123",
  items: [
    {
      productId: "prod-001",
      name: "Test Product",
      quantity: 2,
      price: 29.99
    }
  ],
  totalAmount: 59.98,
  shippingAddress: {
    street: "123 Test St",
    city: "Test City",
    state: "TS",
    zipCode: "12345",
    country: "US"
  }
};

// ============================================================================
// AWS CLI EVENTBRIDGE TEST
// ============================================================================

async function testEventBridgeCLI() {
  console.log('🚀 Testing EventBridge with AWS CLI...');
  console.log('📤 Sending order to EventBridge bus:', EVENT_BUS_NAME);
  console.log('📦 Order data:', JSON.stringify(testOrder, null, 2));

  try {
    const command = `aws events put-events --entries '[{
      "Source": "${EVENT_SOURCE}",
      "DetailType": "${EVENT_DETAIL_TYPE}",
      "EventBusName": "${EVENT_BUS_NAME}",
      "Detail": "${JSON.stringify(testOrder).replace(/"/g, '\\"')}"
    }]' --region eu-west-2`;

    console.log('🔧 Executing command:', command);
    
    const result = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });

    console.log('✅ EventBridge CLI response:');
    console.log(result);

    // Parse the response to check for success
    const response = JSON.parse(result);
    if (response.FailedEntryCount === 0) {
      console.log('🎉 Event successfully sent to EventBridge!');
      console.log('📋 Event IDs:', response.Entries?.map((entry: { EventId: string }) => entry.EventId).join(', '));
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