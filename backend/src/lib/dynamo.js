const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

// DYNAMODB_ENDPOINT chỉ được set khi chạy local (trỏ vào container dynamodb-local).
// Khi triển khai lên AWS thật (Phase 3), bỏ biến này đi -> SDK tự nối vào DynamoDB
// thật của AWS theo AWS_REGION + credentials, code không cần sửa gì.
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: process.env.DYNAMODB_ENDPOINT || undefined,
  credentials: process.env.DYNAMODB_ENDPOINT
    ? { accessKeyId: "local", secretAccessKey: "local" }
    : undefined,
});

const doc = DynamoDBDocumentClient.from(client);

module.exports = { client, doc, TABLE: process.env.DYNAMODB_TABLE || "Pins" };
