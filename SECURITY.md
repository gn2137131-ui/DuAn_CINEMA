# 🛡️ Kiến Trúc Bảo Mật — CineVerse Cinema System

> Tài liệu mô tả toàn bộ cơ chế xác thực, phân quyền và bảo mật của hệ thống đặt vé xem phim CineVerse.

---

## 1. 🏗️ Cấu Trúc Role

**File:** `src/main/java/com/cinema/ticketsystem/entity/user/Role.java`

```java
public enum Role {
    ADMIN,     // Quản trị viên — full access
    EMPLOYEE,  // Nhân viên     — truy cập giới hạn
    CUSTOMER   // Khách hàng    — dùng frontend chính
}
```

| Role | Mô tả |
|------|-------|
| `ADMIN` | Toàn quyền quản trị hệ thống |
| `EMPLOYEE` | Nhân viên rạp — quét vé, POS, xem booking |
| `CUSTOMER` | Khách hàng — đặt vé, xem lịch sử |

---

## 2. 🔐 Đăng Ký (Register)

**Chỉ `CUSTOMER` mới đăng ký được qua public API.**

**Files:** `AuthController.java` → `AuthService.java`

### Luồng xử lý

```
Client gửi RegisterRequest
  ├── username  (không trống)
  ├── email     (không trống)
  ├── phone     (đúng 10 chữ số)
  ├── password  (≥8 ký tự + 1 hoa + 1 số + 1 ký tự đặc biệt)
  └── fullName

AuthService.register():
  ├── Validate từng trường
  ├── Kiểm tra username/email đã tồn tại chưa
  ├── BCrypt encode password
  ├── Force set role = Role.CUSTOMER  ← client KHÔNG thể tự đặt ADMIN/EMPLOYEE
  ├── Lưu DB
  └── Trả về JWT token
```

> **Kết luận:** `RegisterRequest` DTO không có trường `role`.
> Client không thể tự set role `ADMIN`/`EMPLOYEE` qua API đăng ký.

---

## 3. 🔑 Đăng Nhập (Login)

**1 API dùng chung cho cả 3 role:** `POST /api/auth/login`

### Backend

```
AuthController.login({ username, password })
  → AuthService.login()
      → Tìm user theo username
      → Verify BCrypt password
      → JwtService.generateToken(user)
          → JWT claims: { "role": "ROLE_ADMIN" | "ROLE_CUSTOMER" | "ROLE_EMPLOYEE" }
  → Response: { token, role, username, user: { name, avatarUrl } }
```

### Frontend — Customer (`Login.tsx`)

```
POST /auth/login
  → Lưu token vào localStorage
  → Lưu user info với role = 'CUSTOMER'
  → Redirect về / (Home)
```

### Frontend — Admin (`Login.js`)

```
POST /auth/login
  → localStorage.setItem('token', res.data.token)
  → localStorage.setItem('role',  res.data.role)
  → localStorage.setItem('user',  { fullName, role, avatar })
  → Role-based redirect:
      EMPLOYEE → /admin/scanner
      ADMIN    → /admin/dashboard
```

---

## 4. 🛡️ Phân Quyền Backend

### 4.1 JWT Authentication Filter

**File:** `JwtAuthenticationFilter.java`

Mỗi request có header `Authorization: Bearer <token>`:

1. Extract `username` từ JWT
2. Extract `role` từ JWT → `"ROLE_ADMIN"` | `"ROLE_CUSTOMER"` | `"ROLE_EMPLOYEE"`
3. Tạo `SimpleGrantedAuthority("ROLE_ADMIN")`
4. Set vào `SecurityContextHolder`

---

### 4.2 SecurityConfig — Endpoint Rules

**File:** `SecurityConfig.java`

