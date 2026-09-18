# Bài 4 — Chạy toàn bộ hệ thống bằng Docker Compose

> Từ khó (container, image, port, healthcheck...) tra ở [00b-bang-thuat-ngu.md](00b-bang-thuat-ngu.md).

Thư mục: [`infra/`](../infra/) (nơi chứa file mô tả cách chạy/triển khai toàn bộ hệ thống — khác `backend/`, `frontend/` là nơi chứa code app).

## 4.1. Đọc hiểu `docker-compose.yml`

Mở [`infra/docker-compose.yml`](../infra/docker-compose.yml). File này khai báo 6 **service** — mỗi service là 1 chương trình chạy trong 1 container riêng, tất cả được Docker Compose khởi động và nối mạng với nhau cùng lúc:

| Service | Image | Vai trò |
|---|---|---|
| `dynamodb-local` | `amazon/dynamodb-local` | Giả lập DynamoDB, chạy chế độ `-inMemory` (mất dữ liệu khi restart — chấp nhận được vì đây là môi trường học/dev) |
| `minio` | `quay.io/minio/minio` | Giả lập S3, có UI quản lý ở port 9001 |
| `dynamodb-admin` | `aaronshaf/dynamodb-admin` | Giao diện web xem dữ liệu DynamoDB bằng mắt, port 8001 (chỉ dev, không dùng ở production) |
| `init` | build từ `backend/` | Chạy 1 lần (`src/scripts/setup.js`) để tạo bảng + bucket, rồi tự thoát |
| `backend` | build từ `backend/` | API, chỉ khởi động **sau khi** `init` chạy xong thành công (`condition: service_completed_successfully`) |
| `frontend` | build từ `frontend/` | Giao diện web, build với `VITE_API_URL=http://localhost:4000` |

