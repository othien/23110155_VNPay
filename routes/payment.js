const express = require('express');
const router = express.Router();
const { buildPaymentUrl } = require('../utils/vnpay');

/**
 * POST /api/payment/create
 * Tạo VNPAY payment URL và trả về cho frontend
 */
router.post('/create', (req, res) => {
  try {
    const { amount, orderInfo } = req.body;

    // Validate input
    if (!amount || isNaN(amount) || parseInt(amount) < 5000) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền không hợp lệ. Tối thiểu 5,000 VND',
      });
    }

    // Tạo mã đơn hàng unique bằng timestamp
    const txnRef = Date.now().toString();

    // Lấy IP của client
    const ipAddr =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const cleanIp = ipAddr.split(',')[0].trim();
    // Chuyển IPv6 loopback ::1 thành IPv4 cho VNPAY
    const finalIp = (cleanIp === '::1' || cleanIp === '::ffff:127.0.0.1') ? '127.0.0.1' : cleanIp;

    const paymentUrl = buildPaymentUrl({
      amount: parseInt(amount),
      orderInfo: orderInfo || `Thanh toan don hang ${txnRef}`,
      txnRef,
      ipAddr: finalIp,
    });

    console.log('=== PAYMENT URL ===');
    console.log(paymentUrl);
    console.log('===================');

    return res.json({
      success: true,
      paymentUrl,
      txnRef,
    });
  } catch (error) {
    console.error('Error creating payment URL:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo đường dẫn thanh toán',
    });
  }
});

module.exports = router;