| Endpoint | Quyền truy cập |
|----------|----------------|
| `GET /api/movies/**` | 🔓 Public |
| `GET /api/showtimes/**` | 🔓 Public |
| `GET /api/showtime-seats/showtime/**` | 🔓 Public |
| `/api/auth/**` | 🔓 Public (login, register) |
| `GET /api/settings` | 🔓 Public |
| `GET /api/banner-config` | 🔓 Public |
| `GET /api/discount-codes/public` | 🔓 Public |
| `GET /api/snacks/**` | 🔓 Public |
| `/api/age-ratings` | 🔓 Public |
| `/api/webhook/**`, `/api/notifications/**`, `/ws-cinema/**` | 🔓 Public |
| `/api/admin/stats/**` | 🔒 `ADMIN` only |
| `/api/admin/loyalty/**` | 🔒 `ADMIN` only |
| `/api/movies/add` | 🔒 `ADMIN` only |
| `/api/rooms/**` | 🔒 `ADMIN` only |
| Tất cả endpoints còn lại | 🔒 Authenticated (bất kỳ role) |

> **Lưu ý:** `/api/bookings/**`, `/api/showtime-seats/hold`, `/api/users/**` yêu cầu
> xác thực nhưng **không** giới hạn role cụ thể ở `SecurityConfig`.
> Kiểm tra quyền chi tiết được thực hiện trong từng controller.

---

### 4.3 Controller-Level Role Checking

Pattern phổ biến:

```java
User currentUser = authService.getCurrentUser();
if (currentUser.getRole() != Role.ADMIN && currentUser.getRole() != Role.EMPLOYEE) {
    return ResponseEntity.status(403).body("Bạn không có quyền!");
}
```

| Controller | Endpoint | Role yêu cầu | Cách kiểm tra |
|------------|----------|--------------|---------------|
| `BookingController` | `GET /bookings` | CUSTOMER (chủ sở hữu) hoặc ADMIN/EMPLOYEE | `currentUser.getId()` vs `booking.getUser().getId()` |
| `BookingController` | `PUT /bookings/{id}/cancel` | ADMIN, EMPLOYEE, hoặc chủ sở hữu | Role + ownership |
| `BookingController` | `GET /bookings/all` | ADMIN, EMPLOYEE | Check role enum |
| `BookingController` | `GET /bookings/recent` | ADMIN, EMPLOYEE | Check role enum |
| `BookingController` | `POST /bookings/{id}/print-ticket` | ADMIN, EMPLOYEE | `@PreAuthorize` |
| `MovieController` | `POST/PUT/DELETE /movies` | ADMIN | `@PreAuthorize("hasRole('ADMIN')")` |
| `RoomController` | CRUD rooms | ADMIN | `@PreAuthorize("hasRole('ADMIN')")` |
| `ShowtimeSeatController` | `PUT /showtime-seats/release` | CUSTOMER (chủ sở hữu) hoặc ADMIN | Check `holdingUserId` |
| `UserController` | `GET /users` | ADMIN | Check role enum |
| `StatController` | Tất cả | ADMIN | URL pattern (SecurityConfig) |

---

## 5. 🌐 Frontend — Phân Luồng

### 5.1 Customer Frontend (`frontendcinema-v2`)

Không có route guard toàn cục — mỗi page tự kiểm tra token.

| Route | Yêu cầu |
|-------|---------|
| `/`, `/movies`, `/movies/:id` | 🔓 Public |
| `/login`, `/register` | 🔓 Public |
| `/seats/:movieId/:showtimeId` | 🔒 Token (redirect `/login` nếu thiếu) |
| `/checkout`, `/confirmation` | 🔒 Token |
| `/booking-history`, `/profile`, `/membership`, `/games/*` | 🔒 Token |

**Cơ chế bắt lỗi:** Axios interceptor → HTTP 401 → xóa token → `window.location.href = '/login'`

---

### 5.2 Admin Frontend (`cinema_admin`)

Có **3 lớp route guard**:

#### Lớp 1 — `MainLayout.js`

```
Không có token?   → redirect /login
Role = CUSTOMER?  → xóa token + redirect /login
Role = EMPLOYEE?  → chỉ cho vào /admin/scanner, /admin/pos, /admin/bookings
                    còn lại → redirect /admin/pos
Role = ADMIN?     → full access
```

#### Lớp 2 — `Sidebar.js`

| Role | Menu hiển thị |
|------|--------------|
| `ADMIN` | Dashboard, Phim, Phòng, Suất chiếu, Banner, POS, Bookings, Snacks, Discounts, Khách hàng, Hạng thành viên, Thành tựu, Reviews, Scanner, Cài đặt |
| `EMPLOYEE` | Scanner, POS, Bookings *(chỉ 3 mục)* |

