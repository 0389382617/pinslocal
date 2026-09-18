/*
 * Script khoi tao ha tang local: tao bang DynamoDB + bucket S3 (MinIO) neu chua co.
 * Chay 1 lan khi docker-compose up (service "init"). An toan chay lai nhieu lan
 * (idempotent: bo qua loi "da ton tai").
 */
const {
  CreateTableCommand,
  DescribeTableCommand,
} = require("@aws-sdk/client-dynamodb");
const {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} = require("@aws-sdk/client-s3");
const { client: dynamoClient, TABLE } = require("../lib/dynamo");
const { s3, BUCKET } = require("../lib/s3");

async function ensureTable() {
  try {
    await dynamoClient.send(new DescribeTableCommand({ TableName: TABLE }));
    console.log(`[setup] Bang DynamoDB "${TABLE}" da ton tai.`);
  } catch (err) {
    if (err.name !== "ResourceNotFoundException") throw err;
    await dynamoClient.send(
      new CreateTableCommand({
        TableName: TABLE,
        AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
        KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
        BillingMode: "PAY_PER_REQUEST",
      })
    );
    console.log(`[setup] Da tao bang DynamoDB "${TABLE}".`);
  }
}

async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
    console.log(`[setup] Bucket "${BUCKET}" da ton tai.`);
  } catch (err) {
    await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
    console.log(`[setup] Da tao bucket "${BUCKET}".`);
  }

  // Cho phep doc public anh (de frontend hien thi truc tiep tu MinIO/S3).
  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: "*",
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${BUCKET}/*`],
      },
    ],
  };
  await s3.send(
    new PutBucketPolicyCommand({ Bucket: BUCKET, Policy: JSON.stringify(policy) })
  );
  console.log(`[setup] Da set policy public-read cho bucket "${BUCKET}".`);
}

async function withRetry(fn, label, attempts = 10, delayMs = 2000) {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts) throw err;
      console.log(`[setup] ${label} chua san sang (lan ${i}/${attempts}), thu lai sau ${delayMs}ms...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

async function main() {
  await withRetry(ensureTable, "DynamoDB");
  await withRetry(ensureBucket, "MinIO");
  console.log("[setup] Hoan tat.");
}

main().catch((err) => {
  console.error("[setup] Loi:", err);
  process.exit(1);
});
