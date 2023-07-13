resource "aws_lambda_function" "cache_lambda" {
  function_name = var.function_name
  handler       = var.handler
  role          = aws_iam_role.lambda_role.arn
  runtime       = var.runtime

  filename = var.filename
  source_code_hash = filebase64sha256(var.filename)

  environment {
    variables = {
      MONGODB_URI = var.mongodb_uri
      INTERACTION_QUEUE_URL = aws_sqs_queue.interaction_queue.url
      PROCESSED_QUEUE_URL = aws_sqs_queue.processed_queue.url
    }
  }
}

resource "aws_iam_role" "lambda_role" {
  name = var.role_name

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = var.policy_name
  role = aws_iam_role.lambda_role.id

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "${aws_sqs_queue.interaction_queue.arn}"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "${aws_sqs_queue.processed_queue.arn}"
    }
  ]
}
EOF
}

resource "aws_sqs_queue" "interaction_queue" {
  name = var.interaction_queue_name
}

resource "aws_sqs_queue" "processed_queue" {
  name = var.processed_queue_name
}

resource "aws_lambda_event_source_mapping" "interaction_queue_mapping" {
  event_source_arn = aws_sqs_queue.interaction_queue.arn
  function_name = aws_lambda_function.cache_lambda.function_name
}