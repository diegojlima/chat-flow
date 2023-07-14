import { Db, MongoClient } from 'mongodb';
import { SQS } from 'aws-sdk';
import { handler } from '..';
import { Context, SQSEvent } from 'aws-lambda';

const SQSMocked = {
  sendMessage: jest.fn().mockReturnThis(),
  deleteMessage: jest.fn().mockReturnThis(),
  promise: jest.fn()
};

jest.mock('aws-sdk', () => {
  return {
    SQS: jest.fn(() => SQSMocked)
  };
});

jest.mock('mongodb', () => ({
  MongoClient: {
    connect: jest.fn().mockResolvedValue({
      db: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue({
          deleteMany: jest.fn().mockResolvedValue(null),
          findOne: jest.fn().mockResolvedValue(null),
          insertOne: jest.fn().mockResolvedValue(null),
          updateOne: jest.fn().mockResolvedValue(null),
        }),
      }),
    }),
  },
}));

describe('handler', () => {
  let connection: MongoClient;
  let db: Db;
  let event: SQSEvent;
  let context: Context;

  beforeEach(() => {
    jest.clearAllMocks();

    event = {
      Records: [
        {
          messageId: 'id',
          receiptHandle: 'ExampleReceiptHandle',
          body: 'Test message',
          attributes: {
            ApproximateReceiveCount: '1',
            SentTimestamp: '1545082649181',
            SenderId: 'AROAXXXXXXXXXX',
            ApproximateFirstReceiveTimestamp: '1545082649181',
          },
          messageAttributes: {
            PhoneNumber: {
              stringValue: '1234567890',
              binaryListValues: [],
              dataType: 'String',
              stringListValues: [],
            },
          },
          md5OfBody: '',
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:my-queue',
          awsRegion: 'us-east-1',
        },
      ],
    };

    context = {} as Context; 

    // Mock promise method
    SQSMocked.promise.mockResolvedValue({});
  });

  it('should run without errors', async () => {
    await expect(handler(event, context)).resolves.not.toThrow();
  });

  it('should handle errors when sending a message to the processed queue', async () => {
    SQSMocked.promise.mockRejectedValueOnce(new Error('Failed to send message'));
    await expect(handler(event, context)).resolves.not.toThrow();
  });

  it('should handle errors when deleting a message from the interaction queue', async () => {
    SQSMocked.promise.mockRejectedValueOnce(new Error('Failed to delete message'));
    await expect(handler(event, context)).resolves.not.toThrow();
  });

  it('should send messages to the processed queue', async () => {
    await handler(event, context);
    expect(SQSMocked.sendMessage).toHaveBeenCalledWith({
        QueueUrl: process.env.PROCESSED_QUEUE_URL!,
        MessageBody: JSON.stringify(["Test message"]),
    });
  });

  it('should delete the message from the interaction queue', async () => {
      await handler(event, context);
      expect(SQSMocked.deleteMessage).toHaveBeenCalledWith({
          QueueUrl: process.env.INTERACTION_QUEUE_URL!,
          ReceiptHandle: event.Records[0].receiptHandle,
      });
  });

  it('should handle errors when sending messages to the processed queue', async () => {
      SQSMocked.sendMessage.mockImplementationOnce(() => {
          return {
              promise: () => Promise.reject(new Error('Failed to send message'))
          };
      });
      await expect(handler(event, context)).resolves.not.toThrow();
  });

  it('should handle errors when deleting messages from the interaction queue', async () => {
      SQSMocked.deleteMessage.mockImplementationOnce(() => {
          return {
              promise: () => Promise.reject(new Error('Failed to delete message'))
          };
      });
      await expect(handler(event, context)).resolves.not.toThrow();
  });
});
