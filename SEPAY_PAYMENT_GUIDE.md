# SePay QR Code Payment Integration Guide

## 🎯 Tổng Quan

Hệ thống rạp chiếu phim đã được tích hợp thanh toán SePay với mã QR. Khách hàng chỉ cần quét mã QR, chuyển tiền, và hệ thống tự động xác nhận thanh toán thành công.

## 🔄 Luồng Thanh Toán

```
1. Khách chọn vé & đồ ăn
   ↓
2. Nhấp "Thanh Toán" → Frontend gọi POST /api/bookings/create
   ↓
3. Backend tạo Booking (status = PENDING, tạo orderCode)
   ↓
4. Frontend gọi GET /api/bookings/{id}/qr-payment
   ↓
5. Backend trả về SePay QR Code URL
   ↓
6. Frontend hiển thị QR Code (Modal popup)
   ↓
7. Khách quét mã & chuyển tiền (thông qua ngân hàng hoặc SePay)
   ↓
8. SePay gọi webhook: POST /api/webhook/sepay
   ↓
9. Backend xác nhận thanh toán:
   - Cập nhật Booking.paymentStatus = "PAID"
   - Cập nhật ShowtimeSeat.status = 2 (BOOKED)
   - Cập nhật Ticket.status = "ACTIVE"
   ↓
10. Backend gửi event SSE → Frontend (payment-success)
   ↓
11. Frontend nhận event → Navigate sang trang /confirmation
```

## 📋 Chi Tiết Các Endpoint

### 1️⃣ Tạo Booking
**Endpoint:** `POST /api/bookings/create`

**Request:**
```json
{
  "showtimeSeatIds": [1, 2, 3],
  "bookingFoods": [],
  "customerInfo": {
    "name": "Nguyễn Văn A",
    "email": "user@example.com",
    "phone": "0987654321"
  },
  "discountCode": null
}
```

**Response:**
```json
{
  "id": 123,
  "orderCode": "DH1718520234567890",
  "bookingTime": "2024-06-13T10:30:00",
  "totalPrice": 342000,
  "paymentStatus": "PENDING",
  "user": { "id": 5, "username": "user@example.com" },
  "tickets": [...]
}
```

### 2️⃣ Lấy SePay QR Code
**Endpoint:** `GET /api/bookings/{id}/qr-payment`

**Response:**
```json
{
  "qrUrl": "https://img.vietqr.io/image/MB-0123456789-compact2.png?amount=342000&addInfo=DH123&accountName=CINEMA",
  "qrData": "https://api.vietqr.io/image/MB-0123456789-compact2.png?amount=342000&addInfo=DH123&accountName=CINEMA",
  "bookingId": 123,
  "orderCode": "DH123",
  "amount": 342000,
  "description": "DH123"
}
```

### 3️⃣ SePay Webhook
**Endpoint:** `POST /api/webhook/sepay`

**Request (từ SePay):**
```json
{
  "code": "DH1718520234567890",
  "transferAmount": 342000,
  "referenceCode": "BANK123456",
  "description": "DH123",
  "transactionDate": "2024-06-13T10:35:00",
  "transferName": "NGUYEN VAN A",
  "transferIdNo": "0123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thanh toán đã được xác nhận"
}
```

## 🛠️ Cấu Hình

### Backend (application.properties)
```properties
# SePay Configuration
sepay.api.key=JAVA_SPRINGBOOT_SEPAY_8080
sepay.api.account-number=0123456789        # Số tài khoản nhận
sepay.api.account-name=CINEMA              # Tên tài khoản
```

### Frontend (axiosClient)
- Base URL: `http://localhost:8080/api`
- Authentication: Token Bearer (JWT)

## 📱 Các File Quan Trọng

### Backend
```
src/main/java/com/cinema/ticketsystem/
├── config/
│   └── SePay.java                    # Config SePay
├── dto/
│   ├── QrCodeResponse.java           # Response QR Code
│   └── SePayWebhookRequest.java      # Webhook DTO
├── controller/
│   ├── BookingController.java        # +GET /{id}/qr-payment
│   └── WebhookController.java        # +NotificationService
├── service/
│   ├── payment/
│   │   └── PaymentService.java       # +generateSePayQrCode()
│   └── cinema/
│       └── BookingService.java       # Return Long from webhook
└── entity/
    └── Booking.java                  # orderCode, transactionReference
```

