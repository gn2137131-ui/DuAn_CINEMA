# BÁO CÁO ĐỒ ÁN
# TÊN ĐỀ TÀI: XÂY DỰNG HỆ THỐNG QUẢN LÝ VÀ ĐẶT VÉ RẠP CHIẾU PHIM TRỰC TUYẾN

**Giảng viên hướng dẫn:** [Tên Giảng Viên]
**Sinh viên thực hiện:** [Tên Của Bạn]
**Mã sinh viên:** [Mã SV]
**Lớp:** [Tên Lớp]

---
<div style="page-break-after: always"></div>

## LỜI CẢM ƠN

Trong suốt quá trình học tập và hoàn thành đồ án này, em đã nhận được sự quan tâm, giúp đỡ và hướng dẫn tận tình của các quý thầy cô, gia đình và bạn bè.

Trước tiên, em xin gửi lời cảm ơn sâu sắc đến thầy/cô [Tên giảng viên hướng dẫn], người đã trực tiếp hướng dẫn, chỉ bảo và truyền đạt cho em những kinh nghiệm quý báu trong suốt quá trình thực hiện đồ án. Nhờ sự hướng dẫn tận tình của thầy/cô, em đã định hướng được công việc, vượt qua những khó khăn về mặt kỹ thuật và hoàn thành đồ án đúng thời hạn.

Em cũng xin gửi lời cảm ơn chân thành đến các thầy cô trong khoa [Tên khoa/trường], những người đã truyền đạt kiến thức nền tảng vững chắc cho em trong suốt những năm học qua, tạo tiền đề để em có thể tiếp thu và ứng dụng các công nghệ mới vào thực tiễn.

Do thời gian thực hiện có hạn và kiến thức còn nhiều hạn chế, đồ án chắc chắn không tránh khỏi những thiếu sót. Em rất mong nhận được sự đóng góp ý kiến từ các thầy cô để đồ án được hoàn thiện hơn, cũng như giúp em có thêm kinh nghiệm quý báu cho chặng đường công việc sau này.

Xin chân thành cảm ơn!

---
<div style="page-break-after: always"></div>

## LỜI CAM ĐOAN

Em xin cam đoan đây là công trình nghiên cứu và phát triển của riêng em, dưới sự hướng dẫn của thầy/cô [Tên Giảng Viên]. Các nội dung nghiên cứu, kết quả phân tích, thiết kế và toàn bộ mã nguồn của hệ thống (Frontend Client, Frontend Admin, Backend API) được trình bày trong quyển báo cáo này là trung thực và chưa từng được công bố trong bất kỳ công trình nào khác.

Các tài liệu tham khảo, thư viện mã nguồn mở, và các công nghệ bên thứ ba sử dụng trong dự án đều được trích dẫn nguồn gốc rõ ràng trong danh mục tài liệu tham khảo.

Nếu có bất kỳ sự gian lận nào, em xin hoàn toàn chịu trách nhiệm trước Hội đồng chấm bảo vệ và các quy định của nhà trường.

Hà Nội/TP.HCM, ngày... tháng... năm 202...
Sinh viên thực hiện
(Ký và ghi rõ họ tên)

---
<div style="page-break-after: always"></div>

## MỤC LỤC
1. CHƯƠNG 1: TỔNG QUAN DỰ ÁN
2. CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ SỬ DỤNG
3. CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG
4. CHƯƠNG 4: TRIỂN KHAI VÀ KẾT QUẢ ĐẠT ĐƯỢC
5. CHƯƠNG 5: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN
6. TÀI LIỆU THAM KHẢO

---
<div style="page-break-after: always"></div>

## CHƯƠNG 1: TỔNG QUAN DỰ ÁN

