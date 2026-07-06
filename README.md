# 🎬 CineVerse - Hệ Thống Quản Lý Đặt Vé Rạp Chiếu Phim

CineVerse là một hệ thống quản lý rạp chiếu phim toàn diện, bao gồm cả nền tảng đặt vé dành cho khách hàng và hệ thống quản trị dành cho nhân viên/ban quản lý. Hệ thống cung cấp trải nghiệm mượt mà từ việc xem lịch chiếu, chọn ghế trực tuyến theo thời gian thực (real-time), áp dụng mã giảm giá, thanh toán, cho đến hệ thống điểm thưởng Loyalty và mini-game.

---

## 🌟 Tính Năng Nổi Bật

### 🧑‍💻 Dành cho Khách Hàng (Customer)
* **Đặt vé trực tuyến:** Tra cứu phim đang chiếu, sắp chiếu và lịch chiếu theo ngày.
* **Chọn ghế Real-time:** Hỗ trợ khóa ghế tức thời qua WebSocket, tránh tình trạng trùng ghế khi nhiều người cùng đặt.
* **Combo Bắp Nước:** Đặt kèm combo bắp nước trực tiếp lúc mua vé.
* **Thanh toán an toàn:** Hỗ trợ thanh toán nhanh chóng (QR Code / Webhook tự động xác nhận).
* **Quản lý vé & Lịch sử:** Vé điện tử gửi qua Email (kèm QR Code). Khách hàng có thể tra cứu lịch sử đặt vé dễ dàng.
* **Hệ thống Loyalty & Mini-games:** Tích điểm sau mỗi giao dịch, chơi vòng quay may mắn (Lucky Wheel) hoặc hứng bắp (Catch Popcorn) để đổi mã giảm giá.
* **Đánh giá (Review):** Khách hàng có thể để lại nhận xét và đánh giá cho phim đã xem.

### 🛡️ Dành cho Quản Trị Viên & Nhân Viên (Admin / Employee)
* **Dashboard thống kê:** Biểu đồ doanh thu, số lượng vé, người dùng mới.
* **Quản lý rạp & Lịch chiếu:** Thêm/sửa phim, quản lý phòng chiếu, sơ đồ ghế, và tạo suất chiếu tự động.
* **Quản lý mã giảm giá:** Tạo các mã giảm giá theo phần trăm hoặc số tiền cố định.
* **Quét vé (Scanner):** Nhân viên rạp sử dụng chức năng quét mã QR để kiểm tra vé tại cửa.
* **Bán vé tại quầy (POS):** Giao diện riêng biệt hỗ trợ nhân viên bán vé và combo trực tiếp tại rạp.
* **Quản trị phân quyền chặt chẽ:** Tách biệt quyền thao tác giữa Nhân viên và Quản trị viên (xem thêm chi tiết tại `SECURITY.md`).

---

## 🛠️ Công Nghệ Sử Dụng

**1. Backend (Spring Boot)**
* Java 17 / Spring Boot 3.x
* Spring Security & JWT (Json Web Token)
* Spring Data JPA / Hibernate
* WebSocket / STOMP (Real-time seat locking)
* JavaMailSender (Gửi vé điện tử)
* MySQL (Cơ sở dữ liệu)

**2. Frontend - Customer (`frontendcinema-v2`)**
* React 19 / TypeScript / Vite
* Tailwind CSS / Radix UI / Framer Motion (Hiệu ứng)
* React Router DOM
* STOMP.js / SockJS (Kết nối WebSocket)

**3. Frontend - Admin (`cinema_admin`)**
* React / JavaScript
* Tailwind CSS / Recharts (Biểu đồ thống kê)
* Axios (Gọi API)

---

## 📂 Cấu Trúc Thư Mục

```text
d:\ticketsystem\
 ├── src/                   # Source code Backend (Spring Boot)
 ├── frontendcinema-v2/     # Source code Frontend dành cho Khách hàng
 ├── cinema_admin/          # Source code Frontend dành cho Admin/Nhân viên
 ├── pom.xml                # File cấu hình Maven (Backend)
 ├── SECURITY.md            # Tài liệu kiến trúc bảo mật chi tiết
 └── README.md              # Tài liệu dự án
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### 1. Chạy Backend (Spring Boot)
1. Cấu hình database MySQL trong file `application-local.properties` (hoặc `application.properties`).
2. Mở terminal tại thư mục gốc của dự án (`d:\ticketsystem`)
3. Chạy lệnh:
   ```bash
   ./mvnw spring-boot:run
   ```
   *Backend sẽ chạy tại: `http://localhost:8080`*

### 2. Chạy Frontend Khách Hàng
1. Di chuyển vào thư mục `frontendcinema-v2`:
   ```bash
   cd frontendcinema-v2
   ```
2. Cài đặt thư viện và chạy ứng dụng:
   ```bash
   npm install
   npm run dev
   ```
   *Frontend Customer sẽ chạy tại: `http://localhost:5173` (hoặc port được Vite cấp)*

### 3. Chạy Frontend Admin
1. Di chuyển vào thư mục `cinema_admin`:
   ```bash
   cd cinema_admin
   ```
2. Cài đặt thư viện và chạy ứng dụng:
   ```bash
   npm install
   npm start
   ```
   *Frontend Admin sẽ chạy tại: `http://localhost:3000`*

---

## 🔐 Bảo Mật & Phân Quyền
Chi tiết về cơ chế mã hóa mật khẩu, phân luồng đăng nhập, xử lý bảo mật cho các Role (ADMIN, EMPLOYEE, CUSTOMER) đã được tài liệu hóa rõ ràng. 
👉 Vui lòng xem file [SECURITY.md](./SECURITY.md) để biết thêm chi tiết.

---

## 👥 Tác Giả
* Hệ thống được phát triển để phục vụ đồ án TTTN (Thực tập Tốt nghiệp).
* Developer: Nguyễn Thị Ngọc Giàu

