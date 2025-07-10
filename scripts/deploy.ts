import { spawnSync } from 'child_process';
import { lambdas } from './lambdas.config';
import minimist from 'minimist';

// ============================================================================
// ARGUMENT PARSING AND VALIDATION
// ============================================================================

const args = minimist(process.argv.slice(2));
const env = args.env;

if (!env) {
  console.error('❌ Error: --env argument is required');
  console.error('Usage: npm run deploy -- --env=dev|staging|prod');
  console.error('Examples:');
  console.error('  npm run deploy -- --env=dev');
  console.error('  npm run deploy -- --env=staging');
  console.error('  npm run deploy -- --env=prod');
  process.exit(1);
}

// Validate environment
const validEnvironments = ['dev', 'staging', 'prod'];
if (!validEnvironments.includes(env)) {
  console.error(`❌ Error: Invalid environment '${env}'`);
  console.error(`Valid environments: ${validEnvironments.join(', ')}`);
  process.exit(1);
}

console.log(`🚀 Starting deployment to ${env} environment...`);
console.log(`📋 Environment: ${env}`);
console.log(`🌍 Region: ${process.env.AWS_REGION || 'eu-west-2'}`);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function runStep(command: string, args: string[], stepName: string) {
  console.log(`\n=== Running: ${stepName} ===`);
  console.log(`Command: ${command} ${args.join(' ')}`);
  
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: true,
    env: { 
      ...process.env, 
      ENVIRONMENT: env,
      AWS_REGION: process.env.AWS_REGION || 'eu-west-2'
    },
  });
  
  if (result.status !== 0) {
    console.error(`\n❌ Step failed: ${stepName}`);
    console.error(`Exit code: ${result.status}`);
    process.exit(result.status || 1);
  }
  
  console.log(`✅ ${stepName} completed successfully`);
}

// ============================================================================
// DEPLOYMENT PIPELINE
// ============================================================================

console.log('\n📋 Deployment Pipeline:');
console.log('1. Code Quality Check (ESLint)');
console.log('2. Unit Tests (Jest)');
console.log('3. Build Lambda Functions');
console.log('4. Terraform Plan');
console.log('5. Terraform Apply');
console.log('6. Post-Deploy Tests');

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
console.log('\n🔨 Building Lambda Functions...');
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
runStep(
  'npm', 
  ['run', `plan:${env}`], 
  'Terraform Plan'
);

// 5. Terraform apply
runStep(
  'npm', 
  ['run', `apply:${env}`], 
  'Terraform Apply'
);

// 6. Post-deploy test
runStep(
  'npm', 
  ['run', `postdeploy:${env}`], 
  'Post-Deploy Test'
);

// ============================================================================
// SUCCESS MESSAGE
// ============================================================================

console.log('\n🎉 Deployment pipeline completed successfully!');
console.log(`✅ Environment: ${env}`);
console.log(`🌍 Region: ${process.env.AWS_REGION || 'eu-west-2'}`);
console.log('\n📊 Next Steps:');
console.log('• Check CloudWatch logs for any issues');
console.log('• Verify Lambda functions are responding correctly');
console.log('• Monitor metrics in the CloudWatch dashboard');
console.log('• Test the API Gateway endpoints if applicable');
