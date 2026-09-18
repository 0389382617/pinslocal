const { S3Client } = require("@aws-sdk/client-s3");

// S3_ENDPOINT chỉ được set khi chạy local (trỏ vào container MinIO, giả lập S3).
// Khi triển khai lên AWS thật (Phase 3), bỏ biến này đi (và S3_FORCE_PATH_STYLE)
// -> SDK tự nối vào S3 thật của AWS, code không cần sửa gì.
const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: process.env.S3_ENDPOINT || undefined,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  credentials: process.env.S3_ENDPOINT
    ? {
        accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
        secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin",
      }
    : undefined,
});

module.exports = {
  s3,
  BUCKET: process.env.S3_BUCKET || "pinslocal-photos",
  PUBLIC_URL_BASE: process.env.S3_PUBLIC_URL_BASE || process.env.S3_ENDPOINT,
};
