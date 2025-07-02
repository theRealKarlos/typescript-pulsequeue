import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import inventory from './inventory-seed.json';
import { INVENTORY_DYNAMODB_CONFIG } from '../services/shared/constants';

const TABLE_NAME = INVENTORY_DYNAMODB_CONFIG.TABLE_NAME;
const REGION = INVENTORY_DYNAMODB_CONFIG.REGION;
const client = new DynamoDBClient({ region: REGION });

async function seedInventory() {
  for (const item of inventory) {
    const params = {
      TableName: TABLE_NAME,
      Key: { item_id: { S: item.item_id.S } },
      UpdateExpression: 'SET stock = :stock, reserved = :reserved',
      ExpressionAttributeValues: {
        ':stock': { N: '100' },
        ':reserved': { N: '0' },
      },
    };
    await client.send(new UpdateItemCommand(params));
    console.log(`Seeded item ${item.item_id.S} with stock=100, reserved=0`);
  }
}

seedInventory()
  .then(() => console.log('Inventory seed complete.'))
  .catch((err) => {
    console.error('Failed to seed inventory:', err);
    process.exit(1);
  });
