# Bài 2 — Backend (Node.js + Express + DynamoDB + S3)

Thư mục: [`backend/`](../backend/). Đây là API phục vụ frontend: tạo/xem/xóa "pin" (ghim địa điểm kèm ảnh).

## 2.1. `package.json` — khai báo dependency

Mở [`backend/package.json`](../backend/package.json). Các gói quan trọng:

- `express` — framework viết REST API.
- `@aws-sdk/client-dynamodb` + `@aws-sdk/lib-dynamodb` — SDK chính thức của AWS để thao tác DynamoDB (dùng được cho cả DynamoDB thật lẫn bản giả lập local).
- `@aws-sdk/client-s3` — SDK thao tác S3 (dùng được cho cả S3 thật lẫn MinIO).
- `multer` — đọc file upload từ request `multipart/form-data` (ảnh người dùng gửi lên).
- `prom-client` — sinh số liệu theo chuẩn Prometheus (dùng ở Bài 4 khi bật monitoring).
- `jest` + `supertest` + `aws-sdk-client-mock` — viết test mà không cần chạy DynamoDB/S3 thật (xem mục 2.5).

## 2.2. Kết nối DynamoDB — [`src/lib/dynamo.js`](../backend/src/lib/dynamo.js)

Điểm mấu chốt:

```js
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: process.env.DYNAMODB_ENDPOINT || undefined,
  ...
});
```

- Nếu biến môi trường `DYNAMODB_ENDPOINT` được set (ví dụ `http://dynamodb-local:8000`) → SDK nối vào **DynamoDB giả lập chạy trong Docker**.
- Nếu **không set** biến này (trường hợp deploy lên AWS thật ở Phase 3) → SDK tự hiểu là phải nối vào DynamoDB thật của AWS theo `region` + credentials khai báo trong AWS CLI/IAM Role.

→ Đây là kỹ thuật "dependency qua biến môi trường" — code không hề biết (và không cần biết) nó đang chạy local hay chạy thật trên cloud.

## 2.3. Kết nối S3 — [`src/lib/s3.js`](../backend/src/lib/s3.js)

Tương tự `dynamo.js`, nhưng thêm `forcePathStyle`: MinIO (bản giả lập S3) cần style URL kiểu `http://minio:9000/ten-bucket/ten-file` thay vì style `ten-bucket.s3.amazonaws.com` mà AWS thật dùng — `S3_FORCE_PATH_STYLE=true` chỉ bật khi chạy local.

## 2.4. API — [`src/routes/pins.js`](../backend/src/routes/pins.js)

3 endpoint:

| Method & path | Việc làm |
|---|---|
| `GET /pins` | `ScanCommand` — đọc toàn bộ item trong bảng DynamoDB, trả về mảng JSON |
| `POST /pins` | Nhận `title`, `description`, `lat`, `lng`, file `photo` (multipart). Nếu có ảnh → `PutObjectCommand` upload lên S3/MinIO trước, lấy được `photoKey`, rồi `PutCommand` ghi cả bản ghi (kèm `photoUrl`) vào DynamoDB |
| `DELETE /pins/:id` | `GetCommand` lấy bản ghi ra để biết `photoKey`, `DeleteCommand` xóa khỏi DynamoDB, rồi `DeleteObjectCommand` xóa luôn ảnh khỏi S3/MinIO |

Lưu ý sư phạm: đây chính là bài "CRUD DynamoDB với Node.js" bạn đã học, áp dụng vào bài toán thật, cộng thêm phần upload ảnh S3.

## 2.5. `src/server.js` — App Express

- `/health` — endpoint kiểm tra sống (dùng cho load balancer/K8s sau này biết container còn sống không).
- `/metrics` — expose số liệu Prometheus (số request, thời gian xử lý...). Sẽ dùng ở Bài 4.
- `app.use("/pins", pinsRouter)` — gắn router.

## 2.6. Test — [`test/pins.test.js`](../backend/test/pins.test.js)

Dùng `aws-sdk-client-mock` để **giả lập** DynamoDB/S3 ngay trong bộ nhớ — test chạy cực nhanh, không cần Docker, không cần mạng. Đây là lý do CI (Bài 5) chạy được `npm test` trên GitHub mà không cần dựng DynamoDB-local/MinIO thật trong workflow.

Đã chạy thử (không cần cài Node lên máy, chạy qua container tạm):

```
docker run --rm -v "<đường-dẫn-thư-mục-backend>:/app" -w /app node:20-alpine sh -c "npm install && npm test"
```

Kết quả: **5/5 test pass** (GET /pins rỗng, GET /pins có dữ liệu, POST thiếu title bị từ chối, POST tạo pin thành công, GET /health).

## 2.7. `src/scripts/setup.js` — khởi tạo hạ tầng

Script này tạo bảng DynamoDB "Pins" và bucket S3 "pinslocal-photos" (kèm policy public-read để ảnh xem được trực tiếp từ trình duyệt) nếu chưa tồn tại. Có cơ chế **retry** (thử lại 10 lần, cách nhau 2 giây) vì khi `docker compose up` khởi động, DynamoDB-local/MinIO có thể chưa kịp sẵn sàng ngay — đây là pattern rất phổ biến khi deploy thật (service phụ thuộc chưa "warm up" xong).

## Tiếp theo

Qua [03-xay-dung-frontend.md](03-xay-dung-frontend.md).
