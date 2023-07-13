from moto import mock_sqs
from unittest.mock import patch, MagicMock
import mongomock
import boto3
import pymongo
from my_lambda.app import lambda_handler
from datetime import datetime


@mock_sqs
@mongomock.patch(servers=('mongodb://localhost:27017/myDatabase',))
def test_lambda_handler():
    # Set a default region
    boto3.setup_default_session(region_name='us-east-1')

    # Create a mock SQS
    sqs = boto3.client('sqs')

    # Create the queue
    sqs.create_queue(QueueName='my_queue')

    event = {
        'Records': [
            {
                'messageAttributes': {
                    'PhoneNumber': {
                        'stringValue': '123'
                    }
                },
                'body': 'Test message',
                'receiptHandle': 'test_receipt_handle',
            }
        ]
    }

    with patch.dict('os.environ', {'PROCESSED_QUEUE_URL': 'my_queue', 'INTERACTION_QUEUE_URL': 'my_queue', 'MONGODB_URI': 'mongodb://localhost:27017/myDatabase'}):
        # Set up initial state in the mock database
        client = pymongo.MongoClient('mongodb://localhost:27017/myDatabase')
        db = client.chatflow
        conversation = {
            '_id': '123',
            'messages': ['Previous message'],
            'start_time': datetime.utcnow(),
        }
        db.conversations.insert_one(conversation)
        
        # Call lambda_handler
        response = lambda_handler(event, None)

    assert response['statusCode'] == 200
    assert response['body'] == 'Message processed and cached successfully'

    # You can also make assertions about the state of the mock database
    conversation = db.conversations.find_one({'_id': '123'})
    assert conversation['messages'] == ['Previous message', 'Test message']

    mock_sqs.stop()
    patch.stopall()

