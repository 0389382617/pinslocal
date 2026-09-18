# Bài 5 — CI với GitHub Actions

Thư mục: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

## 5.1. Đọc hiểu workflow

```yaml
on:
  push:
    branches: ["main"]
  pull_request:
    branches: ["main"]
```

Chạy khi push hoặc mở PR vào nhánh `main` — đúng khái niệm **Continuous Integration**: mỗi lần đổi code đều tự động kiểm tra.

2 job:

1. **`backend-test`**: cài Node 20, `npm install`, `npm test` (chạy 5 test ở Bài 2 — dùng mock nên không cần Docker/DynamoDB/MinIO thật ngay trong CI).
2. **`build-and-push`**: chỉ chạy khi push thật (không chạy trên PR, tránh build thừa), build Docker image cho `backend` và `frontend`, đẩy lên **GitHub Container Registry** (`ghcr.io`) — dùng `secrets.GITHUB_TOKEN` là token **tự động có sẵn** của GitHub Actions, không cần tạo tài khoản Docker Hub hay xin thêm secret nào.

`needs: backend-test` — job build chỉ chạy **sau khi** test pass, không lãng phí thời gian build image nếu test đã fail.

## 5.2. Tạo repo GitHub và đẩy code lên

Trong thư mục `pinslocal/`, chạy lần lượt:

```
git init
git add .
git commit -m "Khoi tao du an PinsLocal (Phase 1 MVP)"
```

Sau đó vào https://github.com/new tạo 1 repository mới tên `pinslocal` (Public hoặc Private đều được), **không** tick "Add README" (vì mình đã có sẵn), rồi copy 2 dòng lệnh GitHub hiển thị (dạng dưới, thay `<username>` bằng tên GitHub của bạn):

```
git remote add origin https://github.com/<username>/pinslocal.git
git branch -M main
git push -u origin main
```

## 5.3. Xem CI chạy

Vào tab **Actions** trên trang GitHub của repo → thấy workflow "CI" đang chạy (hoặc đã chạy xong) → click vào để xem log từng bước, đúng job/step đã mô tả ở mục 5.1.

Nếu job `backend-test` báo đỏ (fail) → đọc log để biết dòng test nào fail, đây chính là mục đích của CI: **bắt lỗi trước khi code lỗi lọt vào nhánh chính**.

## 5.4. Kiểm tra image đã build

Vào trang GitHub profile → tab **Packages** → sẽ thấy 2 package `pinslocal/backend` và `pinslocal/frontend` (image Docker vừa được CI build & đẩy lên).

## 5.5. Vì sao bước này quan trọng cho việc nộp bài sau này

Khi lên **Phase 2** (có VPS), workflow này sẽ được mở rộng thêm 1 job "deploy": SSH vào VPS, `docker pull` đúng image vừa build ở bước này, rồi `docker compose up -d` — biến CI (kiểm tra) thành **CD** (tự động triển khai). Việc đẩy image lên `ghcr.io` ngay từ bây giờ (dù chưa có VPS) là chuẩn bị sẵn cho bước đó, không phải làm thừa.

## Tiếp theo

Qua [06-roadmap-phase-2-den-4.md](06-roadmap-phase-2-den-4.md) để biết việc cần làm khi bạn có VPS/tài khoản AWS.
