
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region  = var.aws_region
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}

data "aws_iam_policy_document" "assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_exec_role" {
  name               = "lambda_exec_role"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy.json
}

resource "aws_lambda_function" "chat_flow_service" {
  filename      = "../handler/dist/index.zip"
  function_name = var.lambda_function_name
  role          = aws_iam_role.lambda_exec_role.arn
  handler       = var.lambda_handler
  runtime       = var.lambda_runtime
  timeout       = 180  // Execution timeout in seconds

  environment {
    variables = {
      MONGODB_URI            = aws_docdb_cluster.example.endpoint
      PROCESSED_QUEUE_URL    = aws_sqs_queue.processed_queue.arn
      INTERACTION_QUEUE_URL  = aws_sqs_queue.interaction_queue.arn
      MONGODB_USERNAME       = var.mongodb_username
      MONGODB_PASSWORD       = var.mongodb_password
    }
  }
}

resource "aws_lambda_event_source_mapping" "sqs_lambda_mapping" {
  event_source_arn = aws_sqs_queue.interaction_queue.arn
  function_name    = aws_lambda_function.chat_flow_service.arn
}

resource "aws_sqs_queue" "interaction_queue" {
  name = "interaction_queue"
}

resource "aws_sqs_queue" "processed_queue" {
  name = "processed_queue"
}

resource "aws_docdb_cluster" "example" {
  cluster_identifier      = "docdb-cluster-example"
  master_username         = var.mongodb_username
  master_password         = var.mongodb_password
  backup_retention_period = 5
  preferred_backup_window = "07:00-09:00"
  skip_final_snapshot     = true
}

output "lambda_function_name" {
  value = aws_lambda_function.chat_flow_service.function_name
}

output "interaction_queue_arn" {
  value = aws_sqs_queue.interaction_queue.arn
}

output "processed_queue_arn" {
  value = aws_sqs_queue.processed_queue.arn
}

output "mongodb_endpoint" {
  value = aws_docdb_cluster.example.endpoint
}
