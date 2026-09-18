# Bài 0 — Tổng quan dự án & lộ trình học

## Mục tiêu đồ án

Đây là đồ án capstone cho khóa DevOps/AWS bạn đang học. Theo slide khai giảng, điều kiện để được cấp chứng nhận là:

- Nộp **link online** của dự án chạy trên VPS/cloud thật.
- Nộp **video demo** (YouTube).
- Điểm project + tổng kết ≥ 7.
- Thời hạn tối đa 45 ngày.

Đề bài gần nhất với "capstone" nằm ở trang cuối slide AWS: dự án mẫu **PinsLocal** — ứng dụng ghim ảnh theo địa điểm, kiến trúc gợi ý gồm EC2 (Front-end + Back-end), S3 (lưu ảnh), CloudFront (CDN), Lambda (tối ưu ảnh), DynamoDB (database).

Vì bạn hiện **chưa có tài khoản AWS/VPS/domain** (chỉ có GitHub), chúng ta chia việc thành nhiều **Phase**, đi từ dễ đến khó, học đến đâu chắc đến đó:

## Lộ trình 4 Phase

| Phase | Cần có | Nội dung | Ánh xạ với slide đã học |
|---|---|---|---|
| **1 — MVP (đang làm)** | Chỉ cần máy tính + Docker | Xây app PinsLocal chạy 100% local bằng Docker: backend Node.js, frontend React, DynamoDB-local, MinIO (giả lập S3), CI cơ bản với GitHub Actions | Linux, Docker, CRUD DynamoDB/S3, CI/CD |
| **2 — Lên VPS thật** | Tài khoản VPS (DigitalOcean...) + domain | Terraform tạo VPS, Ansible cài đặt & deploy tự động, gắn domain + SSL, CI mở rộng thành CD tự động deploy | Terraform, Ansible, Jenkins/CI-CD |
| **3 — Chuyển sang AWS thật** | Tài khoản AWS | Đổi DynamoDB-local/MinIO sang DynamoDB/S3 thật, thêm CloudFront, viết Lambda tối ưu ảnh, có thể chuyển sang EC2 | Cloud AWS (IAM, EC2, S3, CloudFront, Lambda, DynamoDB) |
| **4 — Mở rộng vận hành** | Nhiều VPS/EC2 | Nhiều backend chạy sau Nginx Load Balancer, chuyển sang Kubernetes (Deployment/HPA/rolling update), thêm Mailcow gửi mail, Prometheus AlertManager cảnh báo | Load Balancer, K8s, Mailcow, Grafana/Prometheus |

**Nguyên tắc quan trọng**: code Phase 1 được viết sao cho khi lên Phase 2-3, bạn **không phải viết lại code**, chỉ đổi biến môi trường (endpoint DynamoDB/S3). Đây chính là cách làm DevOps thật sự — tách code khỏi hạ tầng.

## Kiến trúc Phase 1 (đang xây)

```
Trình duyệt
    |
    v
 frontend (React + Leaflet, Nginx, port 3000)
    |  gọi API
    v
 backend (Node.js/Express, port 4000)
    |                    |
    v                    v
dynamodb-local        minio (gia lap S3)
(port 8000)           (port 9000/9001)
```

> Muốn xem gộp **toàn bộ thao tác** (từng lệnh, từng cú click) thành 1 quy trình liền mạch từ số 0 → có link online? Đọc thẳng [09-runbook-toan-tap.md](09-runbook-toan-tap.md).

## Đọc tiếp theo thứ tự

1. [01-cai-dat-moi-truong.md](01-cai-dat-moi-truong.md) — kiểm tra công cụ đã cài
2. [02-xay-dung-backend.md](02-xay-dung-backend.md) — giải thích code backend
3. [03-xay-dung-frontend.md](03-xay-dung-frontend.md) — giải thích code frontend
4. [04-docker-hoa-va-chay-local.md](04-docker-hoa-va-chay-local.md) — chạy toàn bộ bằng Docker
5. [05-ci-voi-github-actions.md](05-ci-voi-github-actions.md) — đẩy code lên GitHub, xem CI chạy
6. [06-roadmap-phase-2-den-4.md](06-roadmap-phase-2-den-4.md) — việc cần làm khi có VPS/AWS
7. [07-phase2-mien-phi-cloudflare-tunnel.md](07-phase2-mien-phi-cloudflare-tunnel.md) — **đã làm**: đưa app ra internet miễn phí bằng Cloudflare Tunnel (không cần VPS/thẻ)
8. [08-phase2-vps-tra-phi-terraform.md](08-phase2-vps-tra-phi-terraform.md) — phương án thay thế (có phí): VPS thật bằng Terraform + Ansible
