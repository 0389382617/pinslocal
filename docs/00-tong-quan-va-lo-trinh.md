# Bài 0 — Tổng quan dự án & lộ trình học

> **Đọc trước**: đây là tài liệu viết cho người **chưa biết gì cũng làm theo được**. Gặp bất kỳ từ nào không hiểu (VPS, API, Docker, container...) — mở [00b-bang-thuat-ngu.md](00b-bang-thuat-ngu.md) tra ngay, đừng đoán nghĩa hay bỏ qua.

## Mục tiêu đồ án

Đây là đồ án capstone (bài tập lớn cuối khóa, làm thay cho bài thi) cho khóa DevOps/AWS bạn đang học. **DevOps** là cách làm việc kết hợp giữa viết code (Development) và vận hành hệ thống (Operations) — thay vì lập trình viên chỉ viết code rồi giao cho người khác đem lên server chạy, DevOps là tự mình biết cả 2 việc, dùng công cụ tự động hóa để làm nhanh và ít lỗi hơn. Theo slide khai giảng, điều kiện để được cấp chứng nhận là:

- Nộp **link online** của dự án — nghĩa là dự án phải **chạy thật, ai cũng mở được** qua 1 địa chỉ web, không phải chỉ chạy trên máy bạn.
- Nộp **video demo** (quay màn hình bạn dùng thử app, đăng lên YouTube).
- Điểm project + tổng kết ≥ 7 (thang điểm 10).
- Thời hạn tối đa 45 ngày.

Đề bài gần nhất với "capstone" nằm ở trang cuối slide AWS: dự án mẫu **PinsLocal** — ứng dụng ghim ảnh theo địa điểm (giống việc bạn đánh dấu 1 quán ăn ngon trên bản đồ, kèm ảnh chụp). Kiến trúc gợi ý dùng các dịch vụ của AWS (nhà cung cấp dịch vụ cloud — máy chủ/lưu trữ thuê qua internet, không cần tự mua máy):
- **EC2** = thuê 1 máy chủ ảo để chạy code (Front-end + Back-end, xem glossary).
- **S3** = nơi lưu file/ảnh.
- **CloudFront** = giúp tải ảnh nhanh hơn cho người ở xa (CDN).
- **Lambda** = chạy 1 đoạn code nhỏ tự động khi có sự kiện xảy ra (ở đây: tự nén ảnh khi có ảnh mới upload), không cần giữ 1 máy chủ chạy suốt để làm việc đó.
- **DynamoDB** = nơi lưu dữ liệu có cấu trúc (tên pin, tọa độ...).

Vì bạn hiện **chưa có tài khoản AWS/VPS/domain** (chỉ có tài khoản GitHub — nơi lưu trữ code), chúng ta chia việc thành nhiều **Phase** (giai đoạn), đi từ dễ đến khó, học đến đâu chắc đến đó — không cần biết hết mọi thứ mới bắt đầu được.

## Lộ trình 4 Phase

| Phase | Cần có | Nội dung | Ánh xạ với slide đã học |
|---|---|---|---|
| **1 — MVP (đang làm)** | Chỉ cần máy tính + Docker | Xây app PinsLocal chạy 100% trên máy bạn bằng Docker: backend (phần xử lý logic, chạy bằng Node.js), frontend (giao diện người dùng thấy, chạy bằng React), DynamoDB-local (bản giả lập DynamoDB chạy ngay trên máy, miễn phí), MinIO (bản giả lập S3), CI cơ bản với GitHub Actions (tự động kiểm tra code) | Linux, Docker, CRUD DynamoDB/S3, CI/CD |
| **2 — Có link online** | Không cần gì thêm (miễn phí, [Bài 07](07-phase2-mien-phi-cloudflare-tunnel.md)) **hoặc** Tài khoản VPS + domain (có phí, [Bài 08](08-phase2-vps-tra-phi-terraform.md)) | (a) Đã làm: dùng Cloudflare Tunnel đưa app đang chạy trên máy bạn ra internet miễn phí; (b) Tùy chọn: Terraform tạo VPS thật, Ansible tự động cài đặt lên đó, gắn domain + SSL cho link cố định 24/7 | Terraform, Ansible, Jenkins/CI-CD |
| **3 — Chuyển sang AWS thật** | Tài khoản AWS | Đổi DynamoDB-local/MinIO (bản giả lập) sang DynamoDB/S3 thật của AWS, thêm CloudFront, viết Lambda tối ưu ảnh, có thể chuyển sang EC2 | Cloud AWS (IAM, EC2, S3, CloudFront, Lambda, DynamoDB) |
| **4 — Mở rộng vận hành** | Nhiều VPS/EC2 | Chạy nhiều bản backend giống nhau sau 1 Load Balancer (bộ chia tải), chuyển sang Kubernetes (công cụ tự động quản lý nhiều container), thêm Mailcow (mail server riêng) gửi mail, Prometheus + AlertManager cảnh báo khi có sự cố | Load Balancer, K8s, Mailcow, Grafana/Prometheus |