### 1.1. Lý do chọn đề tài
Trong kỷ nguyên công nghệ 4.0 và quá trình chuyển đổi số đang diễn ra mạnh mẽ ở mọi lĩnh vực, ngành công nghiệp giải trí nói chung và kinh doanh rạp chiếu phim nói riêng cũng không nằm ngoài xu thế đó. Trước đây, mô hình quản lý rạp chiếu phim truyền thống phụ thuộc nhiều vào quy trình thủ công: khách hàng phải đến tận nơi để xếp hàng mua vé, nhân viên kiểm soát vé bằng giấy, quản lý doanh thu qua sổ sách hoặc các hệ thống offline cồng kềnh. Điều này gây ra nhiều bất cập:
- **Đối với khách hàng:** Tốn thời gian di chuyển, chờ đợi, thường xuyên gặp tình trạng hết vé hoặc không chọn được chỗ ngồi ưng ý.
- **Đối với rạp chiếu:** Tốn kém chi phí nhân sự cho khâu bán vé và kiểm soát vé. Khó khăn trong việc linh hoạt thay đổi giá vé theo giờ cao điểm hay các chương trình khuyến mãi. Thống kê doanh thu chậm trễ, khó đưa ra các quyết định kinh doanh kịp thời.

Xuất phát từ thực tế đó, việc xây dựng một "Hệ thống quản lý và đặt vé rạp chiếu phim trực tuyến" là vô cùng cần thiết. Hệ thống không chỉ giúp khách hàng có trải nghiệm mua vé nhanh chóng, tiện lợi qua Internet mà còn cung cấp một công cụ quản trị mạnh mẽ cho chủ rạp để tự động hóa các quy trình từ lên lịch chiếu, quản lý sơ đồ ghế, đến thống kê doanh thu theo thời gian thực.

### 1.2. Mục tiêu dự án
Dự án được thực hiện nhằm mục đích xây dựng một giải pháp phần mềm toàn diện cho hệ thống rạp chiếu phim, bao gồm:
1. **Xây dựng hệ thống Backend API (RESTful):** Xử lý toàn bộ logic nghiệp vụ, đặc biệt là các logic phức tạp như: thuật toán tính giá vé động (dựa trên giờ chiếu, loại ghế, khuyến mãi), cơ chế khóa ghế (Concurrency Lock) khi có nhiều người đặt cùng lúc, và quản lý bảo mật phân quyền.
2. **Xây dựng ứng dụng Web Client dành cho Khách hàng:** Giao diện trực quan, thân thiện giúp người dùng dễ dàng tra cứu lịch chiếu, chọn ghế trực tiếp trên sơ đồ phòng chiếu và thực hiện thanh toán trực tuyến.
3. **Xây dựng ứng dụng Web Admin dành cho Quản lý:** Bảng điều khiển (Dashboard) hỗ trợ quản lý danh mục phim, tạo phòng chiếu, thiết lập suất chiếu, cấu hình giá vé và xem báo cáo thống kê.
4. **Tích hợp các dịch vụ hiện đại:** Tích hợp cổng thanh toán trực tuyến (PayOS/SePay) để tự động hóa giao dịch; tích hợp WebSocket để đồng bộ trạng thái ghế ngồi theo thời gian thực.

### 1.3. Đối tượng và phạm vi nghiên cứu
- **Đối tượng nghiên cứu:** Quy trình hoạt động nghiệp vụ của rạp chiếu phim (quản lý kho phim, xếp lịch chiếu, quy trình bán vé và soát vé).
- **Phạm vi hệ thống:**
  - Nền tảng: Ứng dụng nền web (Web Application).
  - Đối tượng sử dụng: Khách hàng (Users), Quản trị viên (Admins), và Nhân viên kiểm soát vé (Staff).

---
<div style="page-break-after: always"></div>

## CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ SỬ DỤNG

### 2.1. Kiến trúc tổng thể của hệ thống
Hệ thống được thiết kế theo mô hình **Client-Server** với kiến trúc **RESTful API**. Trong đó:
- **Client (Frontend):** Được chia làm 2 ứng dụng độc lập (Client App và Admin App), chịu trách nhiệm hiển thị giao diện và tương tác trực tiếp với người dùng.
- **Server (Backend):** Cung cấp các endpoint API để xử lý nghiệp vụ, giao tiếp với Cơ sở dữ liệu và các bên thứ ba (Third-party APIs). Hai thành phần này giao tiếp với nhau qua giao thức HTTP/HTTPS sử dụng định dạng dữ liệu JSON.

