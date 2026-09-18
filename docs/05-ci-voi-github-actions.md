# Bài 5 — CI với GitHub Actions

> Từ khó (CI, workflow, job, token, SHA...) tra ở [00b-bang-thuat-ngu.md](00b-bang-thuat-ngu.md). **GitHub Actions** là tính năng của GitHub tự động chạy các lệnh (test, build...) mỗi khi có code mới được đẩy lên — không cần bạn tự tay chạy lại mỗi lần.

Thư mục: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — file mô tả "khi nào tự chạy" và "chạy gì" (gọi là 1 **workflow**).

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

1. **`backend-test`**: cài Node 20, `npm ci`, `npm test` (chạy 5 test ở Bài 2 — dùng mock nên không cần Docker/DynamoDB/MinIO thật ngay trong CI). Dùng `npm ci` (không phải `npm install`) để cài đúng chính xác version đã khóa trong `package-lock.json`, không tự ý nâng version giữa các lần chạy CI.
2. **`build-and-push`**: chỉ chạy khi push thật (không chạy trên PR, tránh build thừa), build Docker image cho `backend` và `frontend`, đẩy lên **GitHub Container Registry** (`ghcr.io`) — dùng `secrets.GITHUB_TOKEN` là token **tự động có sẵn** của GitHub Actions, không cần tạo tài khoản Docker Hub hay xin thêm secret nào. Mỗi image được gắn **2 tag**: `latest` (bản mới nhất) và `${{ github.sha }}` (đúng commit đã build ra nó) — nhờ tag theo SHA, sau này nếu bản `latest` mới có lỗi, có thể chỉ định lại đúng SHA cũ để rollback thay vì chịu chết vì `latest` đã bị ghi đè mất bản cũ.

`needs: backend-test` — job build chỉ chạy **sau khi** test pass, không lãng phí thời gian build image nếu test đã fail.

**Ghim action theo SHA thay vì tag** (`actions/checkout@11d5960a...` kèm comment `# v4`, thay vì chỉ `@v4`): tag như `v4` là con trỏ **có thể bị dịch chuyển** sang commit khác theo thời gian (do chính chủ action cập nhật, hoặc nếu tài khoản publish bị chiếm) — CI của bạn khi đó sẽ tự động chạy code khác mà không ai để ý, trong khi job `build-and-push` đang cầm `secrets.GITHUB_TOKEN` với quyền ghi vào `ghcr.io`. Ghim theo SHA cụ thể (dài 40 ký tự) đảm bảo CI luôn chạy đúng 1 phiên bản đã được kiểm chứng, không tự đổi ngầm.

## 5.2. Tạo repo GitHub và đẩy code lên

### Bước 1 — Tạo commit đầu tiên trên máy

Mở terminal (Git Bash) trong thư mục `pinslocal/`, chạy lần lượt từng lệnh:

```
git init
git add .
git commit -m "Khoi tao du an PinsLocal (Phase 1 MVP)"
```

`git init` chỉ chạy **1 lần duy nhất** cho cả đời dự án (báo lỗi "Reinitialized existing Git repository" nếu chạy lại — không sao, vô hại).

### Bước 2 — Tạo repository rỗng trên GitHub (thao tác trên trình duyệt)

1. Đăng nhập https://github.com, vào thẳng **https://github.com/new**.
2. Ô **Repository name**: gõ `pinslocal`.
3. Ô **Description** (tuỳ chọn): có thể bỏ trống hoặc gõ mô tả ngắn.
4. Mục chọn **Public** / **Private**: chọn **Public** nếu muốn giảng viên xem được mà không cần đăng nhập; **Private** nếu muốn giữ riêng tư (giảng viên phải được bạn mời qua Settings → Collaborators mới xem được).
5. Mục **"Initialize this repository with:"** — **để trống tất cả** (không tick "Add a README file", không chọn ".gitignore template", không chọn "License") — vì máy bạn đã có sẵn các file này, tick vào sẽ gây xung đột lúc push.
6. Bấm nút xanh **Create repository** ở cuối trang.

### Bước 3 — Nối máy với repo vừa tạo và đẩy code lên

