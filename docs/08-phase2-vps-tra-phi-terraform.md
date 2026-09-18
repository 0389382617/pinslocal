# Bài 8 — Phase 2 (tùy chọn, trả phí): Lên VPS thật bằng Terraform + Ansible

> Đây là phương án **thay thế** cho [Bài 07](07-phase2-mien-phi-cloudflare-tunnel.md) — dùng khi bạn sẵn sàng trả vài USD/tháng để có 1 VPS thật (ổn định 24/7, không phụ thuộc máy cá nhân phải bật). Nếu đang ưu tiên $0, cứ dùng Bài 07, quay lại đây sau.

Code đã chuẩn bị sẵn và đã kiểm tra cú pháp (`terraform validate` pass, `ansible-playbook --syntax-check` pass). Phần còn lại cần **bạn** thực hiện vì liên quan tài khoản/thanh toán thật.

## Kiến trúc Phase 2

```
Internet
   |
   v
 Nginx "proxy" (port 80)  <-- container moi, gop 3 thu lam 1 dia chi
   |         |          |
   v         v          v
frontend   backend    minio (qua /photos/)
(tinh)   (qua /api/)
             |      |
             v      v
       dynamodb-local (luu file that, khong con -inMemory)
```

So với Phase 1: frontend gọi API qua đường dẫn tương đối `/api/...` (không phải `http://localhost:4000` nữa) — vì trên VPS, tất cả đi qua chung 1 cổng 80 do Nginx "proxy" phân luồng. Nhờ vậy sau này gắn domain/SSL chỉ cần sửa 1 chỗ.

File liên quan: [`infra/docker-compose.prod.yml`](../infra/docker-compose.prod.yml), [`infra/nginx-proxy/nginx.conf`](../infra/nginx-proxy/nginx.conf), [`infra/terraform/`](../infra/terraform/), [`infra/ansible/`](../infra/ansible/).

## Bước 1 — Tạo tài khoản DigitalOcean + API token

1. Vào https://cloud.digitalocean.com/registrations/new, đăng ký tài khoản (thường có gói credit dùng thử cho tài khoản mới).
2. Thêm phương thức thanh toán (bắt buộc để tạo VPS).
3. Vào **API** (menu trái) → **Generate New Token** → đặt tên `pinslocal-terraform` → quyền **Read and Write** → Generate Token.
4. **Copy token ngay** (chỉ hiển thị 1 lần duy nhất).

> Token này tương đương mật khẩu tài khoản — không dán vào nơi công khai (GitHub, chat công khai...). Trong dự án này, token sẽ được lưu trong file `infra/terraform/terraform.tfvars` — file này đã nằm trong `.gitignore`, không bao giờ bị commit lên GitHub.

## Bước 2 — Điền token vào Terraform

```
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
```

Mở `terraform.tfvars` vừa tạo, thay dòng `do_token = "..."` bằng token thật.

## Bước 3 — Xem trước những gì sẽ được tạo (chưa tốn phí)

```
docker run --rm -v "$(pwd):/workspace" -w /workspace hashicorp/terraform:latest plan
```

Lệnh này chỉ **mô phỏng**, chưa tạo gì thật, chưa tốn tiền — đọc kỹ output để hiểu Terraform sắp tạo: 1 SSH key + 1 Droplet (VPS) cấu hình `s-1vcpu-1gb` tại Singapore.

## Bước 4 — Tạo VPS thật (bắt đầu tốn phí — droplet 1CPU/1GB ~ $6/tháng, tính theo giờ)

```
docker run --rm -v "$(pwd):/workspace" -w /workspace hashicorp/terraform:latest apply
```

Gõ `yes` khi được hỏi xác nhận. Sau khi chạy xong, Terraform in ra `droplet_ip = "..."` — đây là địa chỉ IP VPS của bạn.

## Bước 5 — Cấu hình Ansible trỏ vào VPS

```
cd ../ansible
cp inventory.ini.example inventory.ini
```

Sửa `inventory.ini`, thay `<IP_DROPLET>` bằng IP thật vừa có ở Bước 4.

## Bước 6 — Chạy Ansible để cài Docker + deploy app

```
docker run --rm -v "$(pwd):/workspace" -w /workspace alpine:3.20 sh -c \
  "apk add --no-cache ansible openssh-client && ansible-playbook playbook.yml"
```

Playbook sẽ: cài Docker trên VPS, tạo `/opt/pinslocal`, sinh mật khẩu MinIO ngẫu nhiên, copy `docker-compose.prod.yml` + cấu hình Nginx, `docker compose pull` (kéo image đã build sẵn ở Bài 5 từ ghcr.io) rồi `docker compose up -d`.

## Bước 7 — Kiểm tra

Mở trình duyệt: `http://<IP_DROPLET>` — phải thấy đúng giao diện PinsLocal, thêm được pin kèm ảnh y hệt lúc chạy local ở Phase 1.

## Bước 8 — Domain + SSL (làm khi có domain)

1. Mua domain, vào DNS setting, tạo bản ghi **A** trỏ `@` (hoặc subdomain) về `<IP_DROPLET>`.
2. Cách đơn giản nhất: cài thêm **Nginx Proxy Manager** hoặc dùng `certbot` xin chứng chỉ Let's Encrypt cho domain, đặt nó đứng trước service `proxy` hiện tại (hoặc thay thế `proxy` bằng Nginx Proxy Manager, trỏ vào backend/frontend/minio y như file `nginx-proxy/nginx.conf` đang làm).
3. Sau khi có domain + SSL, đây chính là **"link online"** cần nộp theo yêu cầu khóa học.

## Bước 9 — Biến CI thành CD (tự động deploy khi push code)

Thêm job vào `.github/workflows/ci.yml`, dùng action `appleboy/ssh-action`, SSH vào VPS chạy `docker compose pull && docker compose up -d` mỗi khi có image mới — cần thêm 2 secret vào GitHub repo (Settings → Secrets → Actions): `VPS_HOST` (IP) và `VPS_SSH_KEY` (nội dung file private key `~/.ssh/pinslocal_deploy`). Sẽ hướng dẫn chi tiết khi bạn tới bước này.

## Dọn dẹp (nếu muốn dừng, tránh phát sinh phí)

```
cd infra/terraform
docker run --rm -v "$(pwd):/workspace" -w /workspace hashicorp/terraform:latest destroy
```

Lệnh này **xóa hẳn VPS** — chỉ chạy khi thực sự muốn dừng hẳn, không thể hoàn tác.
