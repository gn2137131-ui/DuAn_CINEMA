# API Request & Response Examples

## 1. Movie Management

### GET - Danh sách tất cả phim
```
GET /api/movies
```

**Response (200):**
```json
[
  {
    "id": 1,
    "title": "Avengers: Endgame",
    "description": "Phim hành động siêu anh hùng...",
    "duration": 180,
    "genre": "Action",
    "rating": "8.5/10",
    "ageRestriction": "PG-13",
    "releaseDate": "2024-05-12",
    "posterUrl": "https://cdn.example.com/poster.jpg",
    "director": "Russo Brothers",
    "cast": "Robert Downey Jr., Chris Evans, Scarlett Johansson"
  }
]
```

### POST - Thêm phim mới (Admin)
```
POST /api/movies/add
Content-Type: multipart/form-data

movie: {
  "title": "Avengers: Endgame",
  "description": "Phim hành động siêu anh hùng...",
  "duration": 180,
  "genre": "Action",
  "rating": "8.5/10",
  "ageRestriction": "PG-13",
  "releaseDate": "2024-05-12",
  "director": "Russo Brothers",
  "cast": "Robert Downey Jr., Chris Evans, Scarlett Johansson"
}
file: <image_file>
```

**Response (200):**
```json
{
  "id": 1,
  "title": "Avengers: Endgame",
  "posterUrl": "https://cloudinary.com/...",
  ...
}
```

---

## 2. Room Management

### GET - Danh sách phòng
```
GET /api/rooms
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Phòng 01",
    "type": "IMAX",
    "totalRows": 8,
    "totalColumns": 12,
    "basePrice": 100000,
    "seats": [...]
  }
]
```

### POST - Thêm phòng mới (Admin)
```
POST /api/rooms
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Phòng 01",
  "type": "IMAX",
  "totalRows": 8,
  "totalColumns": 12,
  "basePrice": 100000
}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Phòng 01",
  "type": "IMAX",
  "totalRows": 8,
  "totalColumns": 12,
  "basePrice": 100000,
  "seats": [
    {"id": 1, "rowName": "A", "colIndex": 1, "seatType": "NORMAL", "roomId": 1},
    {"id": 2, "rowName": "A", "colIndex": 2, "seatType": "NORMAL", "roomId": 1},
    ...
  ]
}
```

### PUT - Đánh dấu hàng ghế là VIP (Admin)
```
PUT /api/seats/update-row-vip?roomId=1&rowName=D
Authorization: Bearer <token>
```

**Response (200):**
```json
"Hàng D của phòng 1 đã được chuyển thành ghế VIP!"
```

---

## 3. Showtime Management

### GET - Danh sách suất chiếu
```
GET /api/showtimes
```

**Response (200):**
```json
[
  {
    "id": 1,
    "movie": {
      "id": 1,
      "title": "Avengers: Endgame"
    },
    "room": {
      "id": 1,
      "name": "Phòng 01"
    },
    "show_date": "2024-05-12",
    "start_time": "18:00:00",
    "end_time": "21:15:00",
    "basePrice": 100000,
    "format": "IMAX",
    "status": "ACTIVE",
    "active": true
  }
]
```

### GET - Suất chiếu của phim cụ thể
```
GET /api/showtimes/filter?movieId=1&date=2024-05-12
```

**Response (200):**
```json
[
  {
    "id": 1,
    "show_date": "2024-05-12",
    "start_time": "18:00:00",
    "end_time": "21:15:00",
    "basePrice": 100000,
    "format": "IMAX",
    "status": "ACTIVE",
    "active": true
  },
  {
    "id": 2,
    "show_date": "2024-05-12",
    "start_time": "20:30:00",
    "end_time": "23:45:00",
    "basePrice": 100000,
    "format": "2D",
    "status": "FULL",
    "active": true
  }
]
```

### POST - Tạo suất chiếu mới (Admin)
```
POST /api/showtimes
Content-Type: application/json
Authorization: Bearer <token>

{
  "movieId": 1,
  "roomId": 1,
  "show_date": "2024-05-12",
  "start_time": "18:00:00",
  "basePrice": 100000,
  "format": "IMAX",
  "status": "ACTIVE",
  "active": true
}
```

**Response (200):**
```json
{
  "id": 1,
  "movieId": 1,
  "roomId": 1,
  "show_date": "2024-05-12",
  "start_time": "18:00:00",
  "end_time": "21:15:00",
  "basePrice": 100000,
  "format": "IMAX",
  "status": "ACTIVE",
  "active": true
}
```

---

## 4. Seat & ShowtimeSeat

### GET - Danh sách ghế của phòng
```
GET /api/seats?roomId=1
```

