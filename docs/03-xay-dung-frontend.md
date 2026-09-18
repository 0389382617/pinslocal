# Bài 3 — Frontend (React + Vite + Leaflet)

> Bài này giải thích **code giao diện**, dùng thuật ngữ lập trình — chưa quen thì đọc phần "Lập trình cơ bản" trong [00b-bang-thuat-ngu.md](00b-bang-thuat-ngu.md) trước.

Thư mục: [`frontend/`](../frontend/) (nơi chứa toàn bộ code phần giao diện — thứ người dùng thật sự nhìn thấy và bấm vào trong trình duyệt).

## 3.1. Vì sao chọn Vite + React + Leaflet?

- **React**: thư viện JavaScript để viết giao diện theo kiểu "chia nhỏ thành từng khối lắp ráp" gọi là **component** (ví dụ `PinMap`, `PinForm` — mỗi cái là 1 khối giao diện riêng, có thể tái sử dụng), thay vì viết 1 trang HTML dài lê thê.
- **Vite**: công cụ build frontend hiện đại, khởi động cực nhanh, output ra file HTML/CSS/JS tĩnh — dễ deploy sau Nginx (hoặc S3+CloudFront ở Phase 3).
- **Leaflet + OpenStreetMap**: thư viện bản đồ mã nguồn mở, **miễn phí, không cần API key** — phù hợp giai đoạn học, tránh phải đăng ký thêm tài khoản Google Maps.

> CSS và icon marker của Leaflet được **import thẳng trong code** (`main.jsx` import `leaflet/dist/leaflet.css`, `PinMap.jsx` import icon từ `leaflet/dist/images/...`) để Vite đóng gói chung vào image — lúc đầu dự án tải các file này từ CDN `unpkg.com` lúc chạy, nhưng nếu mạng chặn/CDN sập thì bản đồ vỡ layout hoàn toàn dù JS chính vẫn chạy. Giờ image tự chứa mọi thứ, không phụ thuộc dịch vụ ngoài lúc chạy.

## 3.2. `src/api.js` — gọi backend

```js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
```

`VITE_API_URL` được "nướng" (bake) vào file JS tĩnh **tại thời điểm build** (xem `frontend/Dockerfile`, build-arg). Đây là điểm khác biệt quan trọng so với backend: biến môi trường của frontend phải có **trước khi build**, vì sau khi build ra file tĩnh thì không đọc biến môi trường lúc chạy được nữa (khác với backend, đọc `process.env` lúc server đang chạy).

3 hàm: `listPins()` (GET), `createPin()` (POST multipart, dùng `FormData` để gửi kèm file ảnh), `deletePin()` (DELETE).

## 3.3. `src/components/PinMap.jsx` — bản đồ

- `MapContainer` từ `react-leaflet`, tâm bản đồ đặt ở Hà Nội (đổi `HANOI_CENTER` nếu muốn).
- `ClickHandler` dùng hook `useMapEvents` — bắt sự kiện click vào bản đồ để lấy tọa độ `lat/lng` cho pin mới.
- Mỗi pin hiển thị `Marker` + `Popup` (tên, mô tả, ảnh nếu có, nút Xóa).
- Nút Xóa nhận thêm prop `deletingId` từ `App.jsx`: khi đúng pin đang được xóa (`deletingId === pin.id`), nút tự disable và đổi chữ thành "Dang xoa..." — tránh bấm nhiều lần liên tiếp tạo ra nhiều request xóa chồng chéo lên cùng 1 pin.

## 3.4. `src/components/PinForm.jsx` — form thêm pin

Form: tên, mô tả, chọn ảnh (`<input type="file">`, giới hạn `accept` chỉ các định dạng ảnh backend chấp nhận). Chỉ hiện ra sau khi người dùng đã click chọn vị trí trên bản đồ (`latLng` truyền từ `App.jsx`).

`handleSubmit` là **async** và có `try/catch`:

```js
try {
  await onSubmit({ ... });
  setTitle(""); setDescription(""); setPhoto(null); // chi reset khi THANH CONG
} catch {
  // loi da hien o App.jsx, o day khong lam gi de GIU LAI du lieu da nhap
}
```

Trước đây form bị xóa trắng ngay khi bấm submit, **không đợi biết kết quả** — nếu tạo pin thất bại (mất mạng, backend lỗi), toàn bộ nội dung đã gõ (tên, mô tả, đã chọn ảnh) biến mất, người dùng phải nhập lại từ đầu. Giờ chỉ xóa form sau khi `onSubmit` (Promise) báo thành công.

