/**
 * Lambda Function Builder Script
 * 
 * This script builds TypeScript Lambda functions for AWS deployment using esbuild.
 * It handles the complete build pipeline from TypeScript source to deployment-ready
 * zip files, including linting, bundling, and packaging.
 * 
 * Usage: npm run build-lambda -- --entry <entry-file> --outdir <output-dir> --zip <zip-path>
 * 
 * @author TypeScript-PulseQueue Team
 * @version 1.0.0
 */

import { build, BuildOptions } from 'esbuild';
import { execSync } from 'child_process';
import { mkdirSync, existsSync, rmSync, readFileSync } from 'fs';
import path from 'path';
import minimist from 'minimist';

// ============================================================================
// ARGUMENT PARSING
// ============================================================================

/**
 * Parse command-line arguments using minimist for better argument handling
 * than the built-in process.argv, providing cleaner argument extraction
 */
const args = minimist(process.argv.slice(2));

// Validate required arguments to ensure the build process has all necessary inputs
// This prevents partial builds that could lead to deployment issues
if (!args.entry || typeof args.entry !== 'string') {
  console.error('Missing required argument: --entry <entry file path>');
  process.exit(1);
}
if (!args.outdir || typeof args.outdir !== 'string') {
  console.error('Missing required argument: --outdir <output directory>');
  process.exit(1);
}
if (!args.zip || typeof args.zip !== 'string') {
  console.error('Missing required argument: --zip <zip file path>');
  process.exit(1);
}

// Extract and store configuration values for use throughout the build process
const ENTRY_POINT: string = args.entry;
const OUTPUT_DIR: string = args.outdir;
const ZIP_FILE: string = args.zip;

// Platform specification for esbuild - using 'node' for server-side execution
const PLATFORM = 'node';

// ============================================================================
// TERRAFORM CONFIGURATION PARSING
// ============================================================================

/**
 * Extracts the Node.js version from Terraform variables file
 * 
 * This function reads the lambda_runtime variable from the Terraform configuration
 * and converts it to the format expected by esbuild (e.g., 'nodejs22.x' -> 'node22').
 * This ensures consistency between the build process and infrastructure configuration.
 * 
 * @param environment - The environment to read configuration for (dev, staging, prod)
 * @returns The Node.js version in esbuild format
 */
function getNodeVersionFromTerraform(environment: string = 'dev'): string {
  try {
    // Construct the path to the Terraform variables file
    const tfvarsPath = path.resolve(`infra/envs/${environment}/terraform.tfvars`);
    
    if (!existsSync(tfvarsPath)) {
      console.warn(`⚠️  Terraform variables file not found at ${tfvarsPath}, using default Node.js 22`);
      return 'node22';
    }
    
    // Read and parse the Terraform variables file
    const tfvarsContent = readFileSync(tfvarsPath, 'utf-8');
    
    // Extract lambda_runtime using regex
    const lambdaRuntimeMatch = tfvarsContent.match(/lambda_runtime\s*=\s*"([^"]+)"/);
    
    if (!lambdaRuntimeMatch) {
      console.warn(`⚠️  lambda_runtime not found in ${tfvarsPath}, using default Node.js 22`);
      return 'node22';
    }
    
    const lambdaRuntime = lambdaRuntimeMatch[1];
    
    if (!lambdaRuntime) {
      console.warn(`⚠️  lambda_runtime value is empty, using default Node.js 22`);
      return 'node22';
    }
    
    // Convert AWS Lambda runtime format to esbuild target format
    // e.g., 'nodejs22.x' -> 'node22'
    const nodeVersionMatch = lambdaRuntime.match(/nodejs(\d+)\.x/);
    
    if (!nodeVersionMatch) {
      console.warn(`⚠️  Invalid lambda_runtime format: ${lambdaRuntime}, using default Node.js 22`);
      return 'node22';
    }
    
    const nodeVersion = nodeVersionMatch[1];
    const esbuildTarget = `node${nodeVersion}`;
    
    console.log(`📋 Using Node.js version ${nodeVersion} from Terraform configuration (${lambdaRuntime})`);
    return esbuildTarget;
    
  } catch (error) {
    console.warn(`⚠️  Error reading Terraform configuration: ${error}, using default Node.js 22`);
    return 'node22';
  }
}

/**
 * Determines the target Node.js version for AWS Lambda compatibility
 * 
 * This function reads the Node.js version from Terraform configuration to ensure
 * consistency between the build process and the deployed infrastructure. If the
 * Terraform configuration cannot be read, it falls back to a sensible default.
 */
const TARGET_NODE_VERSION = getNodeVersionFromTerraform(process.env.ENVIRONMENT || 'dev');

