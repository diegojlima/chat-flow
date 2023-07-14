import { MongoClient } from 'mongodb';
import { SQS } from 'aws-sdk';
import { handler } from '..';
import { Context, SQSEvent } from 'aws-lambda';

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

jest.mock('aws-sdk', () => ({
  SQS: jest.fn().mockImplementation(() => ({
    sendMessage: jest.fn().mockReturnThis(),
    deleteMessage: jest.fn().mockReturnThis(),
    promise: jest.fn().mockResolvedValue(null),
  })),
}));

describe('handler', () => {
  it('should run without errors', async () => {
    const event = {
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

    const context = {} as Context; 

    await expect(handler(event, context)).resolves.not.toThrow();
  });
});
