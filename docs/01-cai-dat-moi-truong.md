# Bài 1 — Cài đặt & kiểm tra môi trường

## Cần cài gì?

| Công cụ | Bắt buộc? | Vì sao |
|---|---|---|
| **Docker Desktop** | Bắt buộc | Chạy toàn bộ app (backend, frontend, database, S3 giả lập) trong container — không cần cài Node.js/database trực tiếp lên máy |
| **Git** | Bắt buộc | Quản lý phiên bản code, đẩy lên GitHub |
| **Node.js** | Không bắt buộc | Chỉ cần nếu bạn muốn chạy `npm install`/sửa code có gợi ý (IntelliSense) ngoài Docker. Mọi lệnh chạy thật đều làm qua Docker nên không bắt buộc cài |
| **Tài khoản GitHub** | Bắt buộc (đã có) | Lưu code, chạy CI/CD |

## Kiểm tra đã cài đúng chưa

Mở terminal (PowerShell hoặc Git Bash) và chạy:

```
docker --version
git --version
```

Kết quả tham khảo từ máy của bạn (đã kiểm tra khi xây dự án này):

```
Docker version 29.6.2, build dfc4efb
git version 2.53.0.windows.3
```

Nếu `docker --version` báo lỗi "not recognized" → cài Docker Desktop tại https://www.docker.com/products/docker-desktop/, khởi động lại máy, mở ứng dụng Docker Desktop lên (phải thấy icon con cá voi chạy ở khay hệ thống) rồi thử lại.

## Vì sao chọn cách này (không cài Node/database trực tiếp)?

Đây chính là tư duy DevOps: **môi trường chạy app phải nhất quán, tái lập được**, không phụ thuộc máy ai đang cài gì. Toàn bộ dependency (Node.js, thư viện, DynamoDB, S3) được đóng gói trong Docker image — máy bạn, máy giảng viên, hay server thật trên VPS/AWS sau này đều chạy y hệt nhau chỉ với 1 lệnh `docker compose up`.

## Tiếp theo

Qua [02-xay-dung-backend.md](02-xay-dung-backend.md) để hiểu code backend đã được viết như thế nào.
