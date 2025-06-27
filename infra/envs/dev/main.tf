# Configure the AWS provider and region
provider "aws" {
  region = "eu-west-2"
}

# Deploy the order service Lambda function using the custom module
module "order_service" {
  source          = "../../modules/lambda/order-service"                      # Path to the Lambda module
  lambda_zip_path = abspath("${path.module}/../../../dist/order-service.zip") # Path to the Lambda deployment package
  function_name   = "order-service-handler"                                   # Name for the Lambda function
  environment     = "dev"                                                     # Environment name
  depends_on      = [module.eventbridge]                                      # Ensure EventBridge is created first
}

# Deploy the custom EventBridge bus using the eventbridge module
module "eventbridge" {
  source   = "../../modules/eventbridge" # Path to the EventBridge module
  bus_name = "pulsequeue-bus"            # Name for the EventBridge bus
}
#de zip path
#output "resolved_lambda_zip_path" {
#  value = module.order_service.zip_path
#}
