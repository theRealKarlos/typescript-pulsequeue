import { build, BuildOptions } from 'esbuild';
import { execSync } from 'child_process';
import { mkdirSync, existsSync, rmSync } from 'fs';
import path from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const ENTRY_POINT = 'services/order-service/handler.ts';
const OUTPUT_DIR = 'dist/order-service';
const ZIP_FILE = 'dist/order-service.zip';
const TARGET_NODE_VERSION = 'node18';
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
 * 1. Cleanup previous artifacts
 * 2. Ensure output directory exists
 * 3. Build TypeScript with esbuild
 * 4. Create deployment zip file
 */
async function runBuild(): Promise<void> {
  try {
    // Step 1: Cleanup
    cleanup();
    
    // Step 2: Ensure output directory exists
    ensureDirectoryExists(outDir);

    // Step 3: Build with esbuild
    await build(buildOptions);
    console.log('Build complete.');

    // Step 4: Create zip
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
