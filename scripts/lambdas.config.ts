export interface LambdaBuildConfig {
  entry: string;
  outdir: string;
  zip: string;
  name: string;
}

export const lambdas: LambdaBuildConfig[] = [
  {
    entry: 'services/order-service/handler.ts',
    outdir: 'dist/order-service',
    zip: 'dist/order-service.zip',
    name: 'Order Service Lambda',
  },
  {
    entry: 'services/payment-service/handler.ts',
    outdir: 'dist/payment-service',
    zip: 'dist/payment-service.zip',
    name: 'Payment Service Lambda',
  },
  {
    entry: 'services/metrics-service/handler.ts',
    outdir: 'dist/metrics-service',
    zip: 'dist/metrics-service.zip',
    name: 'Metrics Service Lambda',
  },
  // Add more Lambdas here as needed
]; 