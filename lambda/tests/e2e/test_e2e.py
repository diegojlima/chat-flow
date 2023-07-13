
import pytest
from pymongo import MongoClient
from moto import mock_mongodb
from app import lambda_handler

@mock_mongodb
def test_lambda_handler():
    # Create a mock MongoDB client
    client = MongoClient()
    
    # Create a mock database and collection
    db = client.db
    conversations = db.create_collection('conversations')
    
    event = {
        'conversation_id': '123',
        'message': 'Test message',
    }

    response = lambda_handler(event, None)

    # Verify that the message was stored in the database
    conversation = conversations.find_one({'_id': '123'})
    assert conversation is not None
    assert conversation['messages'] == ['Test message']
    
    # Simulate a second message
    event = {
        'conversation_id': '123',
        'message': 'Test message 2',
    }

    response = lambda_handler(event, None)

    # Verify that the second message was added to the conversation
    conversation = conversations.find_one({'_id': '123'})
    assert conversation is not None
    assert conversation['messages'] == ['Test message', 'Test message 2']
