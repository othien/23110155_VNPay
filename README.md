# 🏪 ShopVN – Tích hợp Cổng Thanh Toán VNPAY

Project thực hành tích hợp cổng thanh toán VNPAY Sandbox với Node.js & Express.

## ✨ Tính năng

- 🛍️ Trang chủ với 3 sản phẩm mẫu + form nhập tiền tùy chỉnh
- 💳 Tích hợp VNPAY Sandbox (tạo Payment URL + xác thực chữ ký HmacSHA512)
- ✅ Trang kết quả hiển thị đầy đủ dữ liệu giao dịch từ VNPAY
- 🔒 Bảo mật: HashSecret lưu trong `.env`, không expose ra client
- 📱 Responsive design, dark theme premium

## 🚀 Cài đặt & Chạy

### 1. Clone và cài dependencies
```bash
git clone <your-repo>
cd vnpay-payment
npm install
```

### 2. Cấu hình biến môi trường
```bash
cp .env.example .env
```

Mở file `.env` và điền thông tin VNPAY Sandbox của bạn:
```env
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://your-ngrok-url.ngrok-free.app/vnpay-return
PORT=3000
```

### 3. Khởi động server
```bash
npm run dev
```

Mở trình duyệt: http://localhost:3000

## 🌐 Cấu hình Ngrok (bắt buộc cho VNPAY)

VNPAY cần một URL public (HTTPS) để redirect về sau khi thanh toán.

```bash
# Terminal mới
ngrok http 3000
```

Copy URL HTTPS từ ngrok (ví dụ: `https://abc123.ngrok-free.app`), cập nhật vào `.env`:
```
VNPAY_RETURN_URL=https://abc123.ngrok-free.app/vnpay-return
```

Khởi động lại server: `npm run dev`

## 🧪 Thông tin thẻ Test (NCB Sandbox)

| Trường | Giá trị |
|--------|---------|
| Số thẻ | `9704198526191432198` |
| Tên chủ thẻ | `NGUYEN VAN A` |
| Ngày phát hành | `07/15` |
| OTP | `123456` |

## 📁 Cấu trúc Project

```
vnpay-payment/
├── .env                  # Biến môi trường (gitignore)
├── .env.example          # Template (public)
├── .gitignore
├── package.json
├── server.js             # Express server
├── routes/
│   ├── payment.js        # POST /api/payment/create
│   └── return.js         # GET /vnpay-return
├── utils/
│   └── vnpay.js          # buildPaymentUrl, verifyReturnUrl
└── public/
    ├── index.html        # Trang chủ
    ├── result.html       # Trang kết quả
    └── style.css         # CSS
```

## 🔐 Bảo mật

- File `.env` được thêm vào `.gitignore` → **không bao giờ commit lên GitHub**
- Chữ ký HmacSHA512 được tính và xác thực phía server
- Không expose `HashSecret` ra phía client

## 📚 Tài liệu VNPAY

- Sandbox: https://sandbox.vnpayment.vn/apis/docs/
- Đăng ký merchant: https://sandbox.vnpayment.vn/devreg/