### 2.2. Công nghệ phía Backend (Java Spring Boot)

#### 2.2.1. Framework Spring Boot
Spring Boot (phiên bản 3.x) là một bộ khung (framework) mã nguồn mở dựa trên Java. Nó được chọn làm công nghệ cốt lõi cho Backend vì:
- Cung cấp tính năng Auto-configuration giúp thiết lập dự án nhanh chóng, loại bỏ các file cấu hình XML phức tạp của Spring truyền thống.
- Tích hợp sẵn máy chủ web nhúng (Embedded Tomcat), giúp ứng dụng có thể chạy trực tiếp như một file thực thi độc lập (standalone).

#### 2.2.2. Spring Data JPA & Hibernate
Để tương tác với Cơ sở dữ liệu MySQL, dự án sử dụng Spring Data JPA kết hợp cùng Hibernate (ORM - Object-Relational Mapping). Công nghệ này cho phép ánh xạ các bảng trong CSDL thành các đối tượng (Entity) trong Java. Thay vì viết các câu lệnh SQL truyền thống, lập trình viên có thể thao tác với dữ liệu thông qua các hàm Java (ví dụ: `save()`, `findById()`, `delete()`), giúp tăng tốc độ phát triển và hạn chế lỗi cú pháp SQL.

#### 2.2.3. Spring Security & JWT (JSON Web Token)
Bảo mật là yếu tố sống còn của hệ thống đặt vé. Dự án sử dụng Spring Security kết hợp với chuẩn JWT để xác thực (Authentication) và phân quyền (Authorization).
- Khi người dùng đăng nhập thành công, máy chủ sẽ tạo ra một chuỗi JWT mã hóa và gửi về Client.
- Trong các yêu cầu (request) sau đó, Client đính kèm JWT vào HTTP Header (`Authorization: Bearer <token>`). Server sẽ giải mã để biết đó là ai và có quyền truy cập vào chức năng (Admin/User) hay không, tạo ra một hệ thống Stateless an toàn, dễ mở rộng.

#### 2.2.4. Công nghệ WebSocket (STOMP)
Một trong những điểm nổi bật của hệ thống là khả năng đồng bộ trạng thái ghế. Khi Khách hàng A đang chọn ghế VIP số 5, ghế này cần lập tức chuyển sang trạng thái "Đang giữ" và hiển thị màu xám trên màn hình của Khách hàng B. Giao thức HTTP truyền thống (cơ chế request-response) không thể làm được việc Server chủ động gửi dữ liệu về Client. Do đó, dự án tích hợp **Spring WebSocket với giao thức STOMP** (Simple Text Oriented Messaging Protocol) để tạo kênh kết nối 2 chiều liên tục (full-duplex) giữa Server và Client, đảm bảo dữ liệu ghế luôn đồng bộ theo thời gian thực.

### 2.3. Công nghệ phía Frontend

#### 2.3.1. Nền tảng ReactJS và Vite
Cả hai ứng dụng Client và Admin đều được xây dựng bằng thư viện ReactJS phiên bản mới nhất. React sử dụng cơ chế Virtual DOM giúp tăng tốc độ cập nhật giao diện mà không cần tải lại trang (Single Page Application - SPA).
Đối với ứng dụng Client, dự án sử dụng công cụ build **Vite** thay vì Webpack. Vite cung cấp tốc độ khởi động server phát triển (dev server) và Hot Module Replacement (HMR) cực kỳ nhanh chóng, tối ưu hóa trải nghiệm lập trình. Đồng thời dự án sử dụng ngôn ngữ **TypeScript** giúp bắt lỗi chặt chẽ (strict typing), hạn chế tối đa các lỗi runtime.

