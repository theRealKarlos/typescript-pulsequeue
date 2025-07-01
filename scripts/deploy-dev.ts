import { spawnSync } from 'child_process';

function runStep(command: string, args: string[], stepName: string) {
  console.log(`\n=== Running: ${stepName} ===`);
  const result = spawnSync(command, args, { stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    console.error(`\n❌ Step failed: ${stepName}`);
    process.exit(result.status || 1);
  }
}

// 1. Local Lambda test
runStep(
  'npm',
  [
    'run',
    'test:lambda:dev',
    '--',
    '--handler',
    'services/order-service/handler.ts',
    '--event',
    'scripts/order-service-event.json',
  ],
  'Local Lambda Test',
);

// 2. Build Lambda
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

// 3. Terraform plan
runStep('npm', ['run', 'plan:dev'], 'Terraform Plan');

// 4. Terraform apply
runStep('npm', ['run', 'apply:dev'], 'Terraform Apply');

// 5. Post-deploy test
runStep('npm', ['run', 'postdeploy:dev'], 'Post-Deploy Test');

console.log('\n✅ Deployment pipeline completed successfully!');
