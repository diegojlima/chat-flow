
resource "aws_sqs_queue" "interaction_queue" {
  name = "interaction_queue"
  visibility_timeout_seconds = 300 // 5 minutes
  redrive_policy             = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.interaction_dead_letter_queue.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue" "interaction_dead_letter_queue" {
  name = "interaction_dead_letter_queue"
}

resource "aws_sqs_queue" "processed_queue" {
  name = "processed_queue"
}