#### Lớp 3 — API Calls (`axiosClient.js`)

Backend trả `401`/`403` nếu role không đủ quyền → request bị chặn hoàn toàn ở phía server.

---

## 6. 📊 Tổng Quan Luồng Hoạt Động

```
                  ┌──────────────────────────────┐
                  │    POST /api/auth/login       │
                  │   (chung cho cả 3 role)       │
                  └──────────┬───────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────────┐
        │ CUSTOMER │  │ EMPLOYEE │  │    ADMIN     │
        └────┬─────┘  └────┬─────┘  └──────┬───────┘
             │             │               │
    ┌─────────┴─────┐  ┌───┴────────┐  ┌───┴─────────────┐
    │ frontendcinema│  │cinema_admin│  │  cinema_admin   │
    │ -v2           │  │(giới hạn)  │  │  (full quyền)   │
    │               │  │            │  │                  │
    │ /             │  │ /scanner   │  │ /dashboard       │
    │ /movies       │  │ /pos       │  │ /movies          │
    │ /seats/:id    │  │ /bookings  │  │ /showtimes       │
    │ /checkout     │  │            │  │ /rooms           │
    │ /booking-his  │  │            │  │ /snacks          │
    │ /membership   │  │            │  │ /discounts       │
    │ /games/*      │  │            │  │ /customers       │
    │ /profile      │  │            │  │ /revenue         │
    └───────────────┘  └────────────┘  │ /loyalty/*       │
                                       │ /reviews         │
                                       │ /settings        │
                                       │ /banner          │
                                       └─────────────────┘
```

### Bảng quyền API theo Role

| Role | Endpoints được phép |
|------|---------------------|
| 🔓 **Guest** | `GET /movies`, `GET /showtimes`, `GET /showtime-seats/showtime/**`, `GET /settings`, `GET /banner-config`, `GET /discount-codes/public`, `GET /snacks`, `/age-ratings`, `/auth/**` |
| 👤 **CUSTOMER** | Tất cả Public + `/bookings/my`, `/bookings/{id}`, `/bookings/create`, `/bookings/{id}/cancel`, `/bookings/{id}/send-email`, `/showtime-seats/hold`, `/showtime-seats/release`, `/users/profile`, `/reviews/**`, `/games/**`, `/discount-codes/validate` |
| 🧑‍💼 **EMPLOYEE** | Tất cả Public + `/bookings/all`, `/bookings/recent`, `/bookings/{id}`, `/bookings/{id}/print-ticket`, `/users/**` (giới hạn) |
| 🛡️ **ADMIN** | Tất cả — bao gồm `/admin/stats/**`, `/admin/loyalty/**`, `/movies/add`, `/rooms/**`, CRUD phim/suất chiếu/phòng, quản lý user, settings... |

---

## 7. 🔑 Tóm Tắt Kiến Trúc Bảo Mật

| Layer | Cơ chế |
|-------|--------|
| **Authentication** | JWT Bearer token, TTL 2 giờ |
| **Password hashing** | BCrypt |
| **Password policy** | ≥8 ký tự + ít nhất 1 chữ hoa + 1 chữ số + 1 ký tự đặc biệt |
| **Authorization — URL** | `SecurityConfig.filterChain` phân quyền theo pattern URL |
| **Authorization — Method** | `@PreAuthorize` + `authService.getCurrentUser().getRole()` trong controller |
| **Authorization — Frontend Admin** | `MainLayout.js` (redirect) + `Sidebar.js` (ẩn menu) |
| **Authorization — Frontend Customer** | Axios 401 interceptor → redirect `/login` |
| **Mass assignment** | Không còn — register dùng DTO riêng, luôn force `role = CUSTOMER` |
| **Optimistic Lock** | `@Version` trên `ShowtimeSeat` |
| **Pessimistic Lock** | `SELECT ... FOR UPDATE` trong `holdSeat()` |
| **Secrets management** | Credentials trong `application-local.properties` (`.gitignore`) hoặc biến môi trường |

---

*Tài liệu tạo ngày 04/07/2026 — CineVerse Security Architecture v1.0*
