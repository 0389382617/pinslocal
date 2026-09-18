# Bài 1 — Cài đặt & kiểm tra môi trường (chi tiết từng cú click)

> Từ khó (VPS, terminal, Docker...) tra ở [00b-bang-thuat-ngu.md](00b-bang-thuat-ngu.md).

## Cần cài gì?

| Công cụ | Bắt buộc? | Vì sao |
|---|---|---|
| **Docker Desktop** | Bắt buộc | Chạy toàn bộ app (backend, frontend, database, S3 giả lập) trong container — không cần cài Node.js/database trực tiếp lên máy |
| **Git** | Bắt buộc | Quản lý phiên bản code, đẩy lên GitHub |
| **Node.js** | Không bắt buộc | Chỉ cần nếu bạn muốn chạy `npm install`/sửa code có gợi ý (IntelliSense) ngoài Docker. Mọi lệnh chạy thật đều làm qua Docker nên không bắt buộc cài |
| **Tài khoản GitHub** | Bắt buộc | Lưu code, chạy CI/CD |

Máy đang dùng cho dự án này **đã có sẵn Docker + Git** (đã kiểm tra ở mục dưới) — phần cài đặt chi tiết bên dưới dành cho trường hợp làm lại trên **máy mới hoàn toàn chưa có gì**.

## A. Cài Docker Desktop (bỏ qua nếu máy đã có)

1. Mở trình duyệt, vào **https://www.docker.com/products/docker-desktop/**.
2. Bấm nút **Download for Windows** (nút xanh, to, giữa trang).
3. File tải về tên dạng `Docker Desktop Installer.exe` (nằm trong thư mục `Downloads`) — bấm đúp để chạy.
4. Windows có thể hiện hộp thoại **"User Account Control"** hỏi "Do you want to allow this app to make changes?" → bấm **Yes**.
5. Cửa sổ cài đặt Docker hiện ra với 2 ô tick: **"Use WSL 2 instead of Hyper-V"** (WSL2 là 1 lớp "máy ảo Linux nhẹ" tích hợp sẵn trong Windows — Docker cần chạy trên nền Linux nên dùng lớp này; cứ để tick sẵn, đây là lựa chọn khuyến nghị, không cần hiểu sâu hơn) và **"Add shortcut to desktop"** (tùy chọn) → bấm **Ok** để bắt đầu cài.
6. Đợi thanh tiến trình chạy xong (khoảng 1-3 phút) → bấm **Close and restart** (Docker sẽ yêu cầu khởi động lại máy để bật tính năng ảo hóa WSL2).
7. Sau khi máy khởi động lại, Docker Desktop tự mở (hoặc mở tay qua **Start Menu → gõ "Docker Desktop" → Enter**).
8. Lần đầu mở sẽ hiện màn hình "Docker Subscription Service Agreement" → tick **"I accept the terms"** → bấm **Accept**.
9. Có thể hiện thêm màn hình hỏi đăng nhập tài khoản Docker Hub — có thể bấm **Skip** (không bắt buộc đăng nhập để dùng các lệnh trong dự án này).
10. Đợi tới khi biểu tượng **con cá voi 🐳** ở khay hệ thống (góc dưới phải màn hình, cạnh đồng hồ, có thể phải bấm mũi tên **^** để lộ ra) đứng yên, không còn hiệu ứng "đang tải/đang khởi động" — nghĩa là Docker đã sẵn sàng.

## B. Cài Git (bỏ qua nếu máy đã có)

1. Vào **https://git-scm.com/download/win** — trang sẽ tự động bắt đầu tải bản 64-bit phù hợp.
2. Chạy file `Git-*-64-bit.exe` vừa tải → **Yes** ở hộp thoại User Account Control.
3. Màn hình cài đặt hiện ra nhiều bước "Select Components", "Choosing the default editor", "Adjusting the name of the initial branch"... — với người mới, cứ để **mặc định** và bấm **Next** liên tục qua từng màn hình.
4. Ở bước cuối bấm **Install** → đợi xong → bấm **Finish**.
5. Git for Windows cài kèm **Git Bash** — đây chính là chương trình dùng để chạy toàn bộ lệnh trong tài liệu của dự án này.

