"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const mongodb_1 = require("mongodb");
const sqs_1 = __importDefault(require("aws-sdk/clients/sqs"));
const handler = async (event, context) => {
    try {
        console.log('Received event:', JSON.stringify(event, null, 2));
        // Initialize the SQS client
        const sqs = new sqs_1.default();
        // Connect to MongoDB
        console.log('Connecting to MongoDB');
        const client = await mongodb_1.MongoClient.connect(process.env.MONGODB_URI);
        const db = client.db('chatflow');
        const conversations = db.collection('conversations');
        // Extract the conversation ID and message from the SQS message
        console.log('Extracting conversation ID and message from SQS message');
        const conversation_id = event.Records[0].messageAttributes.PhoneNumber.stringValue;
        const message = event.Records[0].body;
        console.log(`Conversation ID: ${conversation_id}`);
        console.log(`Message: ${message}`);
        // Delete conversations that are more than an hour old
        console.log('Deleting old conversations');
        const cutoff_time = new Date(Date.now() - 60 * 60 * 1000);
        await conversations.deleteMany({ start_time: { $lt: cutoff_time } });
        // Check if the conversation is already in the database
        console.log('Checking if conversation is already in the database');
        let conversation = await conversations.findOne({ _id: conversation_id });
        if (conversation === null) {
            // If not, create a new conversation with the current message
            console.log('Conversation not found, creating new conversation');
            conversation = {
                _id: conversation_id,
                messages: [message],
                start_time: new Date(),
            };
            await conversations.insertOne(conversation);
        }
        else {
            // If so, update the conversation with the current message
            console.log('Updating existing conversation');
            conversation.messages.push(message);
            await conversations.updateOne({ _id: conversation_id }, { $set: { messages: conversation.messages } });
        }
        // Prepare the messages to send to the processed queue
        console.log('Preparing messages to send to processed queue');
        const messagesToSend = conversation.messages.slice(-4);
        // Write the last 4 messages to the processed queue
        console.log('Sending messages to processed queue');
        const sendMessageReq = {
            QueueUrl: process.env.PROCESSED_QUEUE_URL,
            MessageBody: JSON.stringify(messagesToSend),
        };
        try {
            await sqs.sendMessage(sendMessageReq).promise();
            console.log('Successfully sent messages to processed queue');
        }
        catch (error) {
            console.error(`Failed to send messages to processed queue: ${error}`);
            return;
        }
        // Delete the message from the interaction queue
        console.log('Deleting message from interaction queue');
        try {
            await sqs.deleteMessage({
                QueueUrl: process.env.INTERACTION_QUEUE_URL,
                ReceiptHandle: event.Records[0].receiptHandle,
            }).promise();
            console.log('Successfully deleted message from interaction queue');
        }
        catch (error) {
            console.error(`Failed to delete message from interaction queue: ${error}`);
            return;
        }
        console.log('Execution complete');
    }
    catch (error) {
        console.error('Error occurred:', error);
    }
};
exports.handler = handler;
