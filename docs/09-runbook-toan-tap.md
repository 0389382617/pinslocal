# Bài 9 — Runbook toàn tập: làm lại từ số 0 đến khi có link online

Tài liệu này gộp **toàn bộ thao tác thực tế** đã làm trong dự án này thành 1 quy trình liền mạch, chi tiết tới từng lệnh gõ / từng nút bấm. Mục tiêu: bạn tự đọc file này là replay lại được toàn bộ, kể cả trên 1 máy trắng hoàn toàn mới.

Các file `docs/01`–`08` giải thích **vì sao** code viết như vậy (kiến trúc, ý nghĩa từng dòng). File này chỉ tập trung **thao tác** — làm gì, gõ gì, bấm đâu. Nên đọc song song, hoặc đọc file này trước để hình dung toàn cảnh, quay lại 01-08 khi cần hiểu sâu.

> Quy ước: các lệnh dưới đây chạy trong **Git Bash** (cài kèm khi cài Git for Windows — nếu dùng terminal PowerShell mặc định của VSCode, bấm mũi tên nhỏ cạnh dấu `+` ở góc phải panel Terminal → chọn "Git Bash"). Đường dẫn kiểu `/e/projects/pinslocal` = `E:\projects\pinslocal` viết theo kiểu Git Bash. Gặp từ khó (terminal là gì, container là gì...) tra ở [00b-bang-thuat-ngu.md](00b-bang-thuat-ngu.md) — file này giả định bạn đã đọc qua [docs/01](01-cai-dat-moi-truong.md) nên không giải thích lại khái niệm cơ bản.

---

## Phần 0 — Bối cảnh (vì sao có dự án này)

Thư mục `E:\GLS document\AWS` chứa 14 file slide PDF của khóa DevOps/AWS (Linux, Docker, K8s, Terraform/Ansible, Jenkins, CI/CD, Load Balancer, Mailcow, Grafana/Prometheus, Cloud AWS). Slide khai giảng yêu cầu bắt buộc 1 **đồ án capstone cuối khóa**, nộp bằng link chạy trên VPS/cloud thật + video demo. Đề bài gần nhất tìm thấy trong slide là **PinsLocal** (app ghim ảnh theo địa điểm), kiến trúc gợi ý: EC2 + S3 + CloudFront + Lambda + DynamoDB.

Vì lúc bắt đầu chỉ có tài khoản GitHub (chưa có AWS/VPS/domain), toàn bộ được chia nhỏ thành **Phase 1 → 4**, làm tới đâu chắc tới đó (chi tiết lộ trình: [docs/00](00-tong-quan-va-lo-trinh.md)).

---

## Phần 1 — Chuẩn bị công cụ

### 1.1. Kiểm tra Docker Desktop và Git đã cài chưa

