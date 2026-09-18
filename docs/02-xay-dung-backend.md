# Bài 2 — Backend (Node.js + Express + DynamoDB + S3)

> Bài này giải thích **code**, có dùng thuật ngữ lập trình (function, async, JSON...) — nếu chưa quen lập trình, đọc phần "Lập trình cơ bản" trong [00b-bang-thuat-ngu.md](00b-bang-thuat-ngu.md) trước. Từ khó khác tra cũng ở đó.

Thư mục: [`backend/`](../backend/) (nơi chứa toàn bộ code phần backend). Backend ở đây là 1 chương trình **API** (xem glossary) phục vụ frontend: tạo/xem/xóa "pin" (ghim địa điểm kèm ảnh).

## 2.1. `package.json` — khai báo dependency

Mở [`backend/package.json`](../backend/package.json). Các gói quan trọng:

- `express` — framework viết REST API.
- `@aws-sdk/client-dynamodb` + `@aws-sdk/lib-dynamodb` — SDK chính thức của AWS để thao tác DynamoDB (dùng được cho cả DynamoDB thật lẫn bản giả lập local).
- `@aws-sdk/client-s3` — SDK thao tác S3 (dùng được cho cả S3 thật lẫn MinIO).
- `multer` — đọc file upload từ request `multipart/form-data` (ảnh người dùng gửi lên). **Dùng bản `^2.0.1`** — bản `1.x` từng dùng lúc đầu dính lỗ hổng bảo mật CVE-2025-48997 (gửi 1 request multipart cố tình sai định dạng có thể làm sập cả server) — đã nâng cấp sau đợt rà soát bảo mật, xem [mục 2.4](#24-api--srcroutespinsjs).
- `uuid` — sinh id/tên file ngẫu nhiên. Dùng bản `^11.1.1` (bản `9.x` cũ dính 1 lỗ hổng moderate không ảnh hưởng cách dự án dùng, nhưng nâng cấp cho sạch `npm audit`).
- `prom-client` — sinh số liệu theo chuẩn Prometheus (dùng ở Bài 4 khi bật monitoring).
- `jest` + `supertest` + `aws-sdk-client-mock` — viết test mà không cần chạy DynamoDB/S3 thật (xem mục 2.5).

> Lưu ý build: `Dockerfile` dùng `npm ci` (không phải `npm install`) và copy cả `package-lock.json` — đảm bảo image build ra luôn đúng version đã khóa trong lockfile, không tự ý kéo bản mới hơn. Container cũng chạy bằng user `node` (không phải `root`) — nếu app bị khai thác lỗi, kẻ tấn công không có quyền root ngay trong container.

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
| `GET /pins` | Lặp `ScanCommand` theo `LastEvaluatedKey` cho tới khi hết trang, gộp lại thành 1 mảng JSON — nếu chỉ gọi 1 lần (không lặp), bảng dữ liệu lớn hơn ~1MB sẽ bị DynamoDB âm thầm cắt bớt kết quả |
| `POST /pins` | Validate `title`/`lat`/`lng` chặt (xem dưới), nếu có ảnh → multer lọc qua `fileFilter` (chỉ nhận `image/png,jpeg,webp,gif`) → `PutObjectCommand` upload lên S3/MinIO với key an toàn (`safePhotoKey`) → `PutCommand` ghi bản ghi vào DynamoDB. Nếu bước ghi DynamoDB thất bại **sau khi** ảnh đã upload xong, code tự xóa lại ảnh vừa upload (tránh để lại file "mồ côi" không ai tham chiếu tới) |
| `DELETE /pins/:id` | `GetCommand` lấy bản ghi ra để biết `photoKey` → xóa ảnh khỏi S3/MinIO **trước** → `DeleteCommand` xóa bản ghi DynamoDB sau. Thứ tự này (khác với ban đầu) đảm bảo nếu có lỗi giữa chừng thì thà còn ảnh mồ côi (dọn tay được) còn hơn còn bản ghi trỏ tới ảnh đã mất |

Lưu ý sư phạm: đây chính là bài "CRUD DynamoDB với Node.js" bạn đã học, áp dụng vào bài toán thật, cộng thêm phần upload ảnh S3.

### Validate input (`isFiniteInRange`)

```js
function isFiniteInRange(value, min, max) {
  if (value === "" || value === null || value === undefined) return false;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max;
}
```

3 lớp kiểm tra bắt buộc phải có đủ, thiếu 1 lớp là có bug thật (đã tự bắt được lúc kiểm thử lại):
1. Chặn `""`/`null`/`undefined` tường minh — vì `Number("")` trong JavaScript trả về `0`, không phải `NaN`, nên nếu bỏ qua bước này, gửi `lat=""` sẽ lọt qua và âm thầm tạo pin tại tọa độ `(0,0)` thay vì báo lỗi.
2. `Number.isFinite(n)` — chặn `lat="abc"` (NaN) hoặc `Infinity`.
3. Kiểm tra khoảng giá trị `[-90,90]`/`[-180,180]` — chặn tọa độ vô lý như `lat=999`.

### Lọc loại file upload (`fileFilter`) và sinh key an toàn (`safePhotoKey`)

```js
const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
```

`multer` được cấu hình `fileFilter` chỉ nhận đúng 4 loại ảnh này — trước đây thiếu bước này, ai cũng upload được file bất kỳ (kể cả `.html` chứa mã độc) rồi server trả về URL công khai y như ảnh thật, trình duyệt người xem sẽ chạy nội dung đó (lỗi bảo mật "Unrestricted File Upload").

`safePhotoKey(originalname)` chỉ giữ lại phần đuôi file (`.png`, `.jpg`...) từ tên gốc, còn lại sinh hẳn bằng `uuid()` — **không** còn ghép thẳng tên file người dùng gửi lên vào key S3 như trước. Lý do: tên file gốc có thể chứa ký tự `#`/`?` làm hỏng URL (trình duyệt hiểu nhầm là fragment/query string), hoặc chứa path traversal (`../../`).

## 2.5. `src/server.js` — App Express

- `/health` — endpoint kiểm tra sống (dùng cho load balancer/K8s sau này biết container còn sống không).
- `/metrics` — expose số liệu Prometheus (số request, thời gian xử lý...). Sẽ dùng ở Bài 4.
- `app.use("/pins", pinsRouter)` — gắn router.

### Vì sao label Prometheus dùng `req.route`, không dùng `req.path`

```js
const route = req.route ? `${req.baseUrl}${req.route.path}` : "unmatched";
```

`req.path` là đường dẫn **thực tế** của từng request (vd `/pins/3fae2eab-...`) — mỗi pin có 1 id khác nhau, nên nếu dùng thẳng `req.path` làm nhãn (label) Prometheus, mỗi lần xóa 1 pin khác nhau sẽ sinh ra 1 "time-series" mới, tồn tại vĩnh viễn trong bộ nhớ (Prometheus không tự dọn nhãn cũ) — chạy production đủ lâu là rò rỉ bộ nhớ thật sự. Dùng `req.route.path` (là **khuôn mẫu** route Express đã đăng ký, vd `/pins/:id`) để mọi request cùng loại chỉ tính vào đúng 1 nhãn cố định.

### Error handler phân biệt lỗi client và lỗi server

```js
if (err instanceof multer.MulterError) { ... return res.status(413)... }
if (err.statusCode === 400) { ... return res.status(400)... }
res.status(500).json({ error: "Da co loi xay ra, vui long thu lai sau" });
```

Trước đây mọi lỗi (kể cả người dùng nhập sai, upload ảnh sai định dạng, ảnh quá 5MB) đều trả về `500` kèm message kỹ thuật nội bộ (message gốc của AWS SDK) — vừa sai chuẩn REST (lỗi do client phải là `4xx`, không phải `5xx`), vừa lộ thông tin nội bộ không cần thiết ra ngoài. Giờ: lỗi multer (file quá lớn/sai field) → `413`; lỗi validate của chính route (`err.statusCode = 400`, xem `fileFilter` ở mục 2.4) → `400`; còn lại mới là lỗi server thật → `500` với message chung chung, không lộ chi tiết.

## 2.6. Test — [`test/pins.test.js`](../backend/test/pins.test.js)

Dùng `aws-sdk-client-mock` để **giả lập** DynamoDB/S3 ngay trong bộ nhớ — test chạy cực nhanh, không cần Docker, không cần mạng. Đây là lý do CI (Bài 5) chạy được `npm test` trên GitHub mà không cần dựng DynamoDB-local/MinIO thật trong workflow.

Đã chạy thử (không cần cài Node lên máy, chạy qua container tạm):

```
docker run --rm -v "<đường-dẫn-thư-mục-backend>:/app" -w /app node:20-alpine sh -c "npm install && npm test"
```

Kết quả: **5/5 test pass** (GET /pins rỗng, GET /pins có dữ liệu, POST thiếu title bị từ chối, POST tạo pin thành công, GET /health).

## 2.7. `src/scripts/setup.js` — khởi tạo hạ tầng

Script này tạo bảng DynamoDB "Pins" và bucket S3 "pinslocal-photos" (kèm policy public-read để ảnh xem được trực tiếp từ trình duyệt) nếu chưa tồn tại. Có cơ chế **retry** (thử lại 10 lần, cách nhau 2 giây) vì khi `docker compose up` khởi động, DynamoDB-local/MinIO có thể chưa kịp sẵn sàng ngay — đây là pattern rất phổ biến khi deploy thật (service phụ thuộc chưa "warm up" xong).

## 2.8. "Kết nối" thực chất là gì — và cách tự mắt nhìn thấy nó

### Cơ chế kết nối (không cần đoán, đây là cách hoạt động thật)

Khi chạy `docker compose up`, Docker tự tạo ra **1 mạng nội bộ riêng** cho toàn bộ service trong file (mạng tên `infra_default`) và tự đăng ký "tên service" thành "tên máy" trong mạng đó. Đó là lý do trong `infra/docker-compose.yml`, biến `DYNAMODB_ENDPOINT: http://dynamodb-local:8000` dùng được — chữ `dynamodb-local` ở đây **không phải tên miền internet**, mà là tên container mà Docker tự dịch ra địa chỉ IP nội bộ. Backend và DynamoDB "kết nối" với nhau đơn giản là: backend gửi HTTP request tới `http://dynamodb-local:8000`, Docker route request đó tới đúng container.

Xem bằng mắt (không bắt buộc, chỉ để hiểu):

```
docker network inspect infra_default
```

Kéo xuống mục `"Containers"` — sẽ thấy `backend`, `dynamodb-local`, `minio`... mỗi cái có 1 IP nội bộ riêng, đều nằm chung 1 mạng.

### Cách 1 — Xem dữ liệu DynamoDB bằng giao diện web (không cần gõ lệnh)

Đã thêm sẵn 1 service `dynamodb-admin` vào `infra/docker-compose.yml` — giao diện web để duyệt bảng/dữ liệu DynamoDB-local bằng mắt.

1. Chạy (nếu stack chưa có service này, chạy lại 1 lần):
   ```
   cd infra
   docker compose up -d
   ```
2. Mở trình duyệt: **http://localhost:8001**
3. Trang chủ hiện danh sách bảng — sẽ thấy 1 dòng tên **`Pins`**.
4. Bấm vào chữ **`Pins`** → chuyển sang trang hiển thị toàn bộ item (bản ghi) đang có trong bảng, dạng bảng biểu.
5. Mỗi dòng là 1 pin bạn đã tạo qua app — bấm vào 1 dòng để xem chi tiết từng thuộc tính (`id`, `title`, `lat`, `lng`, `photoKey`, `photoUrl`, `createdAt`) dạng JSON.
6. Có thể bấm nút **Create item** để tự tay thêm 1 bản ghi thẳng vào DynamoDB (không qua app) — thử refresh lại trang http://localhost:3000 sẽ thấy pin đó cũng xuất hiện trên bản đồ, chứng minh app đang đọc đúng từ đây.

> Công cụ này (`aaronshaf/dynamodb-admin`) chỉ thêm cho môi trường **phát triển local** — không đưa vào `docker-compose.prod.yml` vì không có đăng nhập/bảo mật, không nên mở công khai trên internet.

### Cách 2 — Xem ảnh đã upload bằng giao diện MinIO (giả lập S3)

1. Mở trình duyệt: **http://localhost:9001**
2. Đăng nhập: ô **Username** gõ `minioadmin`, ô **Password** gõ `minioadmin` (cấu hình trong `docker-compose.yml`, chỉ dùng cho local) → bấm **Login**.
3. Màn hình chính (**Object Browser**) hiện danh sách bucket → bấm vào **`pinslocal-photos`**.
4. Thấy danh sách file ảnh đã upload (tên dạng `<uuid>.<đuôi-file>`, vd `a1b2c3d4-....png` — cố ý sinh ngẫu nhiên, không giữ tên gốc người dùng upload, để tránh ký tự đặc biệt làm hỏng URL) → bấm vào 1 file → panel bên phải hiện nút **Preview** (xem trước ảnh) và **Download**.
5. Vào tab **Access Policy** (trong màn hình chi tiết bucket, cạnh "Summary") để thấy chính sách **public-read** mà `backend/src/scripts/setup.js` đã tự động thiết lập lúc khởi động — đây là lý do ảnh xem được trực tiếp qua URL mà không cần đăng nhập.

### Cách 3 — Xem trực tiếp qua trình duyệt bằng URL ảnh

Mỗi pin có ảnh trả về trong JSON 1 trường `photoUrl` dạng `http://localhost:9000/pinslocal-photos/<ten-file>` — dán thẳng URL đó vào tab trình duyệt mới cũng xem được ảnh (vì bucket đã public-read), không cần qua giao diện MinIO.

## Tiếp theo

Qua [03-xay-dung-frontend.md](03-xay-dung-frontend.md).