**Response (200):**
```json
[
  {
    "id": 1,
    "roomId": 1,
    "rowName": "A",
    "colIndex": 1,
    "seatType": "NORMAL",
    "seatNumber": "A1"
  },
  {
    "id": 2,
    "roomId": 1,
    "rowName": "A",
    "colIndex": 2,
    "seatType": "NORMAL",
    "seatNumber": "A2"
  }
]
```

### GET - Ghế của suất chiếu (với trạng thái)
```
GET /api/showtime-seats?showtimeId=1
```

**Response (200):**
```json
[
  {
    "id": 101,
    "showtimeId": 1,
    "seat": {
      "id": 1,
      "rowName": "A",
      "colIndex": 1,
      "seatType": "NORMAL"
    },
    "status": 1  // 1 = Available (có sẵn), 2 = Booked (đã bán), 3 = Holding (đang giữ)
  },
  {
    "id": 102,
    "showtimeId": 1,
    "seat": {
      "id": 2,
      "rowName": "A",
      "colIndex": 2,
      "seatType": "NORMAL"
    },
    "status": 2  // Đã bán
  }
]
```

---

## 5. Booking & Ticket

### POST - Tạo booking mới
```
POST /api/bookings/create
Content-Type: application/json
Authorization: Bearer <token>

{
  "showtimeSeatIds": [101, 102, 150],
  "discountType": "STUDENT"
}
```

**Parameters:**
- `showtimeSeatIds`: Danh sách ID ShowtimeSeat
- `discountType`: null, "STUDENT", "ELDER", "CHILD"

**Response (200):**
```json
{
  "id": 1,
  "user": {
    "id": 5,
    "username": "john_doe"
  },
  "bookingTime": "2024-05-12T10:30:00",
  "totalPrice": 342000,
  "paymentStatus": "PENDING",
  "tickets": [
    {
      "id": 1,
      "price": 108000,
      "ticketCode": "550e8400-e29b-41d4-a716-446655440000",
      "status": "ACTIVE",
      "showtimeSeat": {
        "id": 101,
        "seat": {
          "rowName": "A",
          "colIndex": 1,
          "seatType": "NORMAL"
        }
      }
    },
    {
      "id": 2,
      "price": 108000,
      "ticketCode": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "status": "ACTIVE",
      "showtimeSeat": {
        "id": 102,
        "seat": {
          "rowName": "A",
          "colIndex": 2,
          "seatType": "NORMAL"
        }
      }
    },
    {
      "id": 3,
      "price": 126000,
      "ticketCode": "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
      "status": "ACTIVE",
      "showtimeSeat": {
        "id": 150,
        "seat": {
          "rowName": "E",
          "colIndex": 5,
          "seatType": "VIP"
        }
      }
    }
  ]
}
```

### GET - Danh sách booking của user
```
GET /api/bookings/my
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "bookingTime": "2024-05-12T10:30:00",
    "totalPrice": 342000,
    "paymentStatus": "PENDING"
  },
  {
    "id": 2,
    "bookingTime": "2024-05-11T15:45:00",
    "totalPrice": 210000,
    "paymentStatus": "PAID"
  }
]
```

### GET - Chi tiết booking
```
GET /api/bookings/1
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "user": {"id": 5, "username": "john_doe"},
  "bookingTime": "2024-05-12T10:30:00",
  "totalPrice": 342000,
  "paymentStatus": "PENDING",
  "tickets": [...]
}
```

### PUT - Xác nhận thanh toán
```
PUT /api/bookings/1/confirm
Content-Type: application/json
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "bookingTime": "2024-05-12T10:30:00",
  "totalPrice": 342000,
  "paymentStatus": "PAID",
  "tickets": [
    {
      "id": 1,
      "price": 108000,
      "status": "ACTIVE",
      "ticketCode": "550e8400-e29b-41d4-a716-446655440000"
    }
  ]
}
```

**Error Response (400):**
```json
{
  "error": "Thanh toán thất bại!"
}
```

### PUT - Hủy booking
```
PUT /api/bookings/1/cancel
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Đã hủy booking thành công!"
}
```

**Error Response (400):**
```json
{
  "error": "Không thể hủy booking đã thanh toán!"
}
```

---

## 6. Settings

### GET - Lấy cấu hình chính
```
GET /api/settings/main
```

**Response (200):**
```json
{
  "id": 1,
  "cinemaName": "Cinema Galaxy",
  "email": "contact@cinemagalaxy.com",
  "phoneNumber": "1900 xxxx",
  "address": "123 Đường ABC, Quận XYZ, TP.HCM",
  "introduction": "Hệ thống rạp hiện đại nhất...",
  "studentDiscount": 0.1,
  "elderDiscount": 0.15,
  "childDiscount": 0.2,
  "weekendSurcharge": 0.1,
  "peakHourSurcharge": 0.2,
  "vipSeatSurcharge": 20000,
  "notes": "Ghi chú thêm"
}
```