Mở terminal trong VSCode: menu **Terminal → New Terminal** (hoặc phím tắt `` Ctrl+` ``). Gõ:

```
docker --version
git --version
```

Kết quả đúng trông giống (phiên bản có thể khác):

```
Docker version 29.6.2, build dfc4efb
git version 2.53.0.windows.3
```

- Nếu `docker` báo "not recognized": tải Docker Desktop tại https://www.docker.com/products/docker-desktop/ → chạy file cài đặt → Next/Next theo mặc định → khởi động lại máy nếu được yêu cầu → mở ứng dụng **Docker Desktop** → đợi tới khi icon con cá voi ở khay hệ thống (góc dưới phải màn hình, cạnh đồng hồ) hết chạy xoay và đứng yên.
- Nếu `git` báo "not recognized": tải tại https://git-scm.com/download/win, cài theo mặc định.

### 1.2. Không cần cài Node.js

Toàn bộ lệnh liên quan Node.js (`npm install`, `npm test`...) đều chạy **bên trong container Docker**, không đụng tới máy thật — nên không bắt buộc cài Node.js lên máy.

---

## Phần 2 — Tạo cấu trúc dự án

Toàn bộ code đã có sẵn và đã push lên GitHub tại **https://github.com/0389382617/pinslocal** — nếu cần dựng lại trên máy khác, cách nhanh nhất là clone thẳng:

```
cd /e/projects
git clone https://github.com/0389382617/pinslocal.git
cd pinslocal
```

Cây thư mục hoàn chỉnh:

```
pinslocal/
  backend/                Node.js/Express API + DynamoDB + S3
    src/
      lib/dynamo.js         ket noi DynamoDB (that hoac local)
      lib/s3.js             ket noi S3 (that hoac MinIO)
      routes/pins.js        API: GET/POST/DELETE /pins
      scripts/setup.js      tao bang DynamoDB + bucket S3 luc khoi dong
      server.js             Express app + /health + /metrics
    test/pins.test.js
    Dockerfile
    package.json
  frontend/               React + Vite + Leaflet (ban do)
    src/App.jsx, api.js, components/PinMap.jsx, components/PinForm.jsx
    Dockerfile, nginx.conf
  infra/
    docker-compose.yml               chay Phase 1 (dev, local)
    docker-compose.prod.yml          chay Phase 2 (production, keo image tu ghcr.io)
    docker-compose.local-tunnel.yml  override de chay ban prod ngay tren Windows
    docker-compose.monitoring.yml    them Prometheus/Grafana (tuy chon)
    nginx-proxy/nginx.conf           reverse proxy dung o Phase 2
    prometheus/prometheus.yml
    terraform/                       tao VPS that (Phase 2 tra phi, xem docs/08)
    ansible/                         deploy tu dong len VPS (Phase 2 tra phi)
  .github/workflows/ci.yml           GitHub Actions: test + build + push image
  docs/                              toan bo tai lieu huong dan (dang doc file nay)
  README.md
```

Nếu muốn xem/copy nội dung 1 file cụ thể: mở thẳng trên GitHub, ví dụ backend/server.js tại `https://github.com/0389382617/pinslocal/blob/main/backend/src/server.js`.

---

## Phần 3 — Chạy thử Phase 1 (local, trên máy)

```
cd /e/projects/pinslocal/infra
docker compose up --build -d
```

Đợi khoảng 1-3 phút (lần đầu tải image). Kiểm tra tất cả đã chạy:

```
docker compose ps
```

Phải thấy 5 dòng `dynamodb-local`, `minio`, `dynamodb-admin`, `backend`, `frontend` đều ở trạng thái **Up** (container `init` sẽ hiện "Exited (0)" — đây là **bình thường**, nó chỉ chạy 1 lần để tạo bảng/bucket rồi tự tắt).

### 3.1. Hai lỗi thật đã gặp lúc dựng (đã sửa sẵn trong code, biết trước để tự nhận ra nếu gặp lại)

| Triệu chứng | Nguyên nhân | Cách sửa (đã áp dụng) |
|---|---|---|
| `pull access denied for minio/minio` | Docker Hub giới hạn quyền pull image `minio/minio:latest` | Đổi sang `quay.io/minio/minio:latest` |
| Log `dynamodb-local` báo `SQLiteException: unable to open database file`, container `init` kẹt ở "chưa sẵn sàng" mãi | Lỗi quyền ghi file khi DynamoDB-local ghi ra volume Docker trên Docker Desktop/Windows | Chạy DynamoDB-local ở chế độ `-inMemory` (mất dữ liệu khi restart — chấp nhận được cho môi trường học) |

### 3.2. Mở và thử app

Mở trình duyệt: **http://localhost:3000**

- Click vào bản đồ để chọn 1 vị trí.
- Form bên phải hiện ra → điền **Tên địa điểm**, **Mô tả** (tuỳ chọn), chọn **Ảnh** (tuỳ chọn) → bấm **Lưu pin**.
- Pin mới hiện trên bản đồ dạng marker → click marker → popup hiện tên/mô tả/ảnh + nút **Xóa**.

Kiểm tra bằng lệnh (không cần trình duyệt) nếu muốn:

```
curl http://localhost:4000/health
curl http://localhost:4000/pins
```

**Muốn tự mắt xem dữ liệu vừa tạo nằm ở đâu, kết nối ra sao** (không chỉ tin vào code) — 2 giao diện web đã dựng sẵn:

- **DynamoDB** (bảng `Pins`): mở http://localhost:8001 → bấm vào chữ **Pins** → thấy toàn bộ bản ghi dạng bảng, bấm 1 dòng để xem chi tiết JSON.
- **Ảnh (S3/MinIO)**: mở http://localhost:9001 → đăng nhập `minioadmin` / `minioadmin` → bấm bucket **pinslocal-photos** → thấy từng file ảnh, bấm vào để **Preview**.

Hướng dẫn đầy đủ từng cú click + giải thích cơ chế kết nối (vì sao gõ `dynamodb-local`/`minio` mà backend nối được): [docs/02 mục 2.8](02-xay-dung-backend.md#28-kết-nối-thực-chất-là-gì--và-cách-tự-mắt-nhìn-thấy-nó).

### 3.3. Chạy bộ test tự động

```
MSYS_NO_PATHCONV=1 docker run --rm -v "/e/projects/pinslocal/backend:/app" -w /app node:20-alpine sh -c "npm install && npm test"
```

Kỳ vọng: `Tests: 5 passed, 5 total`.

### 3.4. (Tuỳ chọn) Bật thêm Prometheus + Grafana giám sát

```
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

- Prometheus: http://localhost:9090 → menu **Status → Targets**, cả 2 dòng `pinslocal-backend` và `node-exporter` phải màu xanh "UP".
- Grafana: http://localhost:3001 → đăng nhập `admin` / `admin` (sẽ hỏi đổi mật khẩu, có thể bấm **Skip**) → menu trái **Connections → Data sources → Add data source → Prometheus** → ô "Prometheus server URL" điền `http://prometheus:9090` → cuộn xuống bấm **Save & test**.

Dừng phần monitoring khi không cần: `docker compose -f docker-compose.yml -f docker-compose.monitoring.yml stop grafana prometheus node-exporter`.

### 3.5. Dừng toàn bộ Phase 1

```
docker compose down          # giu volume (du lieu MinIO)
docker compose down -v       # xoa sach, reset tu dau
```

---

## Phần 4 — Đưa code lên GitHub

### 4.1. Tạo repository trên GitHub (thao tác trên trình duyệt)

1. Vào **https://github.com/new** (cần đăng nhập GitHub trước).
2. Ô **Repository name**: gõ `pinslocal`.
3. Chọn **Public** hoặc **Private** (tùy bạn — Public dễ cho giảng viên xem, không cần đăng nhập).
4. **Không tick** ô "Add a README file" (vì local đã có sẵn README, tick vào sẽ gây xung đột khi push).
5. Bấm nút xanh **Create repository** ở cuối trang.
6. Trang tiếp theo GitHub hiện sẵn các lệnh — không cần copy vì bên dưới đã có sẵn.

### 4.2. Đẩy code từ máy lên (chạy trong thư mục `pinslocal/`)

```
cd /e/projects/pinslocal
git init
git add .
git commit -m "Khoi tao du an PinsLocal (Phase 1 MVP)"
git branch -M main
git remote add origin https://github.com/<ten-github-cua-ban>/pinslocal.git
git push -u origin main
```

(Nếu Git hỏi đăng nhập GitHub lần đầu, 1 cửa sổ trình duyệt sẽ tự mở để xác thực — đăng nhập bình thường rồi quay lại terminal.)

### 4.3. Xem CI tự chạy

1. Vào trang repo trên GitHub → tab **Actions** (thanh menu ngang, giữa "Pull requests" và "Projects").
2. Thấy dòng "CI" với biểu tượng: **vòng tròn vàng xoay** = đang chạy, **dấu tick xanh** = pass, **dấu X đỏ** = fail.
3. Bấm vào dòng đó → bấm tiếp vào từng job (`backend-test`, `build-and-push`) → xem log từng bước.

### 4.4. Xem Docker image đã build

Trang GitHub cá nhân → tab **Packages** (hoặc vào thẳng `https://github.com/<ten-github>?tab=packages`) → thấy 2 package `pinslocal/backend` và `pinslocal/frontend`.

### 4.5. Mỗi lần sửa code sau này

```
git add .
git commit -m "Mo ta ngan gon thay doi"
git push
```

→ CI tự chạy lại, tự build lại image mới.

---

## Phần 5 — Đưa app ra internet miễn phí (Cloudflare Tunnel)

Không cần VPS, không cần thẻ thanh toán, không cần tài khoản Cloudflare. Đánh đổi: máy bạn + Docker phải đang bật thì link mới sống.

### 5.1. Chạy bản "giống production" ngay trên máy

```
cd /e/projects/pinslocal/infra
printf "MINIO_ROOT_USER=pinslocal\nMINIO_ROOT_PASSWORD=%s\n" "$(openssl rand -hex 12)" > .env
docker compose -p pinslocal-prod -f docker-compose.prod.yml -f docker-compose.local-tunnel.yml --env-file .env up -d
```

Giải thích các cờ: `-p pinslocal-prod` đặt tên project riêng để không đụng vào stack Phase 1 (dev) đang chạy song song (nếu có); `-f ... -f ...` gộp 2 file compose (file gốc cho production + file override chuyển DynamoDB sang `-inMemory` để chạy được trên Windows); `--env-file .env` nạp mật khẩu MinIO vừa sinh ngẫu nhiên.

Kiểm tra:

```
docker compose -p pinslocal-prod -f docker-compose.prod.yml ps
curl http://localhost/api/pins
```

Mở **http://localhost** — phải thấy đúng app PinsLocal (không cần `:3000` nữa vì giờ tất cả đi qua cổng 80 qua Nginx proxy).

### 5.2. Tải công cụ tạo tunnel (1 file .exe, không cần cài đặt)

```
cd /e/projects/pinslocal
mkdir -p .tools
curl -L -o .tools/cloudflared.exe https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
```

### 5.3. Mở tunnel

```
.tools/cloudflared.exe tunnel --url http://localhost:80
```

**Để cửa sổ terminal này chạy, không đóng lại** — đóng là link chết. Trong log tìm đoạn:

```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
|  https://<vai-tu-ngau-nhien>.trycloudflare.com                                             |
+--------------------------------------------------------------------------------------------+
```

Đó chính là **link online** để dùng/nộp bài. Mở thử link đó trên điện thoại (dùng mạng 4G, không wifi chung nhà) để chắc chắn người khác truy cập được thật, không chỉ máy mình.

### 5.4. Vận hành hàng ngày

- **Muốn dùng lại sau khi tắt máy**: mở lại Docker Desktop → chạy lại lệnh ở mục 5.1 (container cũ tự khởi động lại nếu chưa `down`, hoặc tạo mới nếu đã `down`) → chạy lại lệnh 5.3 → **lấy link mới** (link cũ không dùng lại được).
- **Dừng hẳn**: đóng cửa sổ đang chạy `cloudflared.exe` (Ctrl+C), rồi:
  ```
  cd /e/projects/pinslocal/infra
  docker compose -p pinslocal-prod -f docker-compose.prod.yml -f docker-compose.local-tunnel.yml down
  ```
- **Cập nhật app sau khi sửa code** (đã push GitHub, CI đã build image mới):
  ```
  docker compose -p pinslocal-prod -f docker-compose.prod.yml pull
  docker compose -p pinslocal-prod -f docker-compose.prod.yml -f docker-compose.local-tunnel.yml up -d
  ```

---

## Phần 6 — Khi nào cần làm tiếp, làm gì

| Muốn... | Cần có | Đọc tài liệu |
|---|---|---|
| Link cố định 24/7, không phụ thuộc máy cá nhân | VPS trả phí (~$6/tháng) | [docs/08](08-phase2-vps-tra-phi-terraform.md) — Terraform + Ansible đã viết sẵn |
| Dùng đúng AWS thật (EC2/S3/CloudFront/Lambda/DynamoDB) như đề bài gốc | Tài khoản AWS | [docs/06](06-roadmap-phase-2-den-4.md) mục Phase 3 |
| Load Balancer, Kubernetes, Mailcow, cảnh báo qua email | Nhiều VPS/EC2 | [docs/06](06-roadmap-phase-2-den-4.md) mục Phase 4 |
| Hiểu sâu từng dòng code | — | [docs/02](02-xay-dung-backend.md) (backend), [docs/03](03-xay-dung-frontend.md) (frontend) |

---

## Phụ lục — Toàn bộ lệnh theo đúng thứ tự (copy chạy thẳng trên máy mới)

```bash
# 1. Lay code
cd /e/projects
git clone https://github.com/0389382617/pinslocal.git
cd pinslocal

# 2. Chay thu local (Phase 1)
cd infra
docker compose up --build -d
docker compose ps
# Mo trinh duyet: http://localhost:3000

# 3. Test tu dong
MSYS_NO_PATHCONV=1 docker run --rm -v "/e/projects/pinslocal/backend:/app" -w /app node:20-alpine sh -c "npm install && npm test"

# 4. Dua ra internet mien phi
printf "MINIO_ROOT_USER=pinslocal\nMINIO_ROOT_PASSWORD=%s\n" "$(openssl rand -hex 12)" > .env
docker compose -p pinslocal-prod -f docker-compose.prod.yml -f docker-compose.local-tunnel.yml --env-file .env up -d
cd ..
mkdir -p .tools
curl -L -o .tools/cloudflared.exe https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
.tools/cloudflared.exe tunnel --url http://localhost:80
# Doc log, lay link https://....trycloudflare.com
```
