
import json
import os
import boto3
from datetime import datetime, timedelta
from pymongo import MongoClient

# Initialize the SQS client
sqs = boto3.client('sqs')

# Connect to MongoDB
client = MongoClient(os.environ['MONGODB_URI'])
db = client.chat2shop

def lambda_handler(event, context):
    # Extract the conversation ID and message from the SQS message
    conversation_id = event['Records'][0]['messageAttributes']['PhoneNumber']['stringValue']
    message = event['Records'][0]['body']
    
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
    
    # Write the processed message to the processed queue
    sqs.send_message(
        QueueUrl=os.environ['PROCESSED_QUEUE_URL'],
        MessageBody=message,
    )

    # Delete the message from the interaction queue
    sqs.delete_message(
        QueueUrl=os.environ['INTERACTION_QUEUE_URL'],
        ReceiptHandle=event['Records'][0]['receiptHandle'],
    )

    return {
        'statusCode': 200,
        'body': 'Message processed and cached successfully'
    }