Trang GitHub sau khi tạo xong sẽ hiện sẵn các dòng lệnh dưới mục **"…or push an existing repository from the command line"** — chạy đúng 3 dòng đó (thay `<username>` bằng tên tài khoản GitHub thật của bạn):

```
git remote add origin https://github.com/<username>/pinslocal.git
git branch -M main
git push -u origin main
```

**Nếu đây là lần đầu `git push` trên máy này**, sẽ có 1 trong 2 tình huống:
- 1 cửa sổ trình duyệt tự bật lên trang đăng nhập GitHub (Git Credential Manager) → đăng nhập bình thường → thấy dòng "Success, you may return to your original application" → quay lại terminal, lệnh `push` tự tiếp tục chạy xong.
- Hoặc terminal hỏi thẳng **Username** / **Password** — gõ username GitHub, còn ô Password **không dùng mật khẩu đăng nhập thường** mà phải dùng **Personal Access Token** (tạo tại github.com → bấm avatar góc phải trên → **Settings** → cuộn xuống cuối menu trái → **Developer settings** → **Personal access tokens** → **Tokens (classic)** → **Generate new token**, tick quyền `repo` → **Generate token** → copy chuỗi ký tự hiện ra, dán vào ô Password).

Push thành công sẽ in ra dạng:

```
To https://github.com/<username>/pinslocal.git
 * [new branch]      main -> main
```

Refresh lại trang GitHub — toàn bộ file/thư mục sẽ hiện đầy đủ.

## 5.3. Xem CI chạy

1. Trên trang repo GitHub, nhìn thanh menu ngang ngay dưới tên repo: **Code | Issues | Pull requests | Actions | Projects | ...** → bấm **Actions**.
2. Danh sách các lần chạy hiện theo thứ tự mới nhất trên cùng, mỗi dòng có 1 icon tròn bên trái:
   - 🟡 vòng tròn vàng đang xoay = đang chạy
   - ✅ dấu tick xanh trong vòng tròn = chạy xong, pass
   - ❌ dấu X đỏ = chạy xong, có bước fail
3. Bấm vào dòng chạy mới nhất (tên dòng lấy theo nội dung commit message) → sang trang chi tiết, bên trái là danh sách job (`backend-test`, `build-and-push`) mỗi job cũng có icon trạng thái riêng.
4. Bấm vào tên 1 job → bên phải hiện danh sách từng **step** (bước) dạng có thể thu gọn/mở rộng → bấm vào tên step (vd "Run npm test") để xem log chi tiết dòng lệnh đã chạy và kết quả in ra.

Nếu job `backend-test` báo đỏ (fail) → đọc log để biết dòng test nào fail, đây chính là mục đích của CI: **bắt lỗi trước khi code lỗi lọt vào nhánh chính**.

## 5.4. Kiểm tra image đã build

1. Bấm vào **avatar tài khoản** ở góc trên bên phải bất kỳ trang GitHub nào → không chọn Settings mà chọn **Your profile**.
2. Trên trang profile, thanh menu ngang có: **Overview | Repositories | Projects | Packages | Stars** → bấm **Packages**.
3. Thấy 2 dòng `pinslocal/backend` và `pinslocal/frontend` — bấm vào 1 dòng để xem chi tiết: danh sách **version** (tag `latest`), và mục **Package settings** (bên phải, hình bánh răng ⚙) nếu muốn đổi Public/Private cho riêng package đó.

## 5.5. Vì sao bước này quan trọng cho việc nộp bài sau này

Khi lên **Phase 2** (có VPS), workflow này sẽ được mở rộng thêm 1 job "deploy": SSH vào VPS, `docker pull` đúng image vừa build ở bước này, rồi `docker compose up -d` — biến CI (kiểm tra) thành **CD** (tự động triển khai). Việc đẩy image lên `ghcr.io` ngay từ bây giờ (dù chưa có VPS) là chuẩn bị sẵn cho bước đó, không phải làm thừa.

## Tiếp theo

Qua [06-roadmap-phase-2-den-4.md](06-roadmap-phase-2-den-4.md) để biết việc cần làm khi bạn có VPS/tài khoản AWS.