#### 2.3.2. Quản lý UI/UX (TailwindCSS, Radix UI & MUI)
- **TailwindCSS (v4):** Là một framework CSS theo hướng tiện ích (utility-first). Thay vì viết các file CSS khổng lồ, giao diện được cấu trúc thông qua các class nhúng trực tiếp vào thẻ HTML. Việc này giúp tốc độ code UI tăng lên đáng kể và đảm bảo thiết kế có tính nhất quán (Design System).
- **Radix UI (Shadcn/UI):** Sử dụng cho trang Client. Đây là các component không có style (headless components) có sẵn tính năng truy cập (accessibility), kết hợp cùng Tailwind tạo ra giao diện hiện đại, tối giản.
- **Material UI (MUI):** Sử dụng cho trang Admin vì cung cấp sẵn các bộ Data Table, Form, Dialog rất mạnh mẽ cho quản trị dữ liệu.

### 2.4. Cơ sở dữ liệu và Third-Party Services
- **Hệ quản trị CSDL MySQL:** Cung cấp tính năng quan hệ mạnh mẽ (RDBMS) để lưu trữ các bảng Movie, Room, Seat, Booking một cách nhất quán, có ràng buộc toàn vẹn (ACID).
- **PayOS / SePay:** Cổng trung gian thanh toán tích hợp API tự động tạo mã QR VietQR. Khi khách hàng quét mã và chuyển khoản, ngân hàng sẽ bắn Webhook về Server hệ thống để tự động chuyển trạng thái đơn hàng thành Đã Thanh Toán (PAID).
- **Cloudinary:** Dịch vụ lưu trữ ảnh đám mây. Khi Admin tải poster phim lên, ảnh sẽ được gửi lên Cloudinary, và CSDL chỉ lưu đường dẫn URL trả về, giúp giảm tải cho Server máy chủ.
- **Thư viện html5-qrcode:** Tích hợp trực tiếp trên Frontend Admin để sử dụng Camera điện thoại/Laptop quét mã QR trên vé điện tử của khách khi đến rạp.

---
<div style="page-break-after: always"></div>

## CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG

### 3.1. Phân tích yêu cầu chức năng
Qua khảo sát nghiệp vụ thực tế, hệ thống được phân rã thành hai nhóm chức năng chính dựa trên vai trò người dùng:

**Đối với Khách hàng (User):**
- Đăng nhập, Đăng ký, Quản lý tài khoản cá nhân.
- Xem danh sách phim (Đang chiếu, Sắp chiếu).
- Xem chi tiết phim (Đạo diễn, diễn viên, nội dung, trailer, độ tuổi giới hạn).
- Tra cứu lịch chiếu theo ngày, theo phòng chiếu.
- Chọn vị trí ghế ngồi trực tiếp trên sơ đồ rạp.
- Xác nhận đơn hàng và thanh toán trực tuyến qua mã QR.
- Xem lịch sử giao dịch và nhận vé điện tử (QR Code).

**Đối với Quản trị viên (Admin):**
- Quản lý kho Phim (Thêm, sửa, xóa, tải poster).
- Quản lý Phòng chiếu (Tạo phòng, định cấu hình số lượng hàng/cột, đánh dấu hàng VIP).
- Quản lý Suất chiếu (Xếp lịch phim vào các phòng trong các mốc thời gian cụ thể).
- Quét mã QR kiểm duyệt vé khách hàng.
- Cấu hình hệ thống động (Settings: Thay đổi giá phụ thu giờ cao điểm, phụ thu cuối tuần, giá ghế VIP, các chương trình giảm giá cho Học sinh sinh viên/Người cao tuổi).
- Xem biểu đồ thống kê doanh thu theo thời gian, theo rạp.

### 3.2. Sơ đồ Use Case (Biểu đồ Tình huống sử dụng)

*Hướng dẫn cho Word: Chỗ này bạn lên draw.io vẽ 2 hình tròn (Admin và User) nối tới các hình ellipse đại diện cho các chức năng ở mục 3.1 rồi chèn hình vào.*

**(Minh họa Sơ đồ Use Case Đặt vé của Khách hàng):**
1. Khách hàng chọn mục "Đặt vé".
2. Khách hàng thực hiện luồng: Chọn Phim -> Chọn Suất chiếu -> Chọn Ghế.
3. Nếu khách hàng chưa đăng nhập, hệ thống yêu cầu (<<include>>) quá trình Đăng nhập.
4. Sau khi chọn ghế, hệ thống yêu cầu (<<include>>) quá trình Thanh toán.