## C. Tạo tài khoản GitHub (bỏ qua nếu đã có)

1. Vào **https://github.com/signup**.
2. Điền **Email**, bấm **Continue**.
3. Đặt **Password**, bấm **Continue**.
4. Đặt **Username** (tên hiển thị công khai, dùng trong các URL như `github.com/<username>`), bấm **Continue**.
5. Chọn có muốn nhận email cập nhật hay không → **Continue**.
6. Xác minh "tôi không phải robot" (thường là 1 câu đố hình ảnh đơn giản) → làm theo hướng dẫn trên màn hình.
7. Kiểm tra hộp thư email vừa đăng ký → mở email từ GitHub → bấm nút xác nhận / nhập mã 6 số hiện trong email vào ô trên trang GitHub.
8. Xong — tài khoản sẵn sàng dùng ngay, không cần khai báo thẻ thanh toán cho các bước trong dự án này.

## D. Mở terminal đúng cách trong VSCode

1. Trên thanh menu VSCode ở trên cùng, bấm **Terminal** → **New Terminal** (hoặc phím tắt `` Ctrl + ` ``).
2. Panel terminal hiện ra ở dưới màn hình. Nhìn góc phải panel này có 1 icon **dấu `+`** và cạnh nó là **mũi tên nhỏ `v`** (dropdown chọn loại shell).
3. Bấm mũi tên `v` → danh sách hiện ra các loại shell đã cài (**Git Bash**, **PowerShell**, **Command Prompt**...) → chọn **Git Bash**.
4. Toàn bộ lệnh trong tài liệu `docs/` của dự án này viết theo cú pháp **Git Bash** (giống Linux/Mac: `/e/projects/...`, dùng `curl`, `MSYS_NO_PATHCONV=1`...) — nếu chạy trong PowerShell, một số lệnh cần đổi cú pháp (đường dẫn `E:\projects\...`, không dùng được `MSYS_NO_PATHCONV`).

## E. Mở file code trong VSCode để đọc theo tài liệu

Các bài `docs/02`, `docs/03`... hay nhắc tới đường dẫn file kiểu `backend/src/server.js`. Cách mở:

1. Thanh biểu tượng dọc bên trái màn hình VSCode (Activity Bar) → bấm icon **2 trang giấy chồng nhau** (Explorer) — thường là icon trên cùng, cũng có thể bấm tổ hợp `Ctrl+Shift+E`.
2. Panel bên trái hiện cây thư mục dự án — bấm vào tên thư mục (vd `backend`) để mở rộng ra, bấm tiếp `src`, rồi `server.js` để mở file đó ra vùng soạn thảo chính giữa màn hình.
3. Nếu tài liệu đang mở trong tab preview Markdown (như file bạn đang đọc) có đường link dạng `[server.js](../backend/src/server.js)` — giữ phím `Ctrl` và bấm chuột trái vào link đó cũng mở thẳng được file, không cần dò trong Explorer.

## Kiểm tra đã cài đúng chưa

Trong terminal (Git Bash), gõ:

```
docker --version
git --version
```

Kết quả tham khảo từ máy của bạn (đã kiểm tra khi xây dự án này):

```
Docker version 29.6.2, build dfc4efb
git version 2.53.0.windows.3
```

Nếu `docker --version` báo lỗi "not recognized": Docker Desktop chưa mở — mở lại theo bước A.7, đợi icon cá voi ổn định rồi thử lại lệnh.

## Không cần cài Node.js — vì sao?

Đây chính là tư duy DevOps: **môi trường chạy app phải nhất quán, tái lập được**, không phụ thuộc máy ai đang cài gì. Toàn bộ dependency (Node.js, thư viện, DynamoDB, S3) được đóng gói trong Docker image — máy bạn, máy giảng viên, hay server thật trên VPS/AWS sau này đều chạy y hệt nhau chỉ với 1 lệnh `docker compose up`.

## Tiếp theo

Qua [02-xay-dung-backend.md](02-xay-dung-backend.md) để hiểu code backend đã được viết như thế nào.
