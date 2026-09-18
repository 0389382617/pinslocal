# PinsLocal

Ứng dụng ghim ảnh theo địa điểm (đồ án capstone khóa DevOps/AWS) — người dùng chọn 1 điểm trên bản đồ, đặt tên, mô tả, đính kèm ảnh; các pin hiển thị lại trên bản đồ chung.

Đây là **Phase 1 (MVP)**: chạy hoàn toàn trên máy bằng Docker, không cần tài khoản AWS/VPS/domain. Dùng đúng API sẽ dùng ở bản triển khai thật (DynamoDB, S3) nhưng trỏ vào bản giả lập chạy local (`dynamodb-local`, `minio`) — khi có tài khoản AWS thật chỉ cần đổi biến môi trường, không sửa code.

Đọc theo thứ tự trong [`docs/`](docs/00-tong-quan-va-lo-trinh.md) để vừa học vừa làm theo từng bước, hoặc đọc thẳng **[docs/09-runbook-toan-tap.md](docs/09-runbook-toan-tap.md)** để có quy trình đầy đủ từ số 0 đến khi có link online, chi tiết từng lệnh/từng nút bấm. Tài liệu viết cho người **chưa biết gì cũng làm theo được** — gặp từ khó, tra [docs/00b-bang-thuat-ngu.md](docs/00b-bang-thuat-ngu.md).

## Chạy nhanh

```
cd infra
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- MinIO console: http://localhost:9001 (user/pass: minioadmin/minioadmin)

## Cấu trúc

```
backend/   API Node.js/Express + DynamoDB + S3
frontend/  Giao diện React + Leaflet (bản đồ)
infra/     docker-compose, cấu hình Prometheus
docs/      Hướng dẫn từng bước (giảng viên)
```
