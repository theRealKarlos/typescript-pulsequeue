#!/usr/bin/env ts-node

/**
 * Grafana Dashboard Setup Script
 * 
 * This script automates the setup of Grafana for the PulseQueue monitoring system.
 * It creates a Prometheus data source and imports a pre-configured dashboard
 * to visualize Lambda metrics and system performance.
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Configuration interfaces for type safety
interface GrafanaConfig {
  grafanaUrl: string;
  username: string;
  password: string;
  prometheusUrl: string; // Add Prometheus URL parameter
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

/**
 * Main function to set up Grafana with Prometheus data source and dashboard
 * @param config - Grafana connection configuration
 */
async function setupGrafana(config: GrafanaConfig) {
  const { grafanaUrl, username, password, prometheusUrl } = config;
  
  console.log('🔧 Setting up Grafana dashboard...');
  
  // Step 1: Create Prometheus data source for metrics collection
  console.log('📊 Creating Prometheus data source...');
  const dataSource: DataSource = {
    name: 'Prometheus',
    type: 'prometheus',
    url: prometheusUrl, // Use the provided Prometheus URL
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
  
  // Step 2: Import pre-configured dashboard with Lambda metrics panels
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

/**
 * CLI Entry Point
 * 
 * When run directly, this script expects four command-line arguments:
 * - grafana-url: The URL where Grafana is accessible
 * - username: Grafana admin username
 * - password: Grafana admin password
 * - prometheus-url: The URL where Prometheus is accessible
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 4) {
    console.log(`
Usage: npm run setup-grafana <grafana-url> <username> <password> <prometheus-url>

Example: npm run setup-grafana http://1.2.3.4:3000 admin mypassword http://5.6.7.8:9090

This will:
1. Create a Prometheus data source
2. Import the PulseQueue monitoring dashboard
3. Configure the dashboard to use Prometheus metrics
    `);
    process.exit(1);
  }
  
  const [grafanaUrl, username, password, prometheusUrl] = args as [string, string, string, string];
  
  setupGrafana({ grafanaUrl, username, password, prometheusUrl })
    .then(() => {
      console.log('🎉 Grafana setup completed successfully!');
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    });
}

export { setupGrafana }; 