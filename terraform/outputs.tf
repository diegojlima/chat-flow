
output "lambda_function_name" {
  value = aws_lambda_function.cache_lambda.function_name
  description = "The name of the Lambda function"
}
