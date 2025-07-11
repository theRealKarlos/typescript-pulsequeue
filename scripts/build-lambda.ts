/**
 * Lambda Function Builder Script (Unified for Local and CI/CD)
 *
 * This script builds TypeScript Lambda functions for AWS deployment using esbuild.
 * It supports both single and bulk builds, OS-aware zipping, and environment-based output paths.
 *
 * Usage:
 *   # Single build (local or CI)
 *   npx ts-node scripts/build-lambda.ts --entry services/order-service/handler.ts --outdir dist/<env>/order-service --zip dist/<env>/order-service.zip --env=staging
 *
 *   # Bulk build (recommended for CI/CD or all Lambdas)
 *   npx ts-node scripts/build-lambda.ts --env=staging
 *
 *   # If --env is not provided, defaults to 'dev'.
 *
 * The script detects the OS and uses PowerShell for zipping on Windows, and 'zip' on Linux/macOS.
 */

import { build, BuildOptions } from 'esbuild';
import { execSync } from 'child_process';
import { mkdirSync, existsSync, rmSync, readFileSync } from 'fs';
import path from 'path';
import minimist from 'minimist';
import { lambdas, LambdaBuildConfig } from './lambdas.config';

const args = minimist(process.argv.slice(2));
const env = args.env || process.env.ENVIRONMENT || 'dev';

function getNodeVersionFromTerraform(environment: string = 'dev'): string {
  try {
    const tfvarsPath = path.resolve(`infra/envs/${environment}/terraform.tfvars`);
    if (!existsSync(tfvarsPath)) return 'node22';
    const tfvarsContent = readFileSync(tfvarsPath, 'utf-8');
    const lambdaRuntimeMatch = tfvarsContent.match(/lambda_runtime\s*=\s*"([^"]+)"/);
    if (!lambdaRuntimeMatch) return 'node22';
    const lambdaRuntime = lambdaRuntimeMatch[1];
    if (!lambdaRuntime) return 'node22';
    const nodeVersionMatch = lambdaRuntime.match(/nodejs(\d+)\.x/);
    if (!nodeVersionMatch) return 'node22';
    return `node${nodeVersionMatch[1]}`;
  } catch { return 'node22'; }
}

const TARGET_NODE_VERSION = getNodeVersionFromTerraform(env);

function runLintCheck(entry: string): void {
  try {
    console.log(`Running lint check on ${entry}...`);
    execSync(`npx eslint ${entry}`, { stdio: 'inherit' });
    console.log('✅ Lint check passed.');
  } catch {
    console.error('❌ Lint check failed. Please fix the issues before building.');
    process.exit(1);
  }
}

function cleanup(outDir: string, zipPath: string): void {
  try {
    rmSync(outDir, { recursive: true, force: true });
    rmSync(zipPath, { force: true });
    console.log('Cleaned up previous build artefacts.');
  } catch (err) {
    console.warn('Warning during cleanup:', err);
  }
}

function ensureDirectoryExists(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function createZip(outDir: string, zipPath: string): void {
  if (process.platform === 'win32') {
    // Use PowerShell on Windows
    const powershellZipCmd = `powershell.exe -NoProfile -Command "Compress-Archive -Path '${outDir}\\*' -DestinationPath '${zipPath}' -Force"`;
    console.log(`Zipping to ${zipPath} (PowerShell)...`);
    execSync(powershellZipCmd, { stdio: 'inherit' });
  } else {
    // Use zip on Linux/macOS
    const zipCmd = `zip -r ${zipPath} .`;
    console.log(`Zipping to ${zipPath} (zip)...`);
    execSync(zipCmd, { cwd: outDir, stdio: 'inherit' });
  }
}

async function buildLambda(lambda: LambdaBuildConfig, env: string) {
  // Update output paths to include environment
  const outDir = path.resolve('dist', env, path.basename(lambda.outdir));
  const zipPath = path.resolve('dist', env, path.basename(lambda.zip));
  const entry = lambda.entry;
  const buildOptions: BuildOptions = {
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    target: TARGET_NODE_VERSION,
    outfile: `${outDir}/handler.js`,
    sourcemap: true,
    external: ['aws-sdk'],
  };
  runLintCheck(entry);
  cleanup(outDir, zipPath);
  ensureDirectoryExists(outDir);
  await build(buildOptions);
  createZip(outDir, zipPath);
  console.log(`Build + zip ready at ${zipPath}`);
}

async function main() {
  if (args.entry && args.outdir && args.zip) {
    // Single build mode (for backward compatibility)
    await buildLambda({
      entry: args.entry,
      outdir: args.outdir,
      zip: args.zip,
      name: args.entry,
    }, env);
  } else {
    // Bulk build mode: build all lambdas in config
    for (const lambda of lambdas) {
      console.log(`\n=== Building Lambda: ${lambda.name} for environment: ${env} ===`);
      await buildLambda(lambda, env);
    }
    console.log(`\n🎉 All Lambda functions built for environment: ${env}!`);
  }
}

main();