### 3.3. Quy tắc nghiệp vụ (Business Rules)

Đây là các thuật toán phức tạp được phân tích và thiết kế trong hệ thống:

**A. Thuật toán Tính Giờ kết thúc suất chiếu (EndTime Calculation):**
Khi Admin xếp lịch chiếu, họ chỉ nhập vào `startTime` (Giờ bắt đầu). Hệ thống tự động tính toán:
`endTime` = `startTime` + `Movie.duration` (thời lượng phim, ví dụ 120 phút) + `15 phút` (thời gian cố định để nhân viên dọn dẹp rạp). 
Hệ thống sẽ chặn (Validate) nếu Admin cố tình xếp một lịch chiếu khác vào phòng chiếu này trước khi `endTime` kết thúc để tránh xung đột lịch rạp.

**B. Thuật toán Tính Giá Vé Động (Dynamic Pricing):**
Hệ thống không lưu cố định giá của một bộ phim, mà giá của một vé sẽ được tính tại thời điểm chạy thực tế (Runtime) dựa trên các cấu hình ở bảng Settings:
- `Giá gốc` = Lấy từ bảng `Room` (Giá cơ sở của phòng, ví dụ phòng IMAX sẽ đắt hơn phòng 2D) hoặc từ `Showtime`.
- `Phụ phí loại ghế` = Nếu người dùng chọn ghế VIP, cộng thêm `vipSeatSurcharge` (vd: +20.000 VNĐ).
- `Phụ phí giờ cao điểm` = Kiểm tra giờ của `Showtime`, nếu nằm trong khung 18:00 - 23:00, cộng thêm `%peakHourSurcharge` (vd: +20%).
- `Phụ phí cuối tuần` = Kiểm tra ngày chiếu, nếu là Thứ 7, CN, cộng thêm `%weekendSurcharge` (vd: +10%).
- `Giảm giá đối tượng` = Nếu người đặt chứng minh được là Sinh viên, giảm `%studentDiscount` (vd: -10%).

**C. Cơ chế Khóa Ghế (Concurrency - Holding Seat):**
Tránh tình trạng 2 người cùng thanh toán cho 1 ghế. Sơ đồ trạng thái của ghế (Seat Status):
- `Trạng thái 1 (Available)`: Ghế đang trống.
- `Trạng thái 3 (Holding)`: Khi User A click chọn, đổi sang Trạng thái 3. Ghi lại `holdTimestamp`. Lúc này User B nhìn thấy ghế xám, không click được.
- Máy chủ sẽ có một tác vụ ngầm (Background Job), liên tục quét các ghế đang ở Trạng thái 3. Nếu `thời gian hiện tại` - `holdTimestamp` > 15 phút mà đơn hàng (Booking) chưa được thanh toán (PENDING), hệ thống tự động reset ghế về Trạng thái 1 để người khác mua, đồng thời Hủy (Cancel) đơn hàng của User A.
- `Trạng thái 2 (Booked)`: Nếu User A thanh toán thành công trong 15 phút, cập nhật ghế thành Trạng thái 2 (Đã bán vĩnh viễn).

### 3.4. Thiết kế Cơ sở dữ liệu (Database Schema / ERD)

Dưới đây là chi tiết thiết kế các bảng trong hệ thống để đáp ứng các nghiệp vụ đã nêu:

#### Bảng 1: `movies` (Lưu thông tin phim)
| Tên cột | Kiểu dữ liệu | Đặc tính | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto-Inc | Mã phim |
| `title` | VARCHAR(255) | Not Null | Tên bộ phim |
| `description` | TEXT | | Mô tả nội dung |
| `duration` | INT | Not Null | Thời lượng phim (phút) |
| `genre` | VARCHAR(100) | | Thể loại phim |
| `age_restriction`| VARCHAR(20) | | Phân loại độ tuổi (P, C13, C18...) |
| `release_date` | DATE | | Ngày khởi chiếu |
| `poster_url` | VARCHAR(500) | | Link ảnh poster lưu trên Cloudinary |
| `director` | VARCHAR(255) | | Tên đạo diễn |
| `cast` | TEXT | | Danh sách diễn viên |

