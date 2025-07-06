# Prometheus & Grafana Monitoring Setup

This guide shows you how to set up **cost-effective Prometheus and Grafana monitoring** for your TypeScript PulseQueue e-commerce application using a **unified ECS cluster** with comprehensive metrics collection. The monitoring architecture is specifically designed to handle serverless Lambda environments where traditional Prometheus scraping doesn't work effectively.

## 🏗️ **Monitoring Architecture**

### **Why This Hybrid Approach?**

**Problem**: Lambda functions have no persistent state between invocations. Traditional Prometheus scraping from Lambda endpoints would only capture metrics from the current invocation, missing all historical data.

**Solution**: Hybrid CloudWatch + Prometheus approach:

1. **Lambda Functions** → Send metrics to CloudWatch for persistence
2. **Metrics Service** → Queries CloudWatch and converts to Prometheus format
3. **Prometheus** → Scrapes metrics service every 30 seconds
4. **Grafana** → Visualizes data from Prometheus

### **Metrics Flow Diagram**

```
Lambda Functions (order-service, payment-service)
       ↓ (send metrics to CloudWatch)
CloudWatch (persistent storage)
       ↓ (query via metrics service)
Metrics Service (converts to Prometheus format)
       ↓ (scraped every 30s)
Prometheus (time-series database)
       ↓ (queries)
Grafana (dashboards)
```

### **Histogram Metrics Reconstruction**

**Challenge**: CloudWatch custom metrics only provide Sum values, not the bucket data required for Prometheus histograms.

**Solution**: The metrics service intelligently reconstructs histogram buckets:

```typescript
// CloudWatch provides: Sum = 1.5 seconds
// Metrics service estimates: Count = 5 operations (1.5/0.3)
// Generates proper Prometheus histogram format:
order_processing_duration_seconds_bucket{le="0.1"} 0
order_processing_duration_seconds_bucket{le="0.5"} 5  // All operations fall here
order_processing_duration_seconds_bucket{le="1"} 5
order_processing_duration_seconds_bucket{le="2"} 5
order_processing_duration_seconds_bucket{le="5"} 5
order_processing_duration_seconds_bucket{le="10"} 5
order_processing_duration_seconds_bucket{le="+Inf"} 5
order_processing_duration_seconds_sum 1.5
order_processing_duration_seconds_count 5
```

This approach ensures that Prometheus receives proper histogram data that Grafana can visualize effectively.

### **Complete Metrics Coverage**

The monitoring system provides comprehensive coverage of all business and technical metrics:

#### **Lambda Performance Metrics**

- `lambda_requests_total{function_name="order-service",status="success"}` - Order service request count
- `lambda_requests_total{function_name="payment-service",status="success"}` - Payment service request count
- `lambda_request_duration_seconds{function_name="order-service"}` - Order service execution time histogram
- `lambda_request_duration_seconds{function_name="payment-service"}` - Payment service execution time histogram

#### **Business Process Metrics**

- `orders_processed_total{status="success",error_type="none"}` - Successful order processing count
- `payments_processed_total{status="success",error_type="none"}` - Successful payment processing count
- `order_processing_duration_seconds` - Order processing time histogram
- `payment_processing_duration_seconds` - Payment processing time histogram

#### **Inventory Management Metrics**

- `stock_reservations_total{status="success",sku="prod-001"}` - Stock reservation count by SKU
- `inventory_operations_total{operation_type="reserve",status="success"}` - Reserve operations count
- `inventory_operations_total{operation_type="decrement_stock",status="success"}` - Stock decrement operations count
- `inventory_operations_total{operation_type="decrement_reserved",status="success"}` - Reserved stock decrement operations count

#### **Data Flow**

All metrics flow through the same pipeline: Lambda → CloudWatch → Metrics Service → Prometheus → Grafana

## 🎯 **Cost Analysis**

### **1 Hour Usage Cost: ~$0.08**

