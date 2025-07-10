import { spawnSync } from 'child_process';
import { lambdas } from './lambdas.config';
import minimist from 'minimist';

const args = minimist(process.argv.slice(2));
const env = args.env;
if (!env) {
  throw new Error('--env argument is required (e.g., --env=dev, --env=staging, --env=prod)');
}

function runStep(command: string, args: string[], stepName: string) {
  console.log(`\n=== Running: ${stepName} ===`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ENVIRONMENT: env },
  });
  if (result.status !== 0) {
    console.error(`\n❌ Step failed: ${stepName}`);
    process.exit(result.status || 1);
  }
}

// 1. Lint all code
runStep(
  'npm',
  ['run', 'lint:all'],
  'ESLint Code Quality Check',
);

// 2. Run Jest unit tests
runStep(
  'npm',
  ['test'],
  'Jest Unit Tests',
);

// 3. Build all Lambdas
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

// 4. Terraform plan
runStep('npm', ['run', `plan:${env}`], 'Terraform Plan');

// 5. Terraform apply
runStep('npm', ['run', `apply:${env}`], 'Terraform Apply');

// 6. Post-deploy test
runStep('npm', ['run', `postdeploy:${env}`], 'Post-Deploy Test');

console.log('\n✅ Deployment pipeline completed successfully!');