### Frontend
```
src/pages/
└── Checkout.tsx
    ├── handlePayment()         # Call /api/bookings/create
    │                          # Then /api/bookings/{id}/qr-payment
    ├── QR Code Display        # Modal popup
    └── SSE Listener           # payment-success event
```

## 🧪 Hướng Dẫn Test

### Test 1: Tạo Booking & Lấy QR Code
1. Mở trang `/checkout`
2. Chọn vé & đồ ăn
3. Nhấp "Thanh Toán"
4. Kiểm tra Console: 
   - Booking ID được trả về
   - QR URL được lấy thành công
5. Kiểm tra Modal: QR Code hiển thị

### Test 2: Webhook (Manual Test)
```bash
# Curl test webhook
curl -X POST http://localhost:8080/api/webhook/sepay \
  -H "Content-Type: application/json" \
  -d '{
    "code": "DH1718520234567890",
    "transferAmount": 342000,
    "referenceCode": "BANK123456",
    "description": "DH123",
    "transactionDate": "2024-06-13T10:35:00",
    "transferName": "NGUYEN VAN A",
    "transferIdNo": "0123456789"
  }'
```

### Test 3: SSE Event
Kiểm tra trong Chrome DevTools:
1. Mở Console
2. Tìm `new EventSource('/api/notifications/subscribe/...')`
3. Khi webhook được xử lý, sẽ nhận event: `payment-success`
4. Frontend navigate sang `/confirmation`

## 🐛 Troubleshooting

### QR Code không hiển thị
- Kiểm tra: Booking ID có được trả về?
- Kiểm tra Console: Có error gì?
- Kiểm tra Network: GET `/api/bookings/{id}/qr-payment` có 200?

### Webhook không được trigger
- Kiểm tra: SePay đã được cấu hình đúng URL?
- Test manual: Curl webhook có thành công?
- Kiểm tra logs Backend: `SEPAY WEBHOOK: ...` có log?

### SSE Event không được nhận
- Kiểm tra: Có EventSource listener?
- Kiểm tra Network: Subscribe endpoint có 200?
- Kiểm tra: Webhook có trigger notification?

### Booking không chuyển sang PAID
- Kiểm tra: Booking ID có match?
- Kiểm tra: Số tiền có đủ?
- Kiểm tra logs: `Gạch nợ thành công` có log?

## 📊 Database Changes

### Booking Entity (Đã Có)
```sql
ALTER TABLE bookings ADD COLUMN order_code VARCHAR(50) UNIQUE NOT NULL;
ALTER TABLE bookings ADD COLUMN transaction_reference VARCHAR(100);
ALTER TABLE bookings ADD COLUMN payment_time DATETIME;
```

## 🔒 Security Notes

1. **Webhook Verification**: Hiện tại chưa verify signature từ SePay
   - TODO: Thêm HMAC verification
   - Cần bảo mật webhook key trong environment

2. **Idempotency**: Đã implement
   - Nếu booking đã PAID, sẽ bỏ qua duplicate webhook

3. **Amount Validation**: Đã implement
   - Kiểm tra số tiền chuyển >= tổng tiền

## 🚀 Cách Deploy

### 1. Backend
```bash
# Maven build
mvn clean install

# Run
java -jar target/ticketsystem-0.0.1-SNAPSHOT.jar
```

### 2. Frontend
```bash
cd frontendcinema-v2
npm install
npm run build
npm run preview  # or npm run dev
```

### 3. Configure SePay Webhook
- Vào SePay Dashboard
- Thêm Webhook URL: `https://yourdomain.com/api/webhook/sepay`
- Copy API Key vào `application.properties`

## 📞 API Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | OK | Thành công |
| 400 | Bad Request | Số tiền thiếu, booking không tồn tại |
| 403 | Forbidden | Không có quyền |
| 404 | Not Found | Booking không tìm thấy |
| 500 | Server Error | Lỗi hệ thống |

## 📝 Next Steps

1. [ ] Implement HMAC signature verification
2. [ ] Add payment timeout handling (30 mins)
3. [ ] Add email confirmation with QR code
4. [ ] Add payment history/tracking
5. [ ] Support multiple payment methods
6. [ ] Add refund functionality

---

**Created:** 2024-06-13  
**Version:** 1.0  
**Status:** Ready for Testing
