
import pytest
from moto import mock_mongodb
from app import lambda_handler

@mock_mongodb
def test_lambda_handler():
    event = {
        'conversation_id': '123',
        'message': 'Test message',
    }

    response = lambda_handler(event, None)

    assert response['statusCode'] == 200
    assert response['body'] == 'Message cached successfully'