- **Prometheus ECS**: $0.04 (0.25 vCPU, 512MB RAM)
- **Grafana ECS**: $0.04 (0.25 vCPU, 512MB RAM)
- **CloudWatch Logs**: $0.00 (1-day retention)
- **Data Transfer**: $0.00 (minimal)
- **IAM & Other**: $0.00 (negligible)
- **API Gateway**: $0.00 (minimal usage)
- **TOTAL**: **$0.0822**

### **Cost Savings vs Full Stack**

- **Original Monthly Cost**: $150.00
- **Lab Stack Monthly**: $59.16
- **Savings**: $90.84 (60.6% savings)

### **Unified Cluster Benefits**

- ✅ **Single ECS Cluster**: Both Prometheus and Grafana share one cluster
- ✅ **Shared IAM Roles**: Reduced IAM complexity
- ✅ **Unified Security Group**: Single security group for both services
- ✅ **Easier Management**: One cluster to monitor and manage
- ✅ **Secure Password Handling**: No hardcoded secrets in code

## 🚀 **Quick Setup**

### **1. Install Dependencies**

```bash
npm install
```

### **2. Build Lambda Functions**

```bash
npm run build:lambda:dev
npm run build:metrics:dev
```

### **3. Deploy Infrastructure**

```bash
npm run deploy:dev:ts
```

This will deploy all Lambda functions, infrastructure, and monitoring stack.

### **4. Configure Secrets (IMPORTANT!)**

Edit `infra/envs/dev/secrets.auto.tfvars` and set a secure password:

```hcl
grafana_admin_password = "yourSecurePassword123"
```

**Note**: This file is git-ignored for security. Never commit passwords to version control.

### **5. Deploy Infrastructure**

```bash
npm run plan:dev
npm run apply:dev
```

### **6. Access Your Monitoring**

- **Prometheus**: Check Terraform outputs for access instructions
- **Grafana**: Check Terraform outputs for access instructions
- **CloudWatch**: Existing dashboard
- **Metrics API**: Available at API Gateway endpoint

### **7. Clean Up (IMPORTANT!)**

```bash
npm run destroy:dev
```

## 📊 **What You Get**

### **Prometheus**

- Real-time metrics collection
- Lambda function metrics
- Business KPIs
- Custom metrics support

### **Grafana**

- Beautiful dashboards
- Real-time visualization
- Pre-configured panels
- Business metrics

### **CloudWatch** (Existing)

- AWS native monitoring
- Lambda performance
- Error tracking
- Cost-effective metrics

## 🔧 **Cost-Effective Features**

### **Infrastructure Optimizations**

- ✅ **Unified ECS Cluster**: Single cluster for both services
- ✅ **No ALB**: Direct access via public IP (saves $20/month)
- ✅ **No NAT Gateway**: Public subnets only (saves $45/month)
- ✅ **Minimal ECS**: 0.25 vCPU, 512MB RAM per service
- ✅ **1-day Log Retention**: Minimal CloudWatch costs
- ✅ **Disabled Container Insights**: Reduces overhead
- ✅ **Auto-cleanup Tags**: Easy resource management
- ✅ **Secure Secrets**: No hardcoded passwords in code

### **Resource Specifications**

```
Unified Monitoring Cluster:
- Prometheus: 256 CPU units (0.25 vCPU), 512 MB RAM
- Grafana: 256 CPU units (0.25 vCPU), 512 MB RAM
- Shared IAM roles and security group
- Cost: $0.0405/hour per service
```

## 🔒 **Security Setup**

### **Password Management**

The Grafana admin password is handled securely:

1. **No hardcoded passwords** in Terraform files
2. **Secrets file**: `infra/envs/dev/secrets.auto.tfvars` (git-ignored)
3. **Sensitive variables**: Marked as `sensitive = true`
4. **Auto-loading**: Terraform automatically loads `*.auto.tfvars`

### **Example secrets.auto.tfvars**

```hcl
# ============================================================================
# SECRETS FILE - DO NOT COMMIT TO GIT
# ============================================================================

grafana_admin_password = "yourSecurePassword123"
```

### **Security Best Practices**