// ============================================================================
// PATH CONFIGURATION
// ============================================================================

/**
 * Resolve absolute paths to ensure consistent file operations regardless of
 * the current working directory when the script is executed
 */
const outDir = path.resolve(OUTPUT_DIR);
const zipPath = path.resolve(ZIP_FILE);

// ============================================================================
// BUILD CONFIGURATION
// ============================================================================

/**
 * esbuild configuration options optimised for AWS Lambda deployment
 * 
 * Key configuration decisions:
 * - bundle: true - Bundles all dependencies into a single file for faster cold starts
 * - platform: 'node' - Targets Node.js runtime environment
 * - target: TARGET_NODE_VERSION - Uses Node.js version from Terraform configuration
 * - external: ['aws-sdk'] - Excludes AWS SDK as it's provided by the Lambda runtime
 * - sourcemap: true - Enables debugging capabilities in production
 */
const buildOptions: BuildOptions = {
  entryPoints: [ENTRY_POINT],
  bundle: true,
  platform: PLATFORM,
  target: TARGET_NODE_VERSION,
  outfile: `${outDir}/handler.js`,
  sourcemap: true,
  external: ['aws-sdk'], // AWS provides this at runtime, so we exclude it to reduce bundle size
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Runs ESLint check on the entry file before building
 * 
 * This ensures code quality and catches potential issues before deployment.
 * Linting is performed early in the pipeline to fail fast if there are
 * code quality issues that could cause runtime problems.
 */
function runLintCheck(): void {
  try {
    console.log('Running lint check on entry file...');
    execSync(`npx eslint ${ENTRY_POINT}`, { stdio: 'inherit' });
    console.log('✅ Lint check passed.');
  } catch {
    console.error('❌ Lint check failed. Please fix the issues before building.');
    process.exit(1);
  }
}

/**
 * Removes previous build artefacts to ensure clean builds
 * 
 * This prevents issues with stale files from previous builds that could
 * cause deployment problems or unexpected behaviour. Clean builds are
 * essential for reproducible deployments.
 */
function cleanup(): void {
  try {
    rmSync(outDir, { recursive: true, force: true });
    rmSync(zipPath, { force: true });
    console.log('Cleaned up previous build artefacts.');
  } catch (err) {
    console.warn('Warning during cleanup:', err);
  }
}

/**
 * Ensures the output directory exists before building
 * 
 * Creates the directory structure if it doesn't exist, preventing
 * build failures due to missing directories. Uses recursive creation
 * to handle nested directory structures.
 */
function ensureDirectoryExists(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Creates a zip file from the built Lambda function
 * 
 * Uses PowerShell's Compress-Archive command for Windows compatibility.
 * The zip file is the final artefact that will be deployed to AWS Lambda.
 * PowerShell is used instead of Node.js zip libraries for better performance
 * and native Windows integration.
 */
function createZip(): void {
  const powershellZipCmd = `powershell.exe -NoProfile -Command "Compress-Archive -Path '${outDir}\\*' -DestinationPath '${zipPath}' -Force"`;
  console.log(`Zipping to ${zipPath}...`);
  execSync(powershellZipCmd, { stdio: 'inherit' });
}

// ============================================================================
// MAIN BUILD FUNCTION
// ============================================================================

/**
 * Orchestrates the complete build process for AWS Lambda deployment
 * 
 * This function coordinates the entire build pipeline in the correct order:
 * 1. Lint check - Ensures code quality before building
 * 2. Cleanup - Removes stale artefacts from previous builds
 * 3. Directory creation - Ensures output directory exists
 * 4. TypeScript compilation - Bundles and compiles the source code
 * 5. Zip creation - Packages the built function for deployment
 * 
 * Each step is essential for creating a reliable, deployable Lambda function.
 * The process is designed to fail fast if any step encounters issues.
 */
async function runBuild(): Promise<void> {
  try {
    // Step 1: Lint check - Validate code quality before building
    runLintCheck();

    // Step 2: Cleanup - Remove previous build artefacts for clean builds
    cleanup();

    // Step 3: Ensure output directory exists - Prevent build failures due to missing directories
    ensureDirectoryExists(outDir);

    // Step 4: Build with esbuild - Compile TypeScript and bundle dependencies
    await build(buildOptions);
    console.log('Build complete.');

    // Step 5: Create zip - Package the function for AWS Lambda deployment
    createZip();
    console.log(`Build + zip ready at ${zipPath}`);
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// ============================================================================
// EXECUTION
// ============================================================================

/**
 * Execute the build process when this script is run directly
 * 
 * The script is designed to be executed as a standalone process,
 * typically called from npm scripts or CI/CD pipelines.
 */
runBuild();
