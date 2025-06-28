import fetch from 'node-fetch';

const API_URL = 'https://4epiqwma4k.execute-api.eu-west-2.amazonaws.com/dev/orders';

async function testApiGateway() {
    const testOrder = {
        orderId: "test-123",
        customerId: "test-customer",
        items: [{
            sku: "prod-1",
            quantity: 1
        }],
        _webOrder: true,
        productName: "Test Product",
        price: 99.99,
        orderDate: new Date().toISOString()
    };

    console.log('🔍 Testing API Gateway with payload:', JSON.stringify(testOrder, null, 2));

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testOrder)
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

        const responseText = await response.text();
        console.log('📡 Response body:', responseText);

        if (response.ok) {
            console.log('✅ API Gateway call successful');
        } else {
            console.log('❌ API Gateway call failed');
        }
    } catch (error) {
        console.error('❌ Error calling API Gateway:', error);
    }
}

testApiGateway(); 