- ✅ **Git-ignored secrets**: `secrets.auto.tfvars` is in `.gitignore`
- ✅ **No defaults**: Variables require explicit values
- ✅ **Sensitive marking**: Prevents accidental exposure
- ✅ **Environment-specific**: Different passwords per environment

## 🌐 **Access Instructions**

### **Prometheus Access**

1. Go to AWS ECS Console
2. Find cluster: `dev-monitoring-cluster`
3. Find service: `dev-prometheus-service`
4. Click on the running task
5. Note the **Public IP**
6. Access: `http://<PUBLIC_IP>:9090`

### **Grafana Access**

1. Go to AWS ECS Console
2. Find cluster: `dev-monitoring-cluster`
3. Find service: `dev-grafana-service`
4. Click on the running task
5. Note the **Public IP**
6. Access: `http://<PUBLIC_IP>:3000`
7. Login: `admin` / `[password from secrets.auto.tfvars]`

### **AWS CLI Commands**

```bash
# Get Prometheus public IP
aws ecs describe-tasks \
  --cluster dev-monitoring-cluster \
  --tasks $(aws ecs list-tasks \
    --cluster dev-monitoring-cluster \
    --service-name dev-prometheus-service \
    --query 'taskArns[0]' \
    --output text)

# Get Grafana public IP
aws ecs describe-tasks \
  --cluster dev-monitoring-cluster \
  --tasks $(aws ecs list-tasks \
    --cluster dev-monitoring-cluster \
    --service-name dev-grafana-service \
    --query 'taskArns[0]' \
    --output text)
```

## 📈 **Dashboard Setup**

### **Automated Dashboard Setup**

Use the provided script to automatically set up the Grafana dashboard:

```bash
# Get the required URLs from Terraform outputs
cd infra/envs/dev
terraform output grafana_access_instructions
terraform output prometheus_access_instructions

# Set up the dashboard automatically
npm run setup-grafana <grafana-url> <username> <password> <prometheus-url>
```

### **Manual Dashboard Setup**

If you prefer manual setup:

1. **Grafana Data Source**
   - Login to Grafana using password from `secrets.auto.tfvars`
   - Go to Configuration → Data Sources
   - Add Prometheus data source:
     - **URL**: `http://<PROMETHEUS_PUBLIC_IP>:9090`
     - **Access**: Server (default)
     - **Save & Test**

2. **Import Dashboard**
   - Go to Dashboards → Import
   - Use the dashboard JSON from `infra/envs/dev/grafana-dashboard.json`
   - Select Prometheus as data source
   - Import

## 🔍 **Monitoring Features**

### **Lambda Performance Metrics**

- **Request Rates**: Requests per second by function
- **Request Durations**: 50th and 95th percentile response times
- **Error Rates**: Error counts by function and error type
- **Cold Start Tracking**: Performance impact of Lambda cold starts

### **Business KPIs**

- **Order Processing**: Success/failure rates, processing times
- **Payment Processing**: Payment success rates, processing durations
- **Stock Reservations**: Reservation success rates by SKU
- **Inventory Operations**: Stock decrements, reserved quantity management

### **Custom Metrics**

- **CloudWatch Integration**: Metrics persistence across Lambda invocations
- **Prometheus Compatibility**: Standard Prometheus metric format
- **Real-time Collection**: Metrics updated every 30 seconds
- **Multi-dimensional**: Metrics with labels for detailed analysis

### **Infrastructure Health**

- **ECS Service Status**: Service health and availability
- **Resource Utilization**: CPU and memory usage
- **Network Connectivity**: API Gateway and Lambda connectivity
- **Error Tracking**: Comprehensive error monitoring and alerting

## ⚠️ **Important Notes**

### **Security**

- **Public Access**: Services are accessible from internet
- **Lab Only**: Not suitable for production
- **Temporary**: Remember to destroy after use
- **Secure Passwords**: Use strong passwords in secrets file

### **Limitations**

- **No Load Balancer**: Direct IP access only
- **No SSL**: HTTP only for lab use
- **Minimal Resources**: May be slow under load
- **No Persistence**: Data lost on restart

### **Best Practices**