#### Bảng 2: `rooms` (Phòng chiếu)
| Tên cột | Kiểu dữ liệu | Đặc tính | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto-Inc | Mã phòng chiếu |
| `name` | VARCHAR(100) | Not Null | Tên phòng (VD: Phòng 01) |
| `type` | VARCHAR(50) | | Loại phòng (2D, 3D, IMAX) |
| `total_rows` | INT | Not Null | Tổng số hàng ghế (vd: 10) |
| `total_columns` | INT | Not Null | Tổng số cột (vd: 12) |
| `base_price` | DOUBLE | Not Null | Giá sàn của phòng này |

#### Bảng 3: `seats` (Danh sách ghế vật lý trong phòng)
| Tên cột | Kiểu dữ liệu | Đặc tính | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto-Inc | Mã ghế |
| `room_id` | BIGINT | FK (rooms) | Thuộc phòng chiếu nào |
| `row_name` | VARCHAR(10) | Not Null | Ký hiệu hàng (A, B, C...) |
| `col_index` | INT | Not Null | Chỉ số cột (1, 2, 3...) |
| `seat_type` | VARCHAR(20) | Not Null | NORMAL hoặc VIP |

#### Bảng 4: `showtimes` (Lịch chiếu)
| Tên cột | Kiểu dữ liệu | Đặc tính | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto-Inc | Mã suất chiếu |
| `movie_id` | BIGINT | FK (movies) | Chiếu phim gì |
| `room_id` | BIGINT | FK (rooms) | Chiếu ở phòng nào |
| `show_date` | DATE | Not Null | Ngày chiếu |
| `start_time` | TIME | Not Null | Giờ bắt đầu |
| `end_time` | TIME | Not Null | Giờ kết thúc (tính tự động) |
| `base_price` | DOUBLE | Not Null | Giá cơ sở của suất chiếu này |
| `status` | VARCHAR(20) | | ACTIVE, CLOSED |
| `active` | BOOLEAN | Default 1 | Kích hoạt cho phép đặt |

#### Bảng 5: `showtime_seats` (Trạng thái ghế của một suất chiếu cụ thể)
*Bảng này sinh ra để mapping giữa Seat và Showtime. 1 phòng có 100 ghế. Khi tạo 1 suất chiếu, hệ thống insert 100 bản ghi vào bảng này.*
| Tên cột | Kiểu dữ liệu | Đặc tính | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto-Inc | |
| `showtime_id` | BIGINT | FK | Thuộc suất chiếu nào |
| `seat_id` | BIGINT | FK | Thuộc ghế vật lý nào |
| `status` | INT | Default 1 | 1=Có sẵn, 2=Đã bán, 3=Đang giữ |
| `hold_timestamp` | TIMESTAMP | | Thời gian bắt đầu giữ ghế |

#### Bảng 6: `bookings` (Đơn hàng) và Bảng 7: `tickets` (Vé chi tiết)
*Mỗi Booking (Đơn hàng) của khách có thể chứa nhiều Ticket (Vé). Ví dụ mua 3 ghế cho 3 người thì có 1 Booking và 3 Tickets.*

**Bảng `bookings`:**
- `id` (PK)
- `user_id` (FK tới bảng users)
- `booking_time` (Thời gian tạo đơn)
- `total_price` (Tổng tiền cuối cùng sau giảm giá)
- `payment_status` (PENDING, PAID, CANCELLED)

**Bảng `tickets`:**
- `id` (PK)
- `booking_id` (FK tới bookings)
- `showtime_seat_id` (FK tới showtime_seats - để biết là vé cho ghế nào)
- `price` (Giá tiền của vé này)
- `ticket_code` (Chuỗi String mã hóa để làm mã QR)
- `status` (ACTIVE, USED - đã quét vào rạp, CANCELLED)

