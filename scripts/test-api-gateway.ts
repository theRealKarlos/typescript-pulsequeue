const API_GATEWAY_URL = 'https://4epiqwma4k.execute-api.eu-west-2.amazonaws.com/dev/orders';

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

async function testAPIGateway() {
  console.log('🚀 Testing API Gateway endpoint...');
  console.log('📤 Sending order to:', API_GATEWAY_URL);
  console.log('📦 Order data:', JSON.stringify(testOrder, null, 2));

  try {
    const response = await fetch(API_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testOrder)
    });

    console.log('✅ API Gateway response:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    const responseData = await response.text();
    console.log('Body:', responseData);

  } catch (error) {
    console.error('❌ API Gateway test failed:');
    console.error('Error:', error instanceof Error ? error.message : String(error));
  }
}

testAPIGateway(); 