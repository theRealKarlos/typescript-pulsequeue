import { spawnSync } from 'child_process';

function runStep(command: string, args: string[], stepName: string) {
  console.log(`\n=== Running: ${stepName} ===`);
  const result = spawnSync(command, args, { stdio: 'inherit', shell: true });
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

// 3. Build Lambda
runStep(
  'npm',
  [
    'run',
    'build:lambda:dev',
    '--',
    '--entry',
    'services/order-service/handler.ts',
    '--outdir',
    'dist/order-service',
    '--zip',
    'dist/order-service.zip',
  ],
  'Build Lambda',
);

// 4. Terraform plan
runStep('npm', ['run', 'plan:dev'], 'Terraform Plan');

// 5. Terraform apply
runStep('npm', ['run', 'apply:dev'], 'Terraform Apply');

// 6. Post-deploy test
runStep('npm', ['run', 'postdeploy:dev'], 'Post-Deploy Test');

console.log('\n✅ Deployment pipeline completed successfully!');
