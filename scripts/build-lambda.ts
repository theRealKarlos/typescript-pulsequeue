import { build, BuildOptions } from 'esbuild';
import { execSync } from 'child_process';
import { mkdirSync, existsSync, rmSync } from 'fs';
import path from 'path';
import minimist from 'minimist';

// ============================================================================
// ARGUMENT PARSING
// ============================================================================

const args = minimist(process.argv.slice(2));

const ENTRY_POINT = args.entry || 'services/order-service/handler.ts';
const OUTPUT_DIR = args.outdir || 'dist/order-service';
const ZIP_FILE = args.zip || 'dist/order-service.zip';
const TARGET_NODE_VERSION = 'node22';
const PLATFORM = 'node';

// ============================================================================
// PATH CONFIGURATION
// ============================================================================

const outDir = path.resolve(OUTPUT_DIR);
const zipPath = path.resolve(ZIP_FILE);

// ============================================================================
// BUILD CONFIGURATION
// ============================================================================

const buildOptions: BuildOptions = {
  entryPoints: [ENTRY_POINT],
  bundle: true,
  platform: PLATFORM,
  target: TARGET_NODE_VERSION,
  outfile: `${outDir}/handler.js`,
  sourcemap: true,
  external: ['aws-sdk'], // AWS provides this at runtime
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Runs lint check before building
 */
function runLintCheck(): void {
  try {
    console.log('�� Running lint check on entry file...');
    execSync(`npx eslint ${ENTRY_POINT}`, { stdio: 'inherit' });
    console.log('✅ Lint check passed.');
  } catch {
    console.error('❌ Lint check failed. Please fix the issues before building.');
    process.exit(1);
  }
}

/**
 * Removes previous build artifacts to ensure clean builds
 */
function cleanup(): void {
  try {
    rmSync(outDir, { recursive: true, force: true });
    rmSync(zipPath, { force: true });
    console.log('Cleaned up previous build artifacts.');
  } catch (err) {
    console.warn('Warning during cleanup:', err);
  }
}

/**
 * Ensures the output directory exists before building
 */
function ensureDirectoryExists(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Creates a zip file from the built Lambda function
 */
function createZip(): void {
  const powershellZipCmd = `powershell.exe -NoProfile -Command "Compress-Archive -Path '${outDir}\\*' -DestinationPath '${zipPath}' -Force"`;
  console.log('Zipping...');
  execSync(powershellZipCmd, { stdio: 'inherit' });
}

// ============================================================================
// MAIN BUILD FUNCTION
// ============================================================================

/**
 * Orchestrates the complete build process:
 * 1. Run lint check
 * 2. Cleanup previous artifacts
 * 3. Ensure output directory exists
 * 4. Build TypeScript with esbuild
 * 5. Create deployment zip file
 */
async function runBuild(): Promise<void> {
  try {
    // Step 1: Lint check
    runLintCheck();

    // Step 2: Cleanup
    cleanup();

    // Step 3: Ensure output directory exists
    ensureDirectoryExists(outDir);

    // Step 4: Build with esbuild
    await build(buildOptions);
    console.log('Build complete.');

    // Step 5: Create zip
    createZip();
    console.log('Build + zip ready at dist/order-service.zip');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// ============================================================================
// EXECUTION
// ============================================================================

runBuild();