#### Bảng 8: `settings` (Cấu hình hệ thống)
*Bảng này chỉ có 1 row duy nhất với id=1.*
- `id` (PK)
- `cinema_name`, `address`, `phone_number`
- `student_discount` (Mức giảm giá SV)
- `weekend_surcharge` (Phụ phí cuối tuần)
- `peak_hour_surcharge` (Phụ phí cao điểm)
- `vip_seat_surcharge` (Phụ phí ghế VIP)

---
<div style="page-break-after: always"></div>

## CHƯƠNG 4: TRIỂN KHAI VÀ KẾT QUẢ ĐẠT ĐƯỢC

*(Trong bản Word, bạn cần chèn các ảnh chụp màn hình tương ứng vào dưới các mục này và thêm dòng caption ví dụ: Hình 4.1: Giao diện Trang chủ)*

### 4.1. Ứng dụng Client dành cho Khách Hàng

- **Giao diện Trang chủ & Danh sách phim:** Xây dựng bằng React Vite và TailwindCSS, giao diện Darkmode hiện đại. Hiển thị danh sách Carousel các phim Đang chiếu, Sắp chiếu với poster sắc nét.
- **Tính năng Đặt vé - Chọn lịch chiếu:** Khách hàng click vào phim để xem chi tiết. Chọn Ngày chiếu sẽ tải ra danh sách các Rạp và Giờ chiếu tương ứng.
- **Tính năng Cập nhật Sơ đồ ghế Real-time:** Màn hình quan trọng nhất hiển thị ma trận các ghế trong phòng. Ghế VIP có màu đặc trưng (Vàng/Đỏ), ghế thường màu xanh. Nhờ công nghệ WebSocket STOMP, khi khách bấm chọn 1 ghế, ghế đó đổi sang trạng thái "Đang chọn". Mọi người dùng khác đang truy cập trang này cùng lúc sẽ thấy ghế đó ngay lập tức chuyển sang màu xám (không thể bấm) mà không cần tải lại trang F5.
- **Tính năng Thanh toán Online:** Sau khi chọn ghế và áp dụng mã giảm giá sinh viên (nếu có), hệ thống tổng hợp giỏ hàng và hiển thị mã QR Code (tích hợp PayOS/SePay). Mã QR chứa sẵn thông tin STK rạp, số tiền chính xác lẻ đến từng đồng và lời nhắn chuyển khoản (VD: `BK12345`). Khách hàng dùng app ngân hàng quét mã, ngay khi chuyển khoản xong, màn hình tự động chuyển sang trang "Đặt vé thành công" nhờ cơ chế nhận Webhook ngầm từ ngân hàng gửi về Backend.
- **Quản lý vé điện tử:** Khách xem lại vé trong mục "Vé của tôi". Vé hiển thị dưới dạng thẻ (Card) đẹp mắt kèm 1 mã QR lớn. Khách chỉ cần mang mã này đến rạp.

### 4.2. Ứng dụng Bảng điều khiển dành cho Quản Trị Viên (Admin Dashboard)

- **Trang Tổng quan (Dashboard):** Hiển thị các Widget tóm tắt: Tổng số doanh thu trong tháng, số vé đã bán. Sử dụng thư viện Recharts để vẽ biểu đồ Cột doanh thu theo các ngày trong tuần, Biểu đồ Tròn tỷ lệ các bộ phim ăn khách nhất.
- **Quản lý Sơ đồ Phòng và Ghế:** Admin tạo mới phòng, điền Số Hàng (Rows) và Số Cột (Cols). Hệ thống tự sinh ma trận nút bấm. Admin có quyền click vào từng hàng ghế để đánh dấu đó là hàng ghế VIP (thay đổi trường `seat_type` trong CSDL).
- **Trang Cấu hình (Settings):** Cung cấp giao diện Form để Admin thay đổi các chỉ số `vip_seat_surcharge`, phần trăm giờ cao điểm. Ngay khi bấm Lưu, giá vé các suất chiếu chưa được thanh toán sẽ lập tức cập nhật theo luật giá mới này.
- **Tính năng Kiểm soát vé (Ticket Scanner):** Trang dành riêng cho nhân viên soát vé. Truy cập vào trang này trên điện thoại/Tablet, trình duyệt sẽ yêu cầu quyền mở Camera (dùng `html5-qrcode`). Nhân viên lia camera vào mã QR của khách. Hệ thống gửi API giải mã:
  - Nếu mã QR giả/sai: Hiển thị thông báo Lỗi màu Đỏ.
  - Nếu vé Đã sử dụng (`status = USED`): Thông báo vé đã bị check-in từ trước.
  - Nếu vé Hợp lệ (`ACTIVE`): Báo Xanh, cho khách qua cửa, đồng thời update status trong database thành `USED`.

