import { handler } from '../services/order-service/handler';

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_REGION = 'eu-west-2';
const EXPECTED_STATUS_CODE = 200;

// ============================================================================
// ENVIRONMENT SETUP
// ============================================================================

process.env.AWS_REGION = process.env.AWS_REGION || DEFAULT_REGION;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface MockEvent {
  body: string;
}

interface TestResult {
  statusCode: number;
  body: string;
}

// ============================================================================
// TEST DATA
// ============================================================================

const mockEvent: MockEvent = {
  body: JSON.stringify({
    customerId: 'karl-001',
    items: [{ sku: 'JERS-1023', quantity: 2 }],
  }),
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Type guard to check if a value is a record with string keys
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validates if the handler response is a valid test result
 */
function isValidTestResult(result: unknown): result is TestResult {
  if (!isRecord(result)) return false;
  
  return typeof result.statusCode === 'number' && 
         typeof result.body === 'string';
}

// ============================================================================
// MAIN TEST FUNCTION
// ============================================================================

/**
 * Executes the local Lambda handler test
 * Validates the response and handles errors appropriately
 */
async function runTest(): Promise<void> {
  try {
    const result = await handler(mockEvent as unknown as Parameters<typeof handler>[0]);

    if (!isValidTestResult(result) || result.statusCode !== EXPECTED_STATUS_CODE) {
      console.error(`Local test failed: Expected statusCode ${EXPECTED_STATUS_CODE}, got ${result?.statusCode}`);
      process.exit(1);
    }

    console.log('Local test passed:', result);
  } catch (error) {
    console.error(`Local test threw an error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

// ============================================================================
// EXECUTION
// ============================================================================

runTest();