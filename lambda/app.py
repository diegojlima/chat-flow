
import json
import os
from datetime import datetime, timedelta
from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient(os.environ['MONGODB_URI'])
db = client.chat2shop

def lambda_handler(event, context):
    # Extract the conversation ID and message from the event
    conversation_id = event['conversation_id']
    message = event['message']
    
    # Check if the conversation is already in the database
    conversation = db.conversations.find_one({'_id': conversation_id})
    
    if conversation is None:
        # If not, create a new conversation
        conversation = {
            '_id': conversation_id,
            'messages': [message],
            'start_time': datetime.utcnow(),
        }
        db.conversations.insert_one(conversation)
    else:
        # If so, update the conversation
        db.conversations.update_one(
            {'_id': conversation_id},
            {'$push': {'messages': message}},
        )
    
    # Delete conversations that are more than an hour old
    cutoff_time = datetime.utcnow() - timedelta(hours=1)
    db.conversations.delete_many({'start_time': {'$lt': cutoff_time}})
    
    return {
        'statusCode': 200,
        'body': json.dumps('Message cached successfully')
    }
