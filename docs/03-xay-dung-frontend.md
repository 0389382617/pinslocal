# Bài 3 — Frontend (React + Vite + Leaflet)

Thư mục: [`frontend/`](../frontend/).

## 3.1. Vì sao chọn Vite + React + Leaflet?

- **Vite**: công cụ build frontend hiện đại, khởi động cực nhanh, output ra file HTML/CSS/JS tĩnh — dễ deploy sau Nginx (hoặc S3+CloudFront ở Phase 3).
- **Leaflet + OpenStreetMap**: thư viện bản đồ mã nguồn mở, **miễn phí, không cần API key** — phù hợp giai đoạn học, tránh phải đăng ký thêm tài khoản Google Maps.

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

## 3.4. `src/components/PinForm.jsx` — form thêm pin

Form đơn giản: tên, mô tả, chọn ảnh (`<input type="file">`). Chỉ hiện ra sau khi người dùng đã click chọn vị trí trên bản đồ (`latLng` truyền từ `App.jsx`).

## 3.5. `src/App.jsx` — kết nối tất cả

Luồng dữ liệu:

1. Khi mở trang → `refresh()` gọi `listPins()` → hiển thị pin có sẵn.
2. Người dùng click bản đồ → lưu tọa độ vào state `pendingLatLng` → form hiện ra.
3. Submit form → `createPin()` → gọi lại `refresh()` để cập nhật danh sách.
4. Click nút Xóa trên popup → `deletePin()` → `refresh()`.

Đây là pattern React cơ bản: **state ở component cha (`App`), truyền xuống con qua props, con gọi lại hàm cha qua callback** — không dùng thư viện quản lý state phức tạp (Redux...) vì app còn nhỏ, không cần thiết.

## 3.6. Đóng gói — `Dockerfile` (multi-stage build)

```dockerfile
FROM node:20-alpine AS build   # bước 1: cài dependency, build ra file tĩnh (thư mục dist/)
...
FROM nginx:1.27-alpine          # bước 2: chỉ lấy file tĩnh, bỏ hết Node.js/source
COPY --from=build /app/dist /usr/share/nginx/html
```

**Multi-stage build** giúp image cuối cùng rất nhẹ (chỉ có Nginx + file tĩnh, không có Node.js/node_modules) — đúng thực hành Docker chuẩn đã học.

`nginx.conf` có dòng quan trọng:

```
location / {
    try_files $uri $uri/ /index.html;
}
```

Vì đây là Single Page Application (SPA) — mọi đường dẫn không khớp file tĩnh nào đều phải trả về `index.html` để React Router (nếu sau này thêm) tự xử lý phía client.

## Tiếp theo

Qua [04-docker-hoa-va-chay-local.md](04-docker-hoa-va-chay-local.md) để chạy toàn bộ hệ thống.
