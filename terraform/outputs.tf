
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