Nút submit nhận prop `submitting` (từ `App.jsx`) để tự disable + đổi chữ thành "Dang luu..." trong lúc chờ — tránh bấm 2 lần liên tiếp tạo ra 2 pin trùng nhau.

## 3.5. `src/App.jsx` — kết nối tất cả

Luồng dữ liệu:

1. Khi mở trang → `refresh()` gọi `listPins()` → hiển thị pin có sẵn.
2. Người dùng click bản đồ → lưu tọa độ vào state `pendingLatLng` → form hiện ra.
3. Submit form → `handleCreate()`: bật cờ `creating` (khóa form), gọi `createPin()`, tắt cờ trong `finally`. Nếu lỗi: set thông báo `error` rồi **`throw err` lại** — để `PinForm` (mục 3.4) biết là thất bại và không xóa form.
4. Click nút Xóa trên popup → `handleDelete(id)`: chặn bấm khi đang có 1 lượt xóa khác dở dang (`if (deletingId) return`), set `deletingId = id` để `PinMap` (mục 3.3) disable đúng nút đó.

Đây là pattern React cơ bản: **state ở component cha (`App`), truyền xuống con qua props, con gọi lại hàm cha qua callback** — không dùng thư viện quản lý state phức tạp (Redux...) vì app còn nhỏ, không cần thiết.

## 3.6. Đóng gói — `Dockerfile` (multi-stage build)

```dockerfile
FROM node:20-alpine AS build   # bước 1: cài dependency, build ra file tĩnh (thư mục dist/)
...
FROM nginx:1.27-alpine          # bước 2: chỉ lấy file tĩnh, bỏ hết Node.js/source
COPY --from=build /app/dist /usr/share/nginx/html
```

**Multi-stage build** giúp image cuối cùng rất nhẹ (chỉ có Nginx + file tĩnh, không có Node.js/node_modules) — đúng thực hành Docker chuẩn đã học. `COPY package.json package-lock.json` + `npm ci` (thay vì `npm install`) đảm bảo build luôn ra đúng version đã khóa trong lockfile — không tự ý kéo bản dependency mới hơn giữa các lần build. `.dockerignore` (`node_modules`, `dist`...) tránh việc lỡ có `node_modules` cài sẵn trên máy Windows/Mac bị `COPY . .` đè lên `node_modules` vừa cài trong container Linux (2 hệ điều hành có file binary gốc khác nhau, gây lỗi build khó hiểu).

`nginx.conf` có 3 phần:

```nginx
add_header X-Content-Type-Options nosniff always;
add_header X-Frame-Options DENY always;
add_header Referrer-Policy strict-origin-when-cross-origin always;

location ~* \.(?:js|css|png|jpg|jpeg|gif|webp|svg|woff2?)$ {
    try_files $uri =404;
    add_header Cache-Control "public, max-age=31536000, immutable" always;
}

location / {
    try_files $uri $uri/ /index.html;
    add_header Cache-Control "no-cache" always;
}
```

- 3 `add_header` đầu là **security header** cơ bản: `nosniff` ngăn trình duyệt tự đoán loại nội dung sai cách; `X-Frame-Options DENY` chống bị nhúng vào `<iframe>` trang khác (clickjacking); `Referrer-Policy` hạn chế lộ đường dẫn nội bộ khi người dùng bấm link ra ngoài.
- Location riêng cho file có hash trong tên (`index-abc123.js`...) cache **1 năm, immutable** — an toàn vì tên file tự đổi mỗi lần nội dung đổi.
- `index.html` luôn `Cache-Control: no-cache` (bắt trình duyệt hỏi lại server) — vì nó là file duy nhất **không** có hash tên, phải luôn lấy bản mới nhất, nếu không sau khi deploy bản mới, người dùng cũ có thể bị kẹt với `index.html` cache cũ trỏ tới file JS/CSS đã bị xóa (lỗi 404 trắng trang, phải hard-refresh mới hết).
- `try_files $uri $uri/ /index.html` vẫn giữ nguyên vì đây là Single Page Application (SPA) — mọi đường dẫn không khớp file tĩnh nào đều phải trả về `index.html` để React Router (nếu sau này thêm) tự xử lý phía client.

## Tiếp theo

Qua [04-docker-hoa-va-chay-local.md](04-docker-hoa-va-chay-local.md) để chạy toàn bộ hệ thống.