### PUT - Cập nhật cấu hình (Admin)
```
PUT /api/settings/main
Content-Type: application/json
Authorization: Bearer <token>

{
  "cinemaName": "Cinema Galaxy Plus",
  "email": "support@cinemagalaxy.com",
  "phoneNumber": "1900 1234",
  "studentDiscount": 0.15,
  "elderDiscount": 0.2,
  "childDiscount": 0.25,
  "peakHourSurcharge": 0.25,
  "vipSeatSurcharge": 25000
}
```

**Response (200):**
```json
{
  "id": 1,
  "cinemaName": "Cinema Galaxy Plus",
  ...
}
```

---

## 7. Error Responses

### 401 - Unauthorized (Không có token hoặc token hết hạn)
```json
{
  "error": "Unauthorized"
}
```

### 403 - Forbidden (Không có quyền)
```json
{
  "error": "Bạn không có quyền xem booking này!"
}
```

### 400 - Bad Request
```json
{
  "error": "Danh sách ghế không được trống!"
}
```

### 404 - Not Found
```json
{
  "error": "Booking không tồn tại!"
}
```

### 500 - Internal Server Error
```json
{
  "error": "Lỗi khi lấy cấu hình: ..."
}
```

---

## 8. Tính Giá Vé - Ví Dụ Chi Tiết

### Scenario 1: Giờ Cao Điểm + Ghế VIP + Giảm Sinh Viên

```
Suất chiếu:
  - Ngày: 2024-05-12 (Thứ 2)
  - Giờ: 18:00
Room.basePrice: 100,000 VND
Ghế E5: VIP
Người mua: Sinh viên

Bước 1: Lấy giá cơ sở
  price = 100,000

Bước 2: Áp dụng phụ phí giờ cao điểm (18-23h)
  Là giờ cao điểm → price += 100,000 × 20% = 120,000

Bước 3: Áp dụng phụ phí cuối tuần (Sat-Sun)
  Thứ 2 (2024-05-12) → không phải cuối tuần → không áp dụng

Bước 4: Áp dụng phụ phí ghế VIP
  price += 20,000 = 140,000

Bước 5: Áp dụng giảm giá sinh viên (-10%)
  price = 140,000 × (1 - 0.1) = 126,000

KẾT QUẢ: 126,000 VND
```

### Scenario 2: Sáng Thường + Ghế NORMAL + Cuối Tuần + Giảm Người Cao Tuổi

```
Suất chiếu:
  - Ngày: 2024-05-11 (Thứ 7)
  - Giờ: 09:00
Room.basePrice: 100,000 VND
Ghế A1: NORMAL
Người mua: Người cao tuổi (60+)

Bước 1: Lấy giá cơ sở
  price = 100,000

Bước 2: Áp dụng phụ phí giờ cao điểm (18-23h)
  09:00 không phải giờ cao điểm → không áp dụng

Bước 3: Áp dụng phụ phí cuối tuần (Sat-Sun)
  Thứ 7 (2024-05-11) → là cuối tuần → price += 100,000 × 10% = 110,000

Bước 4: Áp dụng phụ phí ghế VIP
  Là ghế NORMAL → không áp dụng

Bước 5: Áp dụng giảm giá người cao tuổi (-15%)
  price = 110,000 × (1 - 0.15) = 93,500

KẾT QUẢ: 93,500 VND
```

---

## 9. Luồng Mua Vé - Toàn Bộ Process

```
1. Client: GET /api/showtimes?movieId=1
   → Backend trả về danh sách suất chiếu

2. Client: GET /api/showtime-seats?showtimeId=1
   → Backend trả về danh sách ghế với status

3. User chọn ghế A1, A2, E5 (VIP), loại giảm giá: STUDENT

4. Client: POST /api/bookings/create
   {
     "showtimeSeatIds": [101, 102, 150],
     "discountType": "STUDENT"
   }
   → Backend: 
      - Tính giá từng vé dựa trên Showtime + Seat + Settings
      - Tạo Booking (status=PENDING) + Tickets
      - Return totalPrice: 342,000

5. Client hiển thị: "Tổng tiền: 342,000 VND. Chọn phương thức thanh toán"

6. User chọn: MoMo / VNPay / Tại quầy
   → Gọi hàm thanh toán

7. Client: PUT /api/bookings/1/confirm
   → Backend:
      - Gọi PaymentService.processPayment()
      - Nếu thành công:
        * Booking.paymentStatus = PAID
        * ShowtimeSeat.status = 2 (BOOKED)
        * Ticket.status = ACTIVE
      - Gửi email + QR code

8. Client: Hiển thị "Thanh toán thành công! Vé đã được gửi về email"
```

---

**Cập nhật: 2024-05-12**
**Phiên bản: 1.0**
