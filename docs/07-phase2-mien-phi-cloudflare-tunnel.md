# Bài 7 — Phase 2 (miễn phí): Đưa app ra internet bằng Cloudflare Tunnel

Không cần VPS, không cần thẻ thanh toán, không cần tài khoản Cloudflare. Đánh đổi: **máy bạn + Docker phải đang chạy thì link mới sống** — khác với VPS thật (luôn online 24/7 dù bạn tắt máy). Phù hợp giai đoạn học/demo; khi cần link ổn định lâu dài, xem [Bài 08](08-phase2-vps-tra-phi-terraform.md) (có phí).

## Ý tưởng

Ở Phase 1, frontend gọi thẳng `http://localhost:4000` — chỉ máy bạn hiểu được `localhost` là chính nó, người khác mở link sẽ lỗi vì `localhost` với họ là **máy của họ**. Cloudflare Tunnel không sửa được điều đó — nên bước đầu tiên là gộp frontend+backend+ảnh sau **1 cổng duy nhất** (dùng đúng file `docker-compose.prod.yml` + `nginx-proxy/` đã viết sẵn cho Phase 2 thật), rồi mới "xuyên" cổng đó ra internet.

```
Internet --(Cloudflare Tunnel, mien phi)--> may ban: port 80 (Nginx proxy) --> frontend/backend/minio
```

## Đã thực hiện (bạn có thể tự lặp lại)

1. **Thêm 1 file override** [`infra/docker-compose.local-tunnel.yml`](../infra/docker-compose.local-tunnel.yml): chỉ đổi DynamoDB-local sang chế độ `-inMemory` (vì chạy trên Windows/Docker Desktop bị lỗi quyền ghi file SQLite — đã gặp lỗi này ở Phase 1). File `docker-compose.prod.yml` gốc **không đổi** — trên VPS Linux thật ở Bài 08, dùng nguyên bản (lưu dữ liệu bền vững).

2. **Tạo `.env` cục bộ** (`infra/.env`, đã gitignore) chứa mật khẩu MinIO ngẫu nhiên.

3. **Chạy stack "giống hệt production" ngay trên máy**, dùng tên project riêng để không đụng tới stack dev (Phase 1) đang chạy song song:

   ```
   cd infra
   docker compose -p pinslocal-prod -f docker-compose.prod.yml -f docker-compose.local-tunnel.yml --env-file .env up -d
   ```

4. **Tải `cloudflared`** (công cụ tạo tunnel, không cần cài đặt, chỉ 1 file .exe):

   ```
   curl -L -o .tools/cloudflared.exe https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
   ```

5. **Mở tunnel** trỏ vào port 80:

   ```
   .tools/cloudflared.exe tunnel --url http://localhost:80
   ```

   Log in ra 1 link dạng `https://<vai-tu-ngau-nhien>.trycloudflare.com` — **đây chính là "link online" để nộp bài**.

Đã kiểm tra thật: mở link → frontend load được (200), gọi `/api/pins` trả JSON đúng, tạo pin kèm ảnh qua `/api/pins` thành công, ảnh xem được qua `/photos/...` — toàn bộ hoạt động y hệt lúc test qua `localhost` ở Phase 1, chỉ khác là giờ ai cũng mở được, không riêng máy bạn.

## Lưu ý quan trọng khi dùng và khi nộp bài

- **Link này KHÔNG cố định** — mỗi lần chạy lại lệnh `cloudflared tunnel` sẽ ra 1 link mới (vì không đăng nhập tài khoản Cloudflare, đây là "Quick Tunnel" ẩn danh). Muốn giữ nguyên link, **đừng tắt** cửa sổ terminal đang chạy `cloudflared` và đừng tắt Docker.
- Trước khi quay video demo hoặc nộp link, kiểm tra lại đúng link hiện tại đang chạy (đọc log `cloudflared`, hoặc mở [`E:\projects\pinslocal\infra`](../infra) chạy lại nếu cần).
- Đây là giải pháp học/demo, **không phải kiến trúc triển khai chuẩn production** (không có SLA, Cloudflare có thể giới hạn tốc độ với tunnel ẩn danh). Nếu muốn 1 link cố định chạy 24/7 độc lập với máy cá nhân — làm tiếp Bài 08 khi sẵn sàng chi trả.
- Muốn dừng: đóng cửa sổ đang chạy `cloudflared.exe`, và `docker compose -p pinslocal-prod -f docker-compose.prod.yml -f docker-compose.local-tunnel.yml down` để tắt stack.

## Việc cần làm để hoàn thiện Phase 2 kể cả khi chưa có VPS

- **CD tự động**: vì app đang chạy bằng image kéo từ `ghcr.io` (Bài 5 build sẵn), mỗi khi muốn cập nhật bản mới nhất, chỉ cần `docker compose -p pinslocal-prod ... pull && ... up -d` — không cần build lại.
- **Domain/SSL**: Quick Tunnel đã tự có HTTPS sẵn (`https://...trycloudflare.com`), không cần tự làm SSL như hướng VPS.
