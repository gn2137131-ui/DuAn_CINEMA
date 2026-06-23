# Cấu Trúc Dữ Liệu và Luồng Xử Lý Hệ Thống Rạp Chiếu Phim

## 1. Sơ Đồ Quan Hệ Entity (Entity Relationship Diagram)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Cấu Trúc Dữ Liệu Phim                       │
└─────────────────────────────────────────────────────────────────┘

Movie (Phim)
├── id (PK)
├── title (Tên phim)
├── description (Mô tả)
├── duration (Thời lượng, phút) ⭐ Quan trọng: để tính EndTime
├── genre (Thể loại)
├── rating (Đánh giá)
├── ageRestriction (Giới hạn độ tuổi: G, PG, PG-13, R, NC-17)
├── releaseDate (Ngày phát hành)
├── posterUrl (URL poster)
├── director (Đạo diễn) ⭐ Mới thêm
└── cast (Diễn viên chính) ⭐ Mới thêm

    ↓ 1:N (One to Many)
    
Showtime (Suất chiếu) - Cầu nối giữa Movie và Room
├── id (PK)
├── movieId (FK → Movie) ⭐ Phim được chiếu
├── roomId (FK → Room) ⭐ Phòng chiếu
├── showDate (LocalDate) ⭐ Ngày chiếu (VD: 2024-05-20)
├── startTime (LocalTime) ⭐ Giờ bắt đầu (VD: 19:00)
├── endTime (LocalTime) ⭐ Giờ kết thúc (tính tự động = startTime + movie.duration + 15 phút)
├── basePrice (Double) ⭐ Giá sàn của suất chiếu
├── format (String) ⭐ Định dạng chiếu (2D/3D/IMAX)
├── status (String) ⭐ Trạng thái suất chiếu (ACTIVE/FULL/CLOSED)
├── active (Boolean) ⭐ Kích hoạt/vô hiệu hóa suất chiếu
└── ⚙️ Tính giá dựa trên: giờ cao điểm (18-23h +20%), cuối tuần (+10%), loại ghế VIP (+20k)

    ├─ 1:N (One to Many)
    │
    └→ ShowtimeSeat (Ghế trong suất chiếu)
       ├── id (PK)
       ├── showtimeId (FK → Showtime)
       ├── seatId (FK → Seat)
       ├── status (1: Có sẵn/Available, 2: Đã bán/Booked, 3: Đang giữ/Holding)
       └── holdTimestamp (Thời điểm bắt đầu giữ, để tính timeout)
           
           └─ 1:1 (One to One)
           
           └→ Ticket (Vé chi tiết)
              ├── id (PK)
              ├── bookingId (FK → Booking)
              ├── showtimeSeatId (FK → ShowtimeSeat)
              ├── price (Giá của vé này, đã bao gồm phụ phí + giảm giá)
              ├── ticketCode (Mã QR)
              └── status (ACTIVE, CANCELLED, USED) ⭐ Mới thêm

Room (Phòng chiếu)
├── id (PK)
├── name (Tên phòng, vd: Phòng 01)
├── type (Loại phòng, vd: IMAX, 2D, 3D)
├── totalRows (Số hàng ghế)
├── totalColumns (Số cột mỗi hàng)
└── basePrice (Giá cơ sở của phòng)

    ↓ 1:N (One to Many)
    
Seat (Ghế)
├── id (PK)
├── roomId (FK → Room)
├── rowName (Tên hàng, vd: A, B, C)
├── colIndex (Chỉ số cột, vd: 1, 2, 3)
├── seatType (Loại ghế: NORMAL hoặc VIP)
└── getSeatNumber() → rowName + colIndex (vd: A5)

Booking (Đơn hàng)
├── id (PK)
├── userId (FK → User)
├── bookingTime (Thời gian đặt)
├── totalPrice (Tổng tiền sau giảm giá)
├── paymentStatus (PENDING, PAID, CANCELLED)
└── 1:N → List<Ticket>

User (Người dùng)
├── id (PK)
├── username
├── email
├── password
└── role (ADMIN, USER)

