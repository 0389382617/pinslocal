# Bài 6 — Roadmap Phase 2 → 4 (làm khi có VPS/AWS)

> Từ khó tra ở [00b-bang-thuat-ngu.md](00b-bang-thuat-ngu.md). Bài này liệt kê **việc cần làm trong tương lai** (roadmap), chưa phải hướng dẫn bấm-từng-bước — vì các bước cụ thể phụ thuộc tài khoản/tài nguyên bạn sẽ có sau này, chưa thể viết chi tiết ngay bây giờ.

Phase 1 (MVP — Minimum Viable Product, nghĩa là "bản chạy được tối thiểu, đủ dùng") đã xong và chạy được local (trên máy bạn). Các phase dưới đây **chưa code** (vì cần tài khoản/tài nguyên thật bạn chưa có) — đây là bản kế hoạch chi tiết để làm dần, quay lại nhờ hướng dẫn tiếp khi bạn có từng tài nguyên.

## Phase 2 — Có link online

**Đã hoàn thành theo hướng miễn phí**: xem [Bài 07](07-phase2-mien-phi-cloudflare-tunnel.md) — dùng Cloudflare Tunnel đưa app chạy local ra internet, không cần VPS/domain/thẻ thanh toán. Phần dưới đây mô tả hướng thay thế **có phí** (VPS thật, link cố định 24/7) nếu muốn nâng cấp sau — chi tiết từng bước đã viết ở [Bài 08](08-phase2-vps-tra-phi-terraform.md).

**Chuẩn bị**: mua 1 VPS (DigitalOcean/Contabo/Vultr..., cấu hình tối thiểu 1-2 vCPU/2GB RAM đủ chạy Docker) + 1 domain (Namecheap/GoDaddy/123host...).

Việc cần làm, đúng thứ tự:

1. **Terraform** (`infra/terraform/`): viết file `main.tf` khai báo provider (DigitalOcean/AWS...), resource tạo VPS, output ra địa chỉ IP. Lệnh: `terraform init` → `terraform plan` → `terraform apply`.
2. **Ansible** (`infra/ansible/`): file `inventory.ini` trỏ vào IP VPS vừa tạo, `playbook.yml` cài Docker + docker-compose, clone repo GitHub, chạy `docker compose up -d`. Lệnh: `ansible-playbook -i inventory.ini playbook.yml`.
3. **Domain + SSL**: trỏ bản ghi A của domain về IP VPS, cài Nginx Proxy Manager (hoặc certbot) để có HTTPS miễn phí (Let's Encrypt).
4. **Mở rộng CI thành CD**: thêm job trong `.github/workflows/ci.yml` dùng action `appleboy/ssh-action`, SSH vào VPS chạy `git pull && docker compose pull && docker compose up -d` mỗi khi push vào `main` — hoặc nếu muốn thực hành riêng Jenkins (đã học), dựng 1 Jenkins container trên VPS, tạo Pipeline job làm việc tương tự qua Jenkinsfile.

→ Sau Phase 2: **có link online thật** — đủ điều kiện nộp bài tối thiểu theo yêu cầu khóa học.

## Phase 3 — Chuyển sang AWS thật (cần: tài khoản AWS)

Nhờ Phase 1 đã tách code khỏi hạ tầng qua biến môi trường, việc chuyển sang AWS thật chủ yếu là **đổi cấu hình, không sửa code**:

1. Tạo IAM user/role với quyền vừa đủ (DynamoDB, S3, Lambda, CloudFront) — đúng bài IAM đã học, tránh dùng quyền `*` toàn cục.
2. Tạo bảng DynamoDB thật (console hoặc Terraform), bỏ biến `DYNAMODB_ENDPOINT` khi deploy backend → code tự nối vào DynamoDB thật.
3. Tạo bucket S3 thật, bỏ biến `S3_ENDPOINT`/`S3_FORCE_PATH_STYLE` → code tự nối vào S3 thật. Gắn CloudFront trước bucket S3 để cache ảnh (CDN).
4. Viết 1 Lambda function (Node.js) trigger khi có object mới upload vào S3 → tối ưu/resize ảnh (dùng thư viện `sharp`) → đúng yêu cầu "Lambda để deploy source optimize hình ảnh" trong đề bài PinsLocal gốc.
5. (Tùy chọn) Chuyển backend/frontend từ VPS sang EC2 để bám sát 100% kiến trúc đề bài gốc — nếu VPS ở Phase 2 chạy ổn rồi thì không bắt buộc đổi, tùy bạn muốn thực hành EC2 hay không.

## Phase 4 — Mở rộng vận hành (nâng cao, làm sau khi Phase 2-3 ổn định)

1. **Load Balancer**: chạy 2-3 instance backend, đặt Nginx phía trước làm load balancer (thử cả 4 thuật toán đã học: round robin, weighted, least_conn, ip_hash).
2. **Kubernetes**: dựng cluster (kubeadm, 1 control-plane + 2 worker, đúng bài lab đã học), viết `Deployment`/`Service`/`HPA` cho backend, test rolling update + rollback.
3. **Mailcow**: dựng mail server riêng, gửi email thật khi có pin mới được tạo (thêm 1 đoạn gọi SMTP trong `POST /pins`).
4. **Prometheus AlertManager**: thêm alert rule (vd CPU > 80%, backend down) gửi cảnh báo qua email (Mailcow hoặc Gmail SMTP) — đúng bài AlertManager đã học.

## Gợi ý khi nộp bài

- Video demo nên đi theo đúng thứ tự: mở app qua domain thật (Phase 2) → tạo 1 pin kèm ảnh (chứng minh DynamoDB + S3 hoạt động) → (nếu làm tới Phase 4) show dashboard Grafana đang có traffic thật, show `kubectl rollout` demo rolling update.
- Ghi rõ trong README phần nào dùng công nghệ gì, để giảng viên chấm dễ đối chiếu với khung kỹ năng (SKILL) ở slide khai giảng.
