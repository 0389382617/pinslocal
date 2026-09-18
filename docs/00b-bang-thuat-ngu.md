# Bảng thuật ngữ — tra cứu khi gặp từ khó

Đọc các bài `docs/00`–`09`, gặp từ nào không hiểu, quay lại đây tra. Mỗi từ giải thích bằng ví dụ đời thường trước, rồi mới tới định nghĩa kỹ thuật.

## Máy tính & thao tác cơ bản

**Terminal (cửa sổ dòng lệnh)** — một cửa sổ để bạn **gõ chữ ra lệnh** cho máy tính làm việc, thay vì bấm chuột vào biểu tượng như bình thường. Ví dụ gõ `docker --version` rồi Enter, máy tính in ra kết quả ngay bên dưới. Trong VSCode, mở bằng `` Ctrl+` `` hoặc menu Terminal → New Terminal.

**Git Bash / PowerShell / Command Prompt** — đều là **loại terminal khác nhau** cài trên Windows, giống như 3 người phiên dịch khác nhau nhưng cùng hiểu tiếng Việt — chỉ khác cách viết câu lệnh 1 chút (ví dụ đường dẫn ổ đĩa: Git Bash viết `/e/projects`, PowerShell viết `E:\projects`). Dự án này dùng **Git Bash** làm chuẩn.

**Đường dẫn (path)** — địa chỉ của 1 file/thư mục trên máy, giống địa chỉ nhà. Ví dụ `E:\projects\pinslocal\backend\src\server.js` nghĩa là: ổ đĩa E → thư mục projects → thư mục pinslocal → thư mục backend → thư mục src → file server.js.

## Lập trình cơ bản (dùng ở docs/02, 03)

**Code / mã nguồn** — tập hợp câu lệnh viết theo 1 ngôn ngữ (ở đây là **JavaScript**) mà máy tính đọc được để biết phải làm gì, giống như 1 công thức nấu ăn viết theo đúng cú pháp mà đầu bếp máy hiểu.

**Function (hàm)** — 1 đoạn code được đặt tên, nhận **input** (nguyên liệu đưa vào) và trả về **output** (kết quả) — giống 1 cái máy xay sinh tố: bỏ trái cây vào (input), bấm nút, ra sinh tố (output). Ví dụ `isFiniteInRange(value, min, max)` nhận vào 1 giá trị + khoảng min/max, trả về `true`/`false`.

**Variable (biến)** — 1 cái "hộp" đặt tên để chứa tạm 1 giá trị, có thể lấy ra dùng lại. `const title = "Ho Guom"` nghĩa là tạo hộp tên `title`, bỏ chữ "Ho Guom" vào.

**if / else (rẽ nhánh)** — giống câu "nếu... thì... nếu không thì...". `if (!title) { báo lỗi }` nghĩa là "nếu không có title thì báo lỗi".

**Array (mảng)** — 1 danh sách nhiều giá trị xếp theo thứ tự, giống 1 hàng ghế đánh số 0,1,2,3... Ví dụ danh sách toàn bộ pin trả về từ API là 1 mảng.

**JSON** — 1 cách viết dữ liệu ra chữ để máy tính (và con người) đọc được, dạng `{"tên": "giá trị"}`. Ví dụ `{"title": "Ho Guom", "lat": 21.03}` — giống viết 1 tờ khai thông tin có nhãn rõ ràng từng ô.

**async / await (bất đồng bộ)** — 1 số việc (như gọi ra internet lấy dữ liệu) **mất thời gian chờ**, không có kết quả ngay. `async function` đánh dấu "hàm này có chỗ phải chờ", `await` nghĩa là "đứng đây chờ xong việc này rồi mới làm tiếp" — giống việc bạn đặt trà sữa online rồi chờ shipper giao, trong lúc chờ không đứng im mà vẫn làm việc khác được.

**try / catch (bắt lỗi)** — "thử làm việc này, nếu lỗi thì nhảy vào đây xử lý thay vì làm sập cả chương trình" — giống đi bộ mà có lưới an toàn hứng phía dưới nếu trượt chân.

**import / require** — lệnh "lấy code từ file/thư viện khác về dùng", giống mượn sách ở thư viện.

## Web & API (dùng ở docs/02, 03, 04)

**Server (máy chủ) / Client** — Server là "người phục vụ" luôn chờ sẵn để trả lời yêu cầu; Client là "người yêu cầu" (ở đây là trình duyệt/frontend). Giống nhà hàng: server là đầu bếp, client là khách gọi món.

**API (Application Programming Interface)** — "menu các việc mà server cho phép client nhờ làm", mỗi mục trong menu có tên và cách gọi rõ ràng. Ví dụ `GET /pins` = "cho tôi xem danh sách pin".

**Endpoint** — 1 mục cụ thể trong "menu" API đó, ví dụ `/pins`, `/health`.

**HTTP method (GET/POST/DELETE...)** — "loại yêu cầu" gửi tới endpoint: `GET` = xem, `POST` = tạo mới, `DELETE` = xóa — giống 4 loại phiếu khác nhau ở 1 quầy dịch vụ.

**Request / Response** — Request là "phiếu yêu cầu" client gửi đi, Response là "kết quả" server trả về.

**HTTP status code** — 3 chữ số server trả về báo tình trạng: `200` = thành công, `400` = client gửi sai (thiếu thông tin, sai định dạng), `404` = không tìm thấy, `413` = gửi file to quá, `500` = server tự lỗi bên trong.

**Port (cổng)** — 1 con số để phân biệt "cửa" nào trên cùng 1 máy đang chạy dịch vụ nào, giống số phòng trong 1 tòa nhà. `localhost:4000` = phòng số 4000 trên chính máy bạn.

**localhost / 127.0.0.1** — cách máy tính tự gọi **chính nó**, giống việc bạn tự nói "tôi" thay vì tên riêng — chỉ máy bạn mới hiểu "localhost" là chính nó.

**Middleware** — 1 đoạn code chạy "chen giữa" lúc request tới và lúc trả lời — giống trạm kiểm soát trên đường đi, ai cũng phải qua trước khi tới đích.

**MIME type** — "nhãn loại nội dung" của 1 file, ví dụ `image/png` = ảnh PNG, `text/html` = trang web. Server dùng nhãn này để trình duyệt biết cách xử lý file (hiển thị ảnh hay chạy code).

**CDN (Content Delivery Network)** — kho chứa file (ảnh, thư viện code có sẵn...) đặt ở nhiều nơi trên thế giới để tải nhanh hơn — nhưng phụ thuộc vào bên thứ 3, nếu họ sập thì mình cũng bị ảnh hưởng (lý do dự án chuyển từ dùng CDN sang tự đóng gói file vào image).

**Cache** — "bản lưu tạm" để lần sau khỏi tải lại từ đầu, giống việc bạn note sẵn số điện thoại hay dùng thay vì tra danh bạ mỗi lần.

## Docker & hạ tầng (dùng ở docs/01, 04)

**Container (thùng chứa)** — 1 "hộp" đóng gói sẵn app + mọi thứ app cần (thư viện, cấu hình) để chạy giống hệt nhau trên bất kỳ máy nào — giống 1 căn hộ dựng sẵn nội thất, chuyển tới đâu cũng y hệt, không cần lo máy đó có sẵn gì hay chưa.

**Image (ảnh Docker)** — "bản thiết kế đóng gói sẵn" để tạo ra container — giống bản vẽ để in ra căn hộ ở trên; 1 image có thể tạo ra nhiều container giống nhau.

**Docker / Docker Desktop** — phần mềm để tạo và chạy container trên máy bạn.

**Docker Compose** — công cụ mô tả **nhiều container chạy cùng lúc** và cách chúng nói chuyện với nhau, viết trong 1 file `docker-compose.yml` — giống bản kế hoạch dàn dựng 1 dàn nhạc nhiều nhạc cụ chơi cùng lúc.

**Dockerfile** — file hướng dẫn "cách đóng gói" 1 image (cài gì, copy file nào vào).

**Volume** — nơi lưu dữ liệu **bền vững** ngoài container, để dù container bị xóa/tạo lại, dữ liệu (như ảnh upload) vẫn còn.

## Database & lưu trữ (dùng ở docs/02)

**Database (cơ sở dữ liệu)** — nơi lưu trữ dữ liệu có tổ chức, giống 1 tủ hồ sơ được sắp xếp để tìm lại dễ dàng.

**DynamoDB / Table (bảng) / Item (bản ghi)** — DynamoDB là loại database của AWS; 1 Table giống 1 cuốn sổ, mỗi Item là 1 dòng ghi trong sổ đó (ở đây mỗi Item = 1 pin).

**S3 / Bucket (thùng chứa) / Object (đối tượng)** — S3 là dịch vụ lưu file của AWS; 1 Bucket giống 1 tủ đựng, mỗi Object là 1 file bên trong (ở đây là mỗi ảnh upload).

**SDK (Software Development Kit)** — bộ công cụ có sẵn để code dễ dàng "nói chuyện" với 1 dịch vụ (ở đây: AWS SDK để gọi DynamoDB/S3) mà không cần tự viết lại từ đầu cách giao tiếp.

**IAM (Identity and Access Management)** — hệ thống phân quyền của AWS: ai được làm gì — giống thẻ ra vào công ty, mỗi thẻ chỉ mở được đúng những cửa được cấp phép.

## Git & GitHub (dùng ở docs/05)

**Git** — phần mềm lưu lại **lịch sử thay đổi** của code theo thời gian, để có thể quay lại phiên bản cũ bất cứ lúc nào — giống nút "Lưu phiên bản" trong Google Docs nhưng mạnh hơn nhiều.

**Repository (repo)** — 1 "kho" chứa toàn bộ code + lịch sử thay đổi của 1 dự án.

**Commit** — 1 "điểm lưu" trong lịch sử, kèm mô tả ngắn đã thay đổi gì.

**Push / Pull** — Push = đẩy code từ máy mình lên GitHub; Pull = tải code mới nhất từ GitHub về máy mình.

**Branch (nhánh)** — 1 "bản sao song song" của code để thử nghiệm mà không ảnh hưởng bản chính (`main`).

**Token / Personal Access Token (PAT)** — 1 chuỗi ký tự dùng thay mật khẩu để 1 chương trình (không phải con người) đăng nhập/xác thực — phải giữ bí mật như mật khẩu thật.

## CI/CD (dùng ở docs/05)

**CI (Continuous Integration)** — "tự động kiểm tra code mỗi lần có thay đổi", giống có 1 người kiểm tra chất lượng đứng canh 24/7 thay vì đợi tới cuối mới kiểm tra 1 lần.

**CD (Continuous Deployment)** — "tự động triển khai code mới lên server thật" sau khi CI đã kiểm tra pass.

**Workflow / Job / Step** — 1 Workflow (GitHub Actions) gồm nhiều Job chạy độc lập, mỗi Job gồm nhiều Step chạy tuần tự — giống 1 quy trình sản xuất có nhiều công đoạn, mỗi công đoạn có nhiều bước nhỏ.

**Registry (kho chứa image)** — nơi lưu trữ Docker image để tải về dùng ở máy khác, giống App Store nhưng cho image Docker (ở đây dùng `ghcr.io` — GitHub Container Registry).

**SHA (mã băm)** — 1 chuỗi ký tự dài duy nhất đại diện cho **đúng 1 phiên bản cụ thể** của code — giống số CMND, không trùng với ai khác, không đổi theo thời gian (khác với "tên" như `v4` có thể bị gán lại cho phiên bản khác sau này).

**Vulnerability (lỗ hổng) / CVE** — 1 lỗi trong phần mềm mà kẻ xấu có thể lợi dụng để phá/đánh cắp dữ liệu. CVE là "mã số" chính thức đặt cho từng lỗ hổng đã được công bố công khai, giống mã số vụ án.

## Mạng & triển khai (dùng ở docs/07, 08)

**VPS (Virtual Private Server)** — 1 "máy tính ảo" thuê trên internet, chạy 24/7, ai cũng truy cập được qua địa chỉ IP của nó — khác máy tính cá nhân của bạn (chỉ chạy khi bạn bật máy).

**SSH / SSH key** — cách đăng nhập từ xa an toàn vào 1 máy chủ (VPS); SSH key gồm 2 phần: **private key** (giữ bí mật, chỉ mình bạn giữ) và **public key** (đưa cho server, không cần giấu) — giống ổ khóa (public) và chìa khóa (private) tương ứng nhau.

**Domain (tên miền)** — tên chữ dễ nhớ thay cho địa chỉ IP số khó nhớ, ví dụ `pinslocal.com` thay vì `123.45.67.89`.

**DNS / bản ghi A** — hệ thống "danh bạ" dịch tên miền sang địa chỉ IP; bản ghi A là 1 dòng trong danh bạ đó nói "tên miền X ứng với IP Y".

**SSL / HTTPS / Certificate (chứng chỉ)** — SSL mã hóa dữ liệu truyền giữa trình duyệt và server để người khác trên đường truyền không đọc trộm được; HTTPS là HTTP có mã hóa; Certificate là "giấy chứng nhận" xác minh website đó đúng là chủ domain, không phải giả mạo.

**Reverse proxy** — 1 "lễ tân" đứng trước nhiều server, nhận request rồi chuyển tới đúng server phù hợp bên trong — người ngoài chỉ thấy 1 địa chỉ duy nhất (ở đây là Nginx đứng trước backend/frontend/MinIO).

**Load balancer (cân bằng tải)** — giống reverse proxy nhưng có nhiều server **giống hệt nhau** phía sau, tự động chia việc đều ra để không server nào quá tải.

**Firewall (tường lửa)** — "hàng rào" chỉ cho phép đúng loại kết nối được khai báo trước đi qua, chặn hết phần còn lại — giống bảo vệ ở cổng chỉ cho khách có hẹn trước vào.

**Terraform** — công cụ mô tả "hạ tầng cần có" (VPS, firewall...) bằng file text, rồi tự động tạo ra đúng như vậy — giống viết bản thiết kế nhà rồi có robot tự xây theo đúng bản vẽ, thay vì tự tay xây.

**Provider (Terraform)** — "phần cắm" để Terraform biết cách nói chuyện với 1 nhà cung cấp cụ thể (AWS, DigitalOcean...).

**Ansible / Playbook** — công cụ tự động hóa việc **cài đặt/cấu hình** vào 1 hoặc nhiều máy chủ có sẵn (khác Terraform là tạo máy chủ mới); Playbook là file mô tả các bước cần làm.

**Healthcheck (kiểm tra sức khỏe)** — Docker tự động gọi thử 1 lệnh/địa chỉ định kỳ để biết container "còn sống và làm việc bình thường" hay chỉ "còn bật máy nhưng đơ" — giống y tá đo mạch định kỳ thay vì chỉ nhìn bệnh nhân còn thở hay không.

**Rollback (quay lui)** — hủy bỏ 1 thay đổi vừa làm, trả hệ thống về trạng thái trước đó — giống nút "Undo" (Ctrl+Z).

**Idempotent (làm lại nhiều lần vẫn ra kết quả như nhau)** — chạy lại 1 thao tác nhiều lần không gây hại gì thêm — giống bấm nút "tắt đèn" nhiều lần, đèn vẫn chỉ tắt 1 lần, không có gì tệ hơn xảy ra.

## Giám sát (dùng ở docs/04)

**Monitoring (giám sát)** — theo dõi tình trạng hệ thống đang chạy (có lỗi không, chậm không, dùng bao nhiêu tài nguyên).

**Metrics (số liệu đo lường)** — các con số đo được theo thời gian (số request/giây, thời gian phản hồi...).

**Prometheus** — công cụ thu thập và lưu Metrics theo thời gian.

**Grafana** — công cụ vẽ Metrics đó thành biểu đồ trực quan, dễ nhìn.

**Cardinality (số lượng tổ hợp nhãn)** — khi 1 số liệu bị gắn quá nhiều nhãn khác nhau (ví dụ theo từng ID riêng biệt), số lượng "dòng" cần lưu tăng vọt không kiểm soát được, gây tốn bộ nhớ — đây chính là lỗi đã sửa ở mục Prometheus trong [docs/02](02-xay-dung-backend.md).
