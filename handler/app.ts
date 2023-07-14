import { SQS } from 'aws-sdk';
import { MongoClient, Db, Collection } from 'mongodb';
import { Callback, Context, SQSEvent } from 'aws-lambda';
import { SendMessageRequest } from 'aws-sdk/clients/sqs';

interface Conversation {
    _id: string;
    messages: string[];
    start_time: Date;
}

async function lambdaHandler(event: SQSEvent, context: Context, callback: Callback): Promise<void> {
    // Initialize the SQS client
    const sqs = new SQS();

    // Connect to MongoDB
    const client = await MongoClient.connect(process.env.MONGODB_URI!);
    const db: Db = client.db('chatflow');
    const conversations: Collection<Conversation> = db.collection('conversations');

    // Extract the conversation ID and message from the SQS message
    const conversation_id: string = event.Records[0].messageAttributes!.PhoneNumber.stringValue!;
    const message: string = event.Records[0].body;

    // Delete conversations that are more than an hour old
    const cutoff_time: Date = new Date(Date.now() - 60 * 60 * 1000);
    await conversations.deleteMany({ start_time: { $lt: cutoff_time } });

    // Check if the conversation is already in the database
    let conversation = await conversations.findOne({ _id: conversation_id });

    if (conversation === null) {
        // If not, create a new conversation with the current message
        conversation = {
            _id: conversation_id,
            messages: [message],
            start_time: new Date(),
        };
        await conversations.insertOne(conversation);
    } else {
        // If so, update the conversation with the current message
        conversation.messages.push(message);
        await conversations.updateOne(
            { _id: conversation_id },
            { $set: { messages: conversation.messages } },
        );
    }

    // Prepare the messages to send to the processed queue
    const messagesToSend = conversation.messages.slice(-4);

    // Write the last 4 messages to the processed queue
    const sendMessageReq: SendMessageRequest = {
        QueueUrl: process.env.PROCESSED_QUEUE_URL!,
        MessageBody: JSON.stringify(messagesToSend),
    };

    try {
        await sqs.sendMessage(sendMessageReq).promise();
    } catch (error: any) {
        if (error.code) {
            console.error(`AWS error occurred: ${error.code}`);
            callback(error);
            return;
        }
        // handle non-AWS errors
    }

    // Delete the message from the interaction queue
    try {
        await sqs.deleteMessage({
            QueueUrl: process.env.INTERACTION_QUEUE_URL!,
            ReceiptHandle: event.Records[0].receiptHandle,
        }).promise();
    } catch (error: any) {
        if (error.code) {
            console.error(`AWS error occurred: ${error.code}`);
            callback(error);
            return;
        }
        // handle non-AWS errors
    }

    callback(null, {
        statusCode: 200,
        body: 'Message processed and cached successfully',
    });
}

// Export the handler function. This is what AWS Lambda will call.
exports.lambdaHandler = lambdaHandler;