1. **Always destroy** resources after lab
2. **Use tags** for easy cleanup
3. **Monitor costs** in AWS Console
4. **Set reminders** to clean up
5. **Use strong passwords** in secrets file
6. **Never commit secrets** to git

## 🧹 **Cleanup Commands**

### **Destroy All Resources**

```bash
npm run destroy:dev
```

### **Verify Cleanup**

```bash
# Check ECS services
aws ecs list-services --cluster dev-monitoring-cluster

# Check CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix "/ecs/dev-"
```

## 💰 **Cost Tracking**

### **Monitor Costs**

- AWS Cost Explorer
- CloudWatch Billing Alarms
- Resource Tags for tracking

### **Cost Alerts**

Set up billing alerts:

```bash
# Example: Alert if daily cost > $1
aws cloudwatch put-metric-alarm \
  --alarm-name "lab-daily-cost" \
  --alarm-description "Daily cost alert for lab" \
  --metric-name "EstimatedCharges" \
  --namespace "AWS/Billing" \
  --statistic "Maximum" \
  --period 86400 \
  --threshold 1.0 \
  --comparison-operator "GreaterThanThreshold"
```

## 🎯 **Lab Workflow**

### **Typical 1-Hour Lab Session**

1. **Configure** (2 minutes): Set password in `secrets.auto.tfvars`
2. **Deploy** (5 minutes): `npm run apply:dev`
3. **Setup** (10 minutes): Configure Grafana data source
4. **Test** (30 minutes): Run your application, monitor metrics
5. **Analyze** (10 minutes): Review dashboards, check performance
6. **Cleanup** (5 minutes): `npm run destroy:dev`

### **Total Cost**: ~$0.08 for 1 hour

## 📚 **Troubleshooting**

### **Common Issues**

1. **Can't access Prometheus/Grafana**
   - Check ECS service is running
   - Verify public IP is correct
   - Check security group allows traffic

2. **High costs**
   - Verify resources are destroyed
   - Check for orphaned resources
   - Monitor AWS Cost Explorer

3. **Slow performance**
   - Normal for minimal resources
   - Consider increasing CPU/memory if needed
   - Check CloudWatch metrics

4. **Password issues**
   - Check `secrets.auto.tfvars` exists
   - Verify password is set correctly
   - Check variable is marked as sensitive

### **Support**

- Check CloudWatch logs for errors
- Verify IAM permissions
- Review Terraform outputs
- Use AWS CLI for debugging

## 🎉 **Success Metrics**

### **What You've Achieved**

- ✅ **Unified Prometheus & Grafana** for $0.08/hour
- ✅ **Single ECS cluster** for easier management
- ✅ **Real-time monitoring** of your application
- ✅ **Business metrics** visualization
- ✅ **Cost-effective** lab environment
- ✅ **Easy cleanup** process
- ✅ **Secure password handling** with no hardcoded secrets

### **Next Steps**

1. **Customize dashboards** for your specific needs
2. **Add more metrics** to your Lambda functions
3. **Set up alerts** for critical thresholds
4. **Scale resources** if needed for longer sessions
5. **Use strong passwords** in production environments

**Happy Monitoring! 🚀**

---

## 🚀 **Future Improvements**

### **Automated Dashboard Creation**

Currently, the Grafana dashboard setup requires manual configuration or script execution. Future improvements will automate this process:

#### **Planned Automation**

1. **Terraform Integration**
   - Automate Grafana dashboard creation via Terraform providers
   - Store dashboard configurations as code
   - Version control dashboard changes

2. **Deployment Pipeline Enhancement**
   - Include dashboard setup in the deployment script
   - Automatic dashboard provisioning after infrastructure deployment
   - Environment-specific dashboard configurations

3. **Dashboard Templates**
   - Reusable dashboard templates for different environments
   - Dynamic metric configuration based on deployed services
   - Automated alert rule creation

4. **Monitoring as Code**
   - Grafana dashboard definitions in JSON/YAML
   - Prometheus alert rules as code
   - Automated monitoring stack deployment

#### **Implementation Benefits**

