/**
 * Lambda Bulk Build Script
 *
 * This script automates the building of all AWS Lambda functions defined in lambdas.config.ts.
 * It is intended for use in CI/CD pipelines and local development to ensure that all Lambda
 * deployment artefacts (ZIP files) are built consistently and reliably for a given environment.
 *
 * Why do we do it this way?
 * - Centralised configuration: All Lambda entry points, output directories, and ZIP paths are
 *   defined in lambdas.config.ts, making it easy to add, remove, or update Lambdas in one place.
 * - Maintainability: By looping over the config, we avoid duplicating build logic in the workflow
 *   or hardcoding entry points, reducing the risk of errors and simplifying future changes.
 * - CI/CD compatibility: This approach ensures that the build process in GitHub Actions (or any
 *   other CI/CD system) is always in sync with the deployment process, as both use the same config.
 * - Environment awareness: The script accepts an --env argument (dev, staging, prod) to build
 *   Lambda functions with the correct environment context, matching the deployment target.
 *
 * Usage:
 *   npx ts-node scripts/build-all-lambdas.ts --env=staging
 *   (or --env=dev, --env=prod)
 *
 * The script will exit with a non-zero code if any Lambda build fails.
 *
 * @author TypeScript-PulseQueue Team
 * @version 1.0.0
 */

import { spawnSync } from 'child_process';
import { lambdas } from './lambdas.config';
import minimist from 'minimist';

// Parse the environment argument, defaulting to 'dev' if not provided.
const args = minimist(process.argv.slice(2));
const env = args.env || process.env.ENVIRONMENT || 'dev';

const validEnvironments = ['dev', 'staging', 'prod'];
if (!validEnvironments.includes(env)) {
  console.error(`❌ Error: Invalid environment '${env}'`);
  console.error(`Valid environments: ${validEnvironments.join(', ')}`);
  process.exit(1);
}

console.log(`🔨 Building all Lambda functions for environment: ${env}`);

/**
 * Runs a single build step for a Lambda function.
 * This function invokes the npm build script with the correct arguments for each Lambda.
 * If the build fails, the script will exit with an error code, halting the pipeline.
 *
 * @param command The command to run (e.g., 'npm')
 * @param args The arguments to pass to the command
 * @param stepName A human-readable name for the build step
 */
function runStep(command: string, args: string[], stepName: string) {
  console.log(`\n=== Running: ${stepName} ===`);
  console.log(`Command: ${command} ${args.join(' ')}`);

  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      ENVIRONMENT: env,
    },
  });

  if (result.status !== 0) {
    console.error(`\n❌ Step failed: ${stepName}`);
    console.error(`Exit code: ${result.status}`);
    process.exit(result.status || 1);
  }

  console.log(`✅ ${stepName} completed successfully`);
}

// Loop over all Lambda configs and build each one using the centralised configuration.
for (const lambda of lambdas) {
  runStep(
    'npm',
    [
      'run',
      `build:lambda:${env}`,
      '--',
      '--entry',
      lambda.entry,
      '--outdir',
      lambda.outdir,
      '--zip',
      lambda.zip,
    ],
    `Build ${lambda.name}`,
  );
}

console.log('\n🎉 All Lambda functions built successfully!'); 