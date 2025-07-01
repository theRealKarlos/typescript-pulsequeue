import { PutItemCommand } from '@aws-sdk/client-dynamodb';
import { createDynamoDBClient } from '@services/libs/aws-clients';
import { INVENTORY_DYNAMODB_CONFIG } from '@services/shared/constants';
import fs from 'fs';
import path from 'path';

const inventoryFile = path.resolve(__dirname, 'inventory-seed.json');
const tableName = INVENTORY_DYNAMODB_CONFIG.TABLE_NAME;
const region = INVENTORY_DYNAMODB_CONFIG.REGION;
const dynamoDB = createDynamoDBClient({ region });

async function seedInventory() {
  const items = JSON.parse(fs.readFileSync(inventoryFile, 'utf8'));
  for (const item of items) {
    try {
      const cmd = new PutItemCommand({ TableName: tableName, Item: item });
      await dynamoDB.send(cmd);
      console.log(`✅ Inserted item: ${item.item_id.S} (${item.name.S})`);
    } catch (err) {
      console.error(`❌ Failed to insert item: ${item.item_id.S}`, err);
    }
  }
}

seedInventory().catch((err) => {
  console.error('❌ Inventory seed script failed:', err);
  process.exit(1);
});