- **Reduced Manual Work**: No manual dashboard setup required
- **Consistency**: Same dashboards across all environments
- **Version Control**: Dashboard changes tracked in Git
- **Scalability**: Easy to add new metrics and dashboards
- **Reliability**: Automated setup reduces human error

### **Enhanced Metrics Collection**

#### **Planned Enhancements**

1. **Real-time Notifications**
   - Slack/Teams integration for alerts
   - Email notifications for critical thresholds
   - SMS alerts for urgent issues

2. **Advanced Analytics**
   - Business intelligence dashboards
   - Trend analysis and forecasting
   - Custom metric aggregation

3. **Performance Optimization**
   - Lambda cold start optimization
   - Resource right-sizing recommendations
   - Auto-scaling based on metrics

4. **Security Enhancements**
   - Enhanced IAM policies
   - Encryption at rest and in transit
   - Audit logging for monitoring access

### **Cost Optimization**

#### **Planned Improvements**

1. **Resource Optimization**
   - Auto-scaling based on usage patterns
   - Right-sizing recommendations
   - Cost-aware resource allocation

2. **Multi-region Deployment**
   - Disaster recovery capabilities
   - Geographic distribution for performance
   - Cost optimization across regions

3. **Advanced Alerting**
   - Cost threshold alerts
   - Resource utilization warnings
   - Performance degradation notifications

### **E-commerce Pipeline Extension**

The current monitoring focuses on order processing. Future enhancements will extend monitoring to the complete e-commerce pipeline:

#### **Planned Event Types**

1. **Customer Events**
   - Customer registration and login metrics
   - Profile update tracking
   - Authentication success/failure rates

2. **Catalog Events**
   - Product creation and update metrics
   - Inventory level monitoring
   - Category management tracking

3. **Shopping Cart Events**
   - Cart abandonment rates
   - Item addition/removal tracking
   - Checkout conversion metrics

4. **Fulfillment Events**
   - Shipping status tracking
   - Delivery time monitoring
   - Return processing metrics

5. **Customer Service Events**
   - Support ticket metrics
   - Resolution time tracking
   - Customer satisfaction scores

#### **Architecture Enhancements**

- **Event Sourcing**: Complete audit trail of all business events
- **CQRS Pattern**: Separate read and write models for scalability
- **Saga Pattern**: Distributed transaction management for complex workflows
- **Event Replay**: Ability to replay events for debugging and analytics

### **CloudWatch Metrics Validation**

The current monitoring system relies on CloudWatch custom metrics that are converted to Prometheus format. There are likely errors in the CloudWatch metrics that Prometheus is ingesting, particularly around histogram reconstruction and metric aggregation. Future improvements should include:

#### **Planned Validation Enhancements**

1. **Metrics Validation**
   - Implement validation checks for CloudWatch metric data quality
   - Add data integrity verification for histogram reconstruction
   - Validate metric aggregation accuracy

2. **Error Detection**
   - Add monitoring for CloudWatch metric collection failures
   - Track missing or delayed metric data
   - Alert on metric collection errors

3. **Data Quality Monitoring**
   - Track missing or incorrect metric data
   - Monitor metric freshness and completeness
   - Validate metric label consistency

4. **Fallback Mechanisms**
   - Implement alternative metric collection methods when CloudWatch data is unreliable
   - Add direct Prometheus metric emission as backup
   - Create metric collection redundancy

5. **Metric Reconciliation**
   - Compare CloudWatch data with actual business operations
   - Identify discrepancies between expected and actual metrics
   - Validate histogram bucket accuracy against real data

### **Implementation Roadmap**

1. **Phase 1**: Automated dashboard creation
2. **Phase 2**: Enhanced metrics collection
3. **Phase 3**: Cost optimization features
4. **Phase 4**: E-commerce pipeline extension
5. **Phase 5**: Advanced analytics and BI
6. **Phase 6**: CloudWatch metrics validation and error correction

This roadmap ensures continuous improvement while maintaining the cost-effective, lab-friendly approach that makes this monitoring solution accessible for learning and development.
