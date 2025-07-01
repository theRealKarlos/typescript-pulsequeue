import minimist from 'minimist';
import fs from 'fs';
import path from 'path';

console.log('=== LOCAL LAMBDA TEST STARTED ===');

// ============================================================================
// ARGUMENT PARSING
// ============================================================================

const args = minimist(process.argv.slice(2));

const HANDLER_PATH = args.handler;
const EVENT_FILE = args.event;

if (!HANDLER_PATH || !EVENT_FILE) {
  console.error('Usage: ts-node scripts/test-lambda.ts --handler <handler.ts> --event <event.json>');
  process.exit(1);
}

// ============================================================================
// READ EVENT PAYLOAD
// ============================================================================

let event: unknown;
try {
  const fileContent = fs.readFileSync(EVENT_FILE, 'utf8');
  event = JSON.parse(fileContent);
} catch (err) {
  console.error('Failed to read or parse event file:', err);
  process.exit(1);
}

// ============================================================================
// DYNAMIC HANDLER IMPORT AND INVOCATION
// ============================================================================

async function runTest() {
  try {
    // Dynamically import the handler file
    const handlerModule = await import(path.resolve(HANDLER_PATH));
    const handler = handlerModule.handler;
    if (typeof handler !== 'function') {
      throw new Error('Handler export not found or is not a function');
    }
    const result = await handler(event);
    console.log('Lambda handler result:', result);
    process.exit(0);
  } catch (error) {
    console.error('Local Lambda test failed:', error);
    process.exit(1);
  }
}

runTest();