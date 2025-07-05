# Prometheus & Grafana Monitoring Setup

This guide shows you how to set up **cost-effective Prometheus and Grafana monitoring** for your TypeScript PulseQueue lab project using a **unified ECS cluster**.

## 🎯 **Cost Analysis**

### **1 Hour Usage Cost: ~$0.08**

- **Prometheus ECS**: $0.04 (0.25 vCPU, 512MB RAM)
- **Grafana ECS**: $0.04 (0.25 vCPU, 512MB RAM)
- **CloudWatch Logs**: $0.00 (1-day retention)
- **Data Transfer**: $0.00 (minimal)
- **IAM & Other**: $0.00 (negligible)
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

### **3. Configure Secrets (IMPORTANT!)**

Edit `infra/envs/dev/secrets.auto.tfvars` and set a secure password:

```hcl
grafana_admin_password = "yourSecurePassword123"
```

**Note**: This file is git-ignored for security. Never commit passwords to version control.

### **4. Deploy Infrastructure**

```bash
npm run plan:dev
npm run apply:dev
```

### **5. Access Your Monitoring**

- **Prometheus**: Check Terraform outputs for access instructions
- **Grafana**: Check Terraform outputs for access instructions
- **CloudWatch**: Existing dashboard

### **6. Clean Up (IMPORTANT!)**

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

### **Grafana Data Source**

1. Login to Grafana using password from `secrets.auto.tfvars`
2. Go to Configuration → Data Sources
3. Add Prometheus data source:
   - **URL**: `http://<PROMETHEUS_PUBLIC_IP>:9090`
   - **Access**: Server (default)
   - **Save & Test**

### **Import Dashboard**

1. Go to Dashboards → Import
2. Use the dashboard JSON from `infra/envs/dev/grafana-dashboard.json`
3. Select Prometheus as data source
4. Import

## 🔍 **Monitoring Features**

### **Lambda Metrics**

- Request rates and durations
- Error rates by function
- Performance percentiles
- Custom business metrics

### **Business KPIs**

- Order processing rates
- Payment success rates
- Stock reservation operations
- Inventory tracking

### **Infrastructure Health**

- ECS service status
- Resource utilization
- Network connectivity
- Error tracking

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
