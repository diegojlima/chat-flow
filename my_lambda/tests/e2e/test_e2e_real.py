import boto3
import time
import pytest
import json

def test_e2e_real():
    # Create a client for SQS
    sqs = boto3.client('sqs')

    # URL of your SQS queue
    queue_url = 'https://sqs.us-east-1.amazonaws.com/062884439228/interaction_queue'

    # Prepare a message to send to the queue
    message_to_send = {
        'Records': [{
            'messageAttributes': {
                'PhoneNumber': {
                    'stringValue': '123',
                },
            },
            'body': 'Test message',
        }],
    }

    # Send a message to the queue
    response = sqs.send_message(
        QueueUrl=queue_url,
        MessageBody=json.dumps(message_to_send)  # Convert the message to a JSON string
    )

    # Sleep for a while to allow the Lambda function to process the message
    time.sleep(10)

    # Check the results
    assert check_database_for_expected_results(message_to_send['Records'][0]['body'])

def check_database_for_expected_results(expected_body):
    # Create a client for SQS
    sqs = boto3.client('sqs')

    # URL of the processed queue
    processed_queue_url = 'https://sqs.us-east-1.amazonaws.com/062884439228/processed_queue'

    # Receive a message from the processed queue
    response = sqs.receive_message(
        QueueUrl=processed_queue_url,
        MaxNumberOfMessages=1
    )

    # Check the contents of the message
    if 'Messages' in response:
        message = response['Messages'][0]
        message_body = message['Body']

        # Check that the message body matches the expected body
        assert message_body == expected_body
    else:
        # If no messages were returned, fail the test
        assert False, "No messages in processed queue"