Settings (Cấu hình rạp) ⭐ Mới thêm
├── id (PK, mặc định = 1)
├── cinemaName (Tên rạp)
├── email (Email liên hệ)
├── phoneNumber (Hotline)
├── address (Địa chỉ rạp)
├── introduction (Giới thiệu)
├── studentDiscount (% giảm cho sinh viên)
├── elderDiscount (% giảm cho người cao tuổi)
├── childDiscount (% giảm cho trẻ em)
├── weekendSurcharge (% phụ phí cuối tuần)
├── peakHourSurcharge (% phụ phí giờ cao điểm)
├── vipSeatSurcharge (Phụ phí ghế VIP, đơn vị: tiền)
└── notes (Ghi chú)
```

---

## 2. Luồng Xử Lý Dữ Liệu (Workflow)

### **Bước 1: Khởi Tạo (Admin)**

**Admin tạo Movie:**
```json
POST /api/movies/add
{
  "title": "Avengers: Endgame",
  "duration": 180,
  "genre": "Action",
  "ageRestriction": "PG-13",
  "releaseDate": "2024-01-15",
  "description": "Mô tả phim...",
  "director": "Russo Brothers",
  "cast": "Robert Downey Jr., Chris Evans, ...",
  "posterUrl": "https://..."
}
```

**Admin tạo Room:**
```json
POST /api/rooms
{
  "name": "Phòng 01",
  "type": "IMAX",
  "totalRows": 8,
  "totalColumns": 12,
  "basePrice": 100000
}
```

**Hệ thống tự động tạo Seat:**
- Tạo 8 × 12 = 96 ghế
- Hàng 1-3: NORMAL
- Hàng 4-8: VIP (phía trước màn hình)

**Admin tạo Showtime:**
```json
POST /api/showtimes
{
  "movieId": 1,
  "roomId": 1,
  "startTime": "2024-05-12T18:00:00",
  "basePrice": 100000,
  "active": true
}
```

**Hệ thống tự động:**
- Tính `endTime` = startTime + movie.duration (180) + 15 phút = 18:00 + 3h15 = 21:15
- Tạo ShowtimeSeat cho tất cả 96 ghế với status = 1 (có sẵn)

---

### **Bước 2: Chọn Chỗ (Client - Mobile/Web)**

**User xem danh sách Showtime:**
```json
GET /api/showtimes?movieId=1
```

**Hệ thống truy vấn ghế khả dụng:**
```sql
SELECT * FROM showtime_seats 
WHERE showtime_id = 1 
AND status = 1 
ORDER BY seat_id
```

**Ghế còn trống = Tất cả ghế - Ghế đã có Ticket với status = PAID**

**UI hiển thị sơ đồ ghế:**
```
    1    2    3    4    5    6    7    8    9   10   11   12
