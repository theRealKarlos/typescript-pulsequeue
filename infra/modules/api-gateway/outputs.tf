# ============================================================================
# API GATEWAY OUTPUTS
# ============================================================================

output "api_gateway_url" {
  description = "URL of the API Gateway endpoint"
  value       = "${aws_api_gateway_stage.this.invoke_url}/${var.resource_path}"
}

# NOTE: Other outputs (api_gateway_id, api_gateway_execution_arn, stage_name) 
# removed as they are not being used in the current configuration. 
