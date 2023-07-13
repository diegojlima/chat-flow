
import pytest
from mongomock import MongoClient
from my_lambda.app import lambda_handler


def test_lambda_handler():
    event = {
        'conversation_id': '123',
        'message': 'Test message',
    }

    response = lambda_handler(event, None, db)

    assert response['statusCode'] == 200
    assert response['body'] == 'Message cached successfully'