---
<div style="page-break-after: always"></div>

## CHƯƠNG 5: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

### 5.1. Kết quả đạt được
Qua thời gian tìm hiểu và xây dựng, đồ án "Hệ thống quản lý và đặt vé rạp chiếu phim trực tuyến" đã hoàn thành tốt các mục tiêu ban đầu đề ra:
1. Xây dựng thành công hệ thống đa nền tảng gồm 2 ứng dụng Frontend độc lập (Client và Admin) kết nối với 1 Backend API bảo mật cao.
2. Ứng dụng thành thạo các công nghệ mới và mạnh mẽ như: ReactJS (Vite), TailwindCSS, Spring Boot 3, Spring Data JPA, JWT Security.
3. Giải quyết được bài toán khó nhất trong đặt vé là cơ chế Khóa ghế đồng thời (Concurrency Lock) và Real-time bằng WebSocket, ngăn chặn tình trạng bán trùng ghế.
4. Triển khai thuật toán tính giá vé động đa tham số linh hoạt, rất sát với nghiệp vụ rạp chiếu phim thực tế (CGV, Lotte).
5. Tích hợp thanh toán online quy trình khép kín, hoạt động ổn định không cần xác nhận thủ công.

### 5.2. Hạn chế còn tồn tại
- Hệ thống mới chỉ dừng lại ở giao diện Web (Responsive trên mobile), chưa có ứng dụng di động riêng (Native App iOS/Android) để tăng độ phủ sóng.
- Chưa có hệ thống gửi Email/SMS tự động nhắc lịch xem phim cho khách hàng khi sắp đến giờ chiếu.
- Chưa tích hợp dịch vụ bán kèm các sản phẩm phụ trợ như Combo Bắp - Nước uống (F&B) trong luồng đặt vé.

### 5.3. Hướng phát triển trong tương lai
Để phát triển dự án thành một sản phẩm thương mại hóa (SaaS), nhóm có định hướng:
- Mở rộng cấu trúc CSDL để thêm bảng `Products` (đồ ăn, thức uống) cho phép người dùng add-on vào `Booking`.
- Xây dựng hệ thống hạng thẻ thành viên (Membership: Standard, VIP, VVIP) và tích lũy điểm thưởng sau mỗi lần mua vé.
- Ứng dụng Khoa học Dữ liệu (Data Science) và Machine Learning trên lịch sử xem phim của khách hàng để làm Hệ thống Gợi ý (Recommendation System), gửi thông báo khi có phim hợp gu sắp ra rạp.

---
<div style="page-break-after: always"></div>

## TÀI LIỆU THAM KHẢO

1. Tài liệu chính thức của Spring Framework & Spring Boot. URL: https://spring.io/projects/spring-boot
2. Tài liệu chính thức của ReactJS. URL: https://react.dev/
3. Radix UI Primitives Documentation. URL: https://www.radix-ui.com/
4. Tailwind CSS Framework Documentation. URL: https://tailwindcss.com/
5. Hibernate ORM Documentation. URL: https://hibernate.org/orm/
6. Spring WebSocket and STOMP Guide. URL: https://docs.spring.io/spring-framework/reference/web/websocket.html
7. JSON Web Token Introduction. URL: https://jwt.io/introduction
8. PayOS / SePay API Integration Guide.
9. Các khóa học và diễn đàn hỗ trợ lập trình viên: StackOverflow, GitHub.