**Nguyên tắc quan trọng**: code Phase 1 được viết sao cho khi lên Phase 2-3, bạn **không phải viết lại code**, chỉ đổi biến môi trường (environment variable — 1 kiểu "cài đặt" mà code đọc lúc khởi động, xem glossary, ví dụ địa chỉ để nối vào DynamoDB). Đây chính là cách làm DevOps thật sự — tách code khỏi hạ tầng.

## Kiến trúc Phase 1 (đang xây)

```
Trình duyệt (Chrome/Edge trên máy bạn)
    |
    v
 frontend (giao diện web, chạy port 3000)
    |  gọi API (xin dữ liệu qua internet nội bộ)
    v
 backend (xử lý logic, chạy port 4000)
    |                    |
    v                    v
dynamodb-local        minio (gia lap S3, luu anh)
(luu du lieu pin)     (port 9000/9001)
(port 8000)
```

Đọc sơ đồ này: mở trình duyệt vào `frontend` (bạn thấy bản đồ, form nhập liệu) → khi bạn thao tác (thêm pin), frontend gửi yêu cầu qua mạng nội bộ tới `backend` → `backend` đọc/ghi dữ liệu chữ vào `dynamodb-local`, đọc/ghi file ảnh vào `minio`. "Port" (cổng, xem glossary) là con số phân biệt từng chương trình đang chạy trên cùng 1 máy.

> Muốn xem gộp **toàn bộ thao tác** (từng lệnh, từng cú click) thành 1 quy trình liền mạch từ số 0 → có link online? Đọc thẳng [09-runbook-toan-tap.md](09-runbook-toan-tap.md).

## Đọc tiếp theo thứ tự

0. [00b-bang-thuat-ngu.md](00b-bang-thuat-ngu.md) — **tra cứu** khi gặp từ khó, không cần đọc hết 1 lượt trước
1. [01-cai-dat-moi-truong.md](01-cai-dat-moi-truong.md) — kiểm tra công cụ đã cài
2. [02-xay-dung-backend.md](02-xay-dung-backend.md) — giải thích code backend
3. [03-xay-dung-frontend.md](03-xay-dung-frontend.md) — giải thích code frontend
4. [04-docker-hoa-va-chay-local.md](04-docker-hoa-va-chay-local.md) — chạy toàn bộ bằng Docker
5. [05-ci-voi-github-actions.md](05-ci-voi-github-actions.md) — đẩy code lên GitHub, xem CI chạy
6. [06-roadmap-phase-2-den-4.md](06-roadmap-phase-2-den-4.md) — việc cần làm khi có VPS/AWS
7. [07-phase2-mien-phi-cloudflare-tunnel.md](07-phase2-mien-phi-cloudflare-tunnel.md) — **đã làm**: đưa app ra internet miễn phí bằng Cloudflare Tunnel (không cần VPS/thẻ)
8. [08-phase2-vps-tra-phi-terraform.md](08-phase2-vps-tra-phi-terraform.md) — phương án thay thế (có phí): VPS thật bằng Terraform + Ansible
