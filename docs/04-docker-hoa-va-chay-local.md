# Bài 4 — Chạy toàn bộ hệ thống bằng Docker Compose

Thư mục: [`infra/`](../infra/).

## 4.1. Đọc hiểu `docker-compose.yml`

Mở [`infra/docker-compose.yml`](../infra/docker-compose.yml). 6 service:

| Service | Image | Vai trò |
|---|---|---|
| `dynamodb-local` | `amazon/dynamodb-local` | Giả lập DynamoDB, chạy chế độ `-inMemory` (mất dữ liệu khi restart — chấp nhận được vì đây là môi trường học/dev) |
| `minio` | `quay.io/minio/minio` | Giả lập S3, có UI quản lý ở port 9001 |
| `dynamodb-admin` | `aaronshaf/dynamodb-admin` | Giao diện web xem dữ liệu DynamoDB bằng mắt, port 8001 (chỉ dev, không dùng ở production) |
| `init` | build từ `backend/` | Chạy 1 lần (`src/scripts/setup.js`) để tạo bảng + bucket, rồi tự thoát |
| `backend` | build từ `backend/` | API, chỉ khởi động **sau khi** `init` chạy xong thành công (`condition: service_completed_successfully`) |
| `frontend` | build từ `frontend/` | Giao diện web, build với `VITE_API_URL=http://localhost:4000` |

Cách bấm-từng-bước để xem dữ liệu DynamoDB/S3 bằng giao diện web (đăng nhập MinIO, duyệt bucket, duyệt bảng DynamoDB...): xem [docs/02 mục 2.8](02-xay-dung-backend.md#28-kết-nối-thực-chất-là-gì--và-cách-tự-mắt-nhìn-thấy-nó).

`environment: &backend-env ... <<: *backend-env` là **YAML anchor** — khai báo 1 lần bộ biến môi trường dùng chung cho `init` và `backend`, tránh lặp code.

## 4.2. Chạy thử

```
cd infra
docker compose up --build -d
```

Kiểm tra tất cả đã "Up":

```
docker compose ps
```

## 4.3. Hai lỗi thực tế đã gặp khi dựng bài này (và cách sửa — để bạn hiểu, không chỉ copy-paste)

Khi build lần đầu, mình (Claude) đã gặp đúng 2 lỗi hạ tầng kinh điển — biết trước sẽ giúp bạn tự debug khi gặp lại:

1. **`pull access denied for minio/minio`** — Docker Hub đã giới hạn quyền pull ảnh `minio/minio:latest` (cần đăng nhập). Cách sửa: dùng registry chính thức thay thế `quay.io/minio/minio:latest` (đã áp dụng sẵn trong compose file). Bài học: **image công khai có thể đổi chính sách phân phối theo thời gian** — luôn có phương án registry dự phòng.

2. **DynamoDB-local báo lỗi `SQLiteException: unable to open database file`** — do mount volume Docker vào `-dbPath /data` bị lỗi quyền ghi trên Docker Desktop (Windows). Cách sửa: chạy DynamoDB-local ở chế độ `-inMemory` thay vì ghi file — phù hợp môi trường học tập vì không cần giữ dữ liệu qua các lần restart.

## 4.4. Kiểm thử API bằng `curl`

```
curl http://localhost:4000/health
curl http://localhost:4000/pins
curl -X POST http://localhost:4000/pins -F "title=Ho Guom" -F "description=Trung tam Ha Noi" -F "lat=21.0285" -F "lng=105.8542"
```

(Đã chạy thật các lệnh này khi xây dựng — tất cả trả về đúng như mong đợi: tạo pin, list ra pin, ảnh upload lên MinIO đọc được công khai qua `http://localhost:9000/pinslocal-photos/<tên-file>`.)

## 4.5. Mở giao diện

Mở trình duyệt: **http://localhost:3000**

- Click vào bản đồ để chọn vị trí → điền form bên phải → **Lưu pin**.
- Pin xuất hiện trên bản đồ, click vào marker để xem chi tiết/xóa.

> Lưu ý: mình (Claude) không thể tự "nhìn" giao diện trong trình duyệt thật — đã kiểm tra bằng cách gọi thử toàn bộ API và xác nhận frontend trả về đúng HTML/JS (build không lỗi), nhưng **bạn nên tự mở trình duyệt kiểm tra trực quan** (kéo thả, xem bản đồ hiển thị đúng không, ảnh có hiện không) trước khi coi là hoàn thành.

## 4.6. Bật thêm Monitoring (Prometheus/Grafana) — tùy chọn

```
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

- Prometheus: http://localhost:9090 (mục Status → Targets phải thấy `pinslocal-backend` và `node-exporter` ở trạng thái "UP")
- Grafana: http://localhost:3001 (đăng nhập `admin`/`admin`) → Add data source → Prometheus → URL `http://prometheus:9090` → Save & Test → Import dashboard theo ID có sẵn trên grafana.com (đúng thao tác đã học ở slide Grafana/Prometheus).

Đã kiểm tra: cả 2 target đều "UP", Grafana healthcheck trả `{"database":"ok"}`.

## 4.7. Dừng hệ thống

```
docker compose down          # dừng, giữ lại volume (dữ liệu MinIO)
docker compose down -v       # dừng và xóa sạch volume (reset toàn bộ)
```

## Tiếp theo

Qua [05-ci-voi-github-actions.md](05-ci-voi-github-actions.md) để đẩy code lên GitHub và tự động hóa build/test.