Cách bấm-từng-bước để xem dữ liệu DynamoDB/S3 bằng giao diện web (đăng nhập MinIO, duyệt bucket, duyệt bảng DynamoDB...): xem [docs/02 mục 2.8](02-xay-dung-backend.md#28-kết-nối-thực-chất-là-gì--và-cách-tự-mắt-nhìn-thấy-nó).

> **Bảo mật**: tất cả port ở trên (`8000`, `9000`, `9001`, `8001`, `4000`) đều publish dạng `127.0.0.1:<port>:<port>` — chỉ máy bạn (localhost) mở được, máy khác chung mạng Wi-Fi/LAN không truy cập được, kể cả `dynamodb-admin`/MinIO console vốn không có màn hình đăng nhập bảo vệ. Trước đây các port này publish ra `0.0.0.0` (mọi giao diện mạng) — ai trong cùng mạng cũng vào đọc/sửa/xóa dữ liệu được. Riêng `frontend` (`3000:80`) vẫn để mở bình thường vì đó là giao diện app cần truy cập.

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

3. **`ports are not available: ... bind: Only one usage of each socket address...`** — lỗi này **không phải do code dự án**, mà do 1 chương trình KHÁC trên máy đang chiếm đúng port compose cần dùng (từng gặp thật: 1 tiến trình Python không liên quan đang lắng nghe port 8000 đúng lúc dựng lại stack). Cách xác định thủ phạm trên Windows:
   ```
   netstat -ano | grep ":8000"
   ```
   Cột cuối cùng là PID (số định danh tiến trình) — tra tiếp `tasklist | grep <PID>` (hoặc mở Task Manager, tab Details, tìm đúng PID) để biết chương trình nào đang chiếm cổng, rồi tắt nó đi (hoặc tạm đổi port map trong `docker-compose.yml`, vd `"127.0.0.1:18000:8000"`, nếu không tiện tắt).

## 4.4. Kiểm thử API bằng `curl`

```
curl http://localhost:4000/health
curl http://localhost:4000/pins
curl -X POST http://localhost:4000/pins -F "title=Ho Guom" -F "description=Trung tam Ha Noi" -F "lat=21.0285" -F "lng=105.8542"
```

(Đã chạy thật các lệnh này khi xây dựng — tất cả trả về đúng như mong đợi: tạo pin, list ra pin, ảnh upload lên MinIO đọc được công khai qua `http://localhost:9000/pinslocal-photos/<tên-file>`.)

## 4.5. Mở giao diện

Mở trình duyệt: **http://localhost:3000**

1. Trang hiện bản đồ Hà Nội bên trái, form "Thêm pin mới" bên phải (đang hiện chữ "Nhấp chuột vào bản đồ để chọn vị trí ghim pin mới" vì chưa chọn vị trí nào).
2. Phóng to/thu nhỏ bản đồ: cuộn chuột (scroll) trên bản đồ, hoặc bấm 2 nút **+ / -** ở góc trên-trái bản đồ. Kéo giữ chuột trái để di chuyển bản đồ sang vùng khác.
3. Bấm chuột trái vào đúng 1 điểm trên bản đồ (nơi muốn ghim) → 1 marker tạm thời hiện lên đúng điểm đó, đồng thời form bên phải đổi sang hiện toạ độ + các ô nhập liệu.
4. Điền ô **Tên địa điểm** (bắt buộc), ô **Mô tả** (tuỳ chọn).
5. Ô **Ảnh**: bấm **Choose File** (hoặc "Browse") → cửa sổ duyệt file Windows hiện ra → chọn 1 file ảnh (jpg/png) trên máy → bấm **Open**.
6. Bấm nút **Luu pin** (màu mặc định của trình duyệt, nằm dưới form) → pin thật xuất hiện trên bản đồ đúng vị trí đã chọn, form reset về trống.
7. Bấm vào marker vừa tạo trên bản đồ → 1 popup nhỏ hiện lên: tên, mô tả, ảnh (nếu có), và nút **Xoa** → bấm **Xoa** để xoá pin đó (bản đồ tự cập nhật lại ngay).

> Lưu ý: mình (Claude) không thể tự "nhìn" giao diện trong trình duyệt thật — đã kiểm tra bằng cách gọi thử toàn bộ API và xác nhận frontend trả về đúng HTML/JS (build không lỗi), nhưng **bạn nên tự mở trình duyệt kiểm tra trực quan** (kéo thả, xem bản đồ hiển thị đúng không, ảnh có hiện không) trước khi coi là hoàn thành.

## 4.6. Bật thêm Monitoring (Prometheus/Grafana) — tùy chọn

```
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

**Prometheus** — mở http://localhost:9090:
1. Thanh menu trên cùng → **Status** → chọn **Targets** trong menu sổ xuống.
2. Phải thấy 2 dòng `pinslocal-backend` và `node-exporter`, cột **State** hiện chữ **UP** màu xanh.

**Grafana** — mở http://localhost:3001:
1. Màn hình đăng nhập: ô **Email or username** gõ `admin`, ô **Password** gõ `admin` → bấm **Log in**.
2. Có thể hiện màn hình yêu cầu đổi mật khẩu mới → bấm **Skip** (góc dưới, chữ nhỏ) nếu chỉ dùng để học/demo local.
3. Menu bên trái (icon) → bấm **Connections** → **Data sources** → bấm nút **Add new data source** (góc trên phải, màu xanh).
4. Trong danh sách loại data source, gõ tìm hoặc bấm chọn **Prometheus**.
5. Ở ô **Prometheus server URL** (mục "Connection"), gõ: `http://prometheus:9090` (tên `prometheus` là tên service trong Docker Compose, không phải `localhost` — vì Grafana gọi từ **trong** mạng Docker, không phải từ trình duyệt của bạn).
6. Cuộn xuống cuối trang, bấm nút xanh **Save & test** — phải hiện thông báo xanh "Successfully queried the Prometheus API."
7. Muốn xem biểu đồ có sẵn: menu trái → **Dashboards** → góc phải bấm **New** → **Import** → ô "Find and import dashboards for common applications at grafana.com/dashboards" điền 1 mã ID dashboard có sẵn (ví dụ `1860` cho Node Exporter Full) → bấm **Load** → ở dropdown "Prometheus" chọn đúng data source vừa tạo ở bước 3-6 → bấm **Import**.

Đã kiểm tra: cả 2 target Prometheus đều "UP", Grafana healthcheck (`/api/health`) trả `{"database":"ok"}` — riêng phần click chi tiết trong Grafana UI ở trên mô tả theo giao diện chuẩn Grafana bản mới (đã cài ở dự án này là bản 13.2.2); nếu giao diện hơi khác 1 chút do cập nhật phiên bản, tìm đúng các cụm từ in đậm ở trên (chúng là tên cố định của tính năng, ít khi đổi).

## 4.7. Dừng hệ thống

```
docker compose down          # dừng, giữ lại volume (dữ liệu MinIO)
docker compose down -v       # dừng và xóa sạch volume (reset toàn bộ)
```

## Tiếp theo

Qua [05-ci-voi-github-actions.md](05-ci-voi-github-actions.md) để đẩy code lên GitHub và tự động hóa build/test.
