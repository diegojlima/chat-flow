
provider "aws" {
  region = "us-west-2"
}

resource "aws_lambda_function" "chat2shop_cache" {
  function_name = "chat2shop_cache"
  role          = aws_iam_role.iam_for_lambda.arn
  handler       = "app.lambda_handler"
  
  source_code_hash = filebase64sha256("lambda.zip")
  runtime          = "python3.8"

  timeout = 60
  memory_size = 128
}

resource "aws_iam_role" "iam_for_lambda" {
  name = "iam_for_lambda"

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
