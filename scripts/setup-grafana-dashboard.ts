#!/usr/bin/env ts-node

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface GrafanaConfig {
  grafanaUrl: string;
  username: string;
  password: string;
}

interface DataSource {
  name: string;
  type: string;
  url: string;
  access: string;
  isDefault: boolean;
}

interface Dashboard {
  dashboard: Record<string, unknown>;
  overwrite: boolean;
}

async function setupGrafana(config: GrafanaConfig) {
  const { grafanaUrl, username, password } = config;
  
  console.log('🔧 Setting up Grafana dashboard...');
  
  // 1. Create Prometheus data source
  console.log('📊 Creating Prometheus data source...');
  const dataSource: DataSource = {
    name: 'Prometheus',
    type: 'prometheus',
    url: 'http://prometheus:9090', // Internal ECS service discovery
    access: 'proxy',
    isDefault: true
  };
  
  try {
    await axios.post(
      `${grafanaUrl}/api/datasources`,
      dataSource,
      {
        auth: { username, password },
        headers: { 'Content-Type': 'application/json' }
      }
    );
    console.log('✅ Data source created successfully');
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      console.log('ℹ️  Data source already exists, skipping...');
    } else {
      const errorMessage = axios.isAxiosError(error) 
        ? error.response?.data || error.message 
        : error instanceof Error ? error.message : String(error);
      console.error('❌ Error creating data source:', errorMessage);
      throw error;
    }
  }
  
  // 2. Import dashboard
  console.log('📋 Importing dashboard...');
  const dashboardPath = path.join(__dirname, '../infra/envs/dev/grafana-dashboard.json');
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  const dashboardJson = JSON.parse(dashboardContent);
  const dashboard: Dashboard = {
    dashboard: { ...dashboardJson.dashboard, uid: "pulsequeue-dashboard" },
    overwrite: true
  };
  
  try {
    const dashboardResponse = await axios.post(
      `${grafanaUrl}/api/dashboards/db`,
      dashboard,
      {
        auth: { username, password },
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('✅ Dashboard imported successfully');
    // Print the correct dashboard URL from the API response
    if (dashboardResponse.data && dashboardResponse.data.url) {
      console.log(`🎉 Setup complete! Dashboard available at: ${grafanaUrl}${dashboardResponse.data.url}`);
    } else {
      console.log('🎉 Setup complete! Dashboard imported, but URL not found in response.');
    }
  } catch (dashboardError: unknown) {
    if (axios.isAxiosError(dashboardError) && dashboardError.response?.status === 412) {
      console.log('ℹ️  Dashboard already exists, skipping...');
    } else {
      const errorMessage = axios.isAxiosError(dashboardError) 
        ? dashboardError.response?.data || dashboardError.message 
        : dashboardError instanceof Error ? dashboardError.message : String(dashboardError);
      console.error('❌ Error importing dashboard:', errorMessage);
      throw dashboardError;
    }
  }
}

// Usage instructions
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log(`
Usage: npm run setup-grafana <grafana-url> <username> <password>

Example: npm run setup-grafana http://1.2.3.4:3000 admin mypassword

This will:
1. Create a Prometheus data source
2. Import the PulseQueue monitoring dashboard
3. Configure the dashboard to use Prometheus metrics
    `);
    process.exit(1);
  }
  
  const [grafanaUrl, username, password] = args as [string, string, string];
  
  setupGrafana({ grafanaUrl, username, password })
    .then(() => {
      console.log('🎉 Grafana setup completed successfully!');
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    });
}

export { setupGrafana }; 