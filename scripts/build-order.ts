import { build } from 'esbuild';
import { execSync } from 'child_process';
import { mkdirSync, existsSync } from 'fs';
import path from 'path';

const outDir = path.resolve('dist/order-service');
const zipPath = path.resolve('dist/order-service.zip');

// Ensure dist directory exists
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

// Step 1: Bundle with esbuild
build({
  entryPoints: ['services/order-service/handler.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: `${outDir}/index.js`,
  sourcemap: true,
  external: ['aws-sdk'], // AWS provides this at runtime
})
  .then(() => {
    console.log('Build complete.');

    // Step 2: Zip the output
    const powershellZipCmd = `powershell.exe -NoProfile -Command "Compress-Archive -Path '${outDir}\\*' -DestinationPath '${zipPath}' -Force"`;

    console.log('Zipping...');
    execSync(powershellZipCmd, { stdio: 'inherit' });

    console.log('Build + zip ready at dist/order-service.zip ✔️');
  })
  .catch((e) => {
    console.error('Build failed:', e);
    process.exit(1);
  });
