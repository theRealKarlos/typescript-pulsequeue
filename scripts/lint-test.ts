import { execSync } from 'child_process';

// ============================================================================
// CONFIGURATION
// ============================================================================

const LINT_PATTERNS = [
  'services/**/*.ts',
  'scripts/**/*.ts'
];

const EXCLUDED_PATTERNS = [
  'node_modules/**/*',
  'dist/**/*',
  'infra/**/*'
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Runs ESLint on the specified patterns and returns the result
 */
function runLint(): { success: boolean; output: string } {
  try {
    const patterns = LINT_PATTERNS.join(' ');
    const excludeArgs = EXCLUDED_PATTERNS.map(pattern => `--ignore-pattern "${pattern}"`).join(' ');
    
    const command = `npx eslint ${patterns} ${excludeArgs}`;
    console.log('🔍 Running ESLint...');
    console.log(`Command: ${command}`);
    
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    return { success: true, output };
  } catch (error: unknown) {
    let output = '';
    if (error && typeof error === 'object' && 'stdout' in error && typeof (error as any).stdout === 'string') {
      output = (error as any).stdout;
    } else if (error instanceof Error) {
      output = error.message;
    } else {
      output = String(error);
    }
    return { 
      success: false, 
      output
    };
  }
}

/**
 * Formats the lint results for display
 */
function formatResults(success: boolean, output: string): void {
  if (success) {
    console.log('✅ ESLint passed! No issues found.');
    if (output.trim()) {
      console.log('\n📋 Lint output:');
      console.log(output);
    }
  } else {
    console.log('❌ ESLint found issues:');
    console.log(output);
    console.log('\n💡 To fix automatically, run: npm run lint:fix');
  }
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Main lint test function
 */
function runLintTest(): void {
  console.log('🚀 Starting ESLint test...\n');
  
  const { success, output } = runLint();
  formatResults(success, output);
  
  if (!success) {
    console.log('\n❌ Lint test failed. Please fix the issues above.');
    process.exit(1);
  }
  
  console.log('\n🎉 All lint checks passed!');
}

// ============================================================================
// EXECUTION
// ============================================================================

runLintTest(); 