A [  ] [  ] [  ] [  ] [  ] [XX] [  ] [  ] [  ] [  ] [  ] [  ]  NORMAL
B [  ] [  ] [  ] [  ] [  ] [  ] [  ] [  ] [  ] [  ] [  ] [  ]  NORMAL
C [  ] [  ] [  ] [  ] [  ] [  ] [  ] [  ] [  ] [  ] [  ] [  ]  NORMAL
D [##] [  ] [  ] [  ] [  ] [  ] [  ] [  ] [  ] [  ] [  ] [##]  VIP
E [##] [  ] [  ] [  ] [  ] [  ] [  ] [  ] [  ] [  ] [  ] [##]  VIP
...

[XX] = Đã bán (PAID)
[##] = VIP
[  ] = Trống (CÓ SẴN)
```

---

### **Bước 3: Tính Tiền (Service Logic)**

**User chọn ghế:** A1, A2, E5 (ghế VIP) và gửi request:
```json
POST /api/bookings/create
{
  "showtimeSeatIds": [1, 2, 50],
  "discountType": "STUDENT"  // null, "STUDENT", "ELDER", "CHILD"
}
```

**ShowtimeService.calculateFinalTicketPrice():**

```
Showtime: 2024-05-12 18:00:00 (thứ 2)
basePrice từ Room = 100,000

Cho ghế A1 (NORMAL):
  price = 100,000
  - Giờ cao điểm (18h)? YES → price += 100,000 × 20% = 120,000
  - Cuối tuần? NO
  - VIP? NO
  → Giá trước giảm: 120,000
  - Giảm sinh viên (10%)? YES → 120,000 × 90% = 108,000 ✓

Cho ghế A2 (NORMAL):
  price = 100,000
  - Giờ cao điểm (18h)? YES → price = 120,000
  - VIP? NO
  - Giảm sinh viên? YES → 108,000 ✓

Cho ghế E5 (VIP):
  price = 100,000
  - Giờ cao điểm (18h)? YES → price = 120,000
  - VIP? YES → price += 20,000 = 140,000
  - Giảm sinh viên (10%)? YES → 140,000 × 90% = 126,000 ✓

TỔNG BOOKING: 108,000 + 108,000 + 126,000 = 342,000 VND
```

**Luồng tính toán chi tiết:**
```
1. Lấy giá từ Showtime.basePrice
2. Áp dụng phụ phí giờ cao điểm (nếu 18-23h): +20%
3. Áp dụng phụ phí cuối tuần (Sat-Sun): +10%
4. Áp dụng phụ phí ghế VIP: +20,000 VND
5. Áp dụng giảm giá theo đối tượng:
   - Sinh viên: -10%
   - Người cao tuổi: -15%
   - Trẻ em: -20%
6. Tính tổng cho tất cả vé
```

---

### **Bước 4: Thanh Toán & Xác Nhận**

**BookingService.createBooking():**
```
1. Tạo bản ghi Booking với status = "PENDING"
2. Tạo Ticket cho từng ghế (với price đã tính)
3. Ticket.status = "ACTIVE"
4. Lưu xuống Database
5. Return Booking để client thanh toán
```

**Client gọi thanh toán:**
```json
PUT /api/bookings/1/confirm
```

**BookingService.confirmBooking():**
```
1. Kiểm tra Booking.paymentStatus == "PENDING"
2. Gọi PaymentService.processPayment()
3. Nếu thành công:
   - Booking.paymentStatus = "PAID"
   - Cập nhật ShowtimeSeat.status = 2 (BOOKED)
   - Ticket.status = "ACTIVE" (đã thanh toán)
4. Gửi email với vé QR Code
```

**Hủy Booking:**
```json
PUT /api/bookings/1/cancel
```

```
1. Kiểm tra Booking.paymentStatus == "PENDING"
2. Cập nhật ShowtimeSeat.status = 1 (CÓ SẴN)
3. Ticket.status = "CANCELLED"
4. Xóa Booking
```

---

## 3. Ví Dụ API Endpoints

### **Movie**
- `GET /api/movies` - Danh sách phim
- `POST /api/movies/add` - Thêm phim mới (Admin)
- `PUT /api/movies/{id}` - Sửa phim (Admin)
- `DELETE /api/movies/{id}` - Xóa phim (Admin)

### **Room**
- `GET /api/rooms` - Danh sách phòng
- `POST /api/rooms` - Thêm phòng mới (Admin)
- `PUT /api/rooms/{id}` - Sửa phòng (Admin)

### **Showtime**
- `GET /api/showtimes` - Danh sách suất chiếu
- `GET /api/showtimes?movieId=1` - Suất chiếu của phim
- `POST /api/showtimes` - Thêm suất chiếu (Admin)
- `PUT /api/showtimes/{id}` - Sửa suất chiếu (Admin)

### **Seat**
- `GET /api/seats?roomId=1` - Ghế của phòng
- `PUT /api/seats/update-row-vip?roomId=1&rowName=D` - Đánh dấu hàng VIP (Admin)

### **ShowtimeSeat**
- `GET /api/showtime-seats?showtimeId=1` - Ghế của suất chiếu

### **Booking**
- `GET /api/bookings/my` - Booking của user
- `GET /api/bookings/{id}` - Chi tiết booking
- `POST /api/bookings/create` - Tạo booking mới
- `PUT /api/bookings/{id}/confirm` - Xác nhận thanh toán
- `PUT /api/bookings/{id}/cancel` - Hủy booking

### **Settings**
- `GET /api/settings/main` - Cấu hình chính
- `PUT /api/settings/main` - Cập nhật cấu hình (Admin)
- `GET /api/settings` - Tất cả cấu hình (Admin)

---

## 4. Trạng Thái & Enum

### **Booking Status**
- `PENDING` - Chờ thanh toán
- `PAID` - Đã thanh toán
- `CANCELLED` - Đã hủy

### **ShowtimeSeat Status**
- `1` - Có sẵn (Available)
- `2` - Đã bán (Booked)
- `3` - Đang giữ (Holding, tạm thời)

### **Ticket Status**
- `ACTIVE` - Vé hợp lệ
- `USED` - Đã sử dụng (quét tại rạp)
- `CANCELLED` - Đã hủy

### **Showtime Active**
- `true` - Kích hoạt, khách có thể đặt
- `false` - Vô hiệu hóa, không cho đặt

---

## 5. Quy Tắc Kinh Doanh (Business Rules)

1. **Giá vé phụ thuộc vào:**
   - Suất chiếu (giờ cao điểm, cuối tuần)
   - Loại ghế (NORMAL vs VIP)
   - Đối tượng khách hàng (sinh viên, người cao tuổi, v.v.)

2. **Không lưu giá trực tiếp vào Movie** - Giá chỉ lưu ở:
   - Room.basePrice (giá cơ sở phòng)
   - Showtime.basePrice (giá sàn suất chiếu)
   - Ticket.price (giá cuối cùng sau phụ phí + giảm giá)

3. **Locking & Concurrency:**
   - Khi user chọn ghế, đó được "hold" (status = 3)
   - Nếu 15 phút chưa thanh toán, hệ thống tự nhả ghế
   - Khi confirm payment, ghế chuyển thành booked (status = 2)

4. **Validation:**
   - Showtime.endTime không được chồng chéo với suất chiếu khác cùng phòng
   - Seat.rowName + colIndex phải duy nhất trong Room
   - Ticket chỉ có thể xóa nếu Booking.paymentStatus = PENDING

---

## 6. Các Service Chính

### **ShowtimeService**
- `createShowtime()` - Tạo suất chiếu, tính endTime
- `calculateFinalTicketPrice()` - Tính giá vé từ Showtime + Seat + Settings

### **BookingService** (Mới)
- `createBooking()` - Tạo booking và tất cả tickets
- `confirmBooking()` - Xác nhận thanh toán
- `cancelBooking()` - Hủy booking

### **SettingsService** (Mới)
- `getMainSettings()` - Lấy cấu hình chính
- `updateSettings()` - Cập nhật cấu hình

---

## 7. Database Schema (SQL - Minh họa)

```sql
-- Tạo bảng settings
CREATE TABLE settings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  cinema_name VARCHAR(255),
  email VARCHAR(255),
  phone_number VARCHAR(20),
  address TEXT,
  introduction TEXT,
  student_discount DOUBLE DEFAULT 0.1,
  elder_discount DOUBLE DEFAULT 0.15,
  child_discount DOUBLE DEFAULT 0.2,
  weekend_surcharge DOUBLE DEFAULT 0.1,
  peak_hour_surcharge DOUBLE DEFAULT 0.2,
  vip_seat_surcharge DOUBLE DEFAULT 20000,
  notes TEXT
);

-- Cập nhật Showtime table
ALTER TABLE showtimes ADD COLUMN active BOOLEAN DEFAULT true;
ALTER TABLE showtimes CHANGE COLUMN price base_price DOUBLE;

-- Cập nhật Movie table
ALTER TABLE movies ADD COLUMN director VARCHAR(255);
ALTER TABLE movies ADD COLUMN cast TEXT;

-- Cập nhật Ticket table
ALTER TABLE tickets ADD COLUMN status VARCHAR(50) DEFAULT 'ACTIVE';
```

---

**Cập nhật: 2024-05-12**
**Phiên bản: 1.0**
