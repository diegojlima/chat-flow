
data "archive_file" "function_archive" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/dist"
  output_path = "${path.module}/../lambda/dist/function_${timestamp()}.zip"
}

resource "aws_lambda_layer_version" "dependency_layer" {
  filename            = "${path.module}/../dist/layers/layers.zip"
  layer_name          = "dependency_layer"
  compatible_runtimes = ["nodejs18.x"]
  source_code_hash    = filesha256("${path.module}/../dist/layers/layers.zip")
}

resource "aws_lambda_function" "chat_flow_service" {
  filename      = data.archive_file.function_archive.output_path
  function_name = var.lambda_function_name
  role          = aws_iam_role.lambda_exec_role.arn
  handler       = var.lambda_handler
  runtime       = var.lambda_runtime
  timeout       = 180  // Execution timeout in seconds

  layers = [aws_lambda_layer_version.dependency_layer.arn]

  environment {
    variables = {
      MONGODB_URI            = aws_docdb_cluster.example.endpoint
      PROCESSED_QUEUE_URL    = aws_sqs_queue.processed_queue.arn
      INTERACTION_QUEUE_URL  = aws_sqs_queue.interaction_queue.arn
      MONGODB_USERNAME       = var.mongodb_username
      MONGODB_PASSWORD       = var.mongodb_password
    }
  }

  vpc_config {
    subnet_ids         = [aws_subnet.main.id]
    security_group_ids = [aws_security_group.sg.id]
  }
}

resource "aws_lambda_event_source_mapping" "sqs_lambda_mapping" {
  event_source_arn = aws_sqs_queue.interaction_queue.arn
  function_name    = aws_lambda_function.chat_flow_service.arn
}
