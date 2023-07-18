
variable "aws_region" {
  description = "AWS region"
  default     = "us-east-1"
}

variable "aws_access_key" {
  description = "AWS access key"
}

variable "aws_secret_key" {
  description = "AWS secret key"
}

variable "lambda_function_name" {
  description = "Name of the Lambda function"
  default     = "chat-flow-service"
}

variable "lambda_handler" {
  description = "Lambda function entrypoint (format: <file-name>.<function-name>)"
  default     = "index.handler"
}

variable "lambda_runtime" {
  description = "Runtime language for the Lambda function"
  default     = "nodejs18.x"
}

variable "filename" {
  description = "Name of the deployment package ZIP file"
  default     = "index.zip"
}

variable "mongodb_username" {
  description = "The username for MongoDB"
}

variable "mongodb_password" {
  description = "The password for MongoDB"
}
