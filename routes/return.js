const express = require('express');
const router = express.Router();
const { verifyReturnUrl } = require('../utils/vnpay');

/**
 * GET /vnpay-return
 * VNPAY redirect về đây sau khi thanh toán xong.
 * Xác thực chữ ký và chuyển hướng sang trang kết quả.
 */
router.get('/', (req, res) => {
  try {
    const query = req.query;

    console.log('\n--- VNPAY Return Callback ---');
    console.log('Query params:', query);

    // Verify chữ ký từ VNPAY
    const result = verifyReturnUrl(query);

    console.log('Verify result:', result);

    if (!result.isValid) {
      console.error('VNPAY signature verification FAILED!');
      return res.redirect(
        '/result.html?status=error&message=Chữ ký không hợp lệ'
      );
    }

    // Build query string để truyền sang result page
    const params = new URLSearchParams({
      status: result.isSuccess ? 'success' : 'failed',
      txnRef: result.data.txnRef || '',
      amount: result.data.amount || '',
      bankCode: result.data.bankCode || '',
      bankTranNo: result.data.bankTranNo || '',
      cardType: result.data.cardType || '',
      payDate: result.data.payDate || '',
      orderInfo: result.data.orderInfo || '',
      transactionNo: result.data.transactionNo || '',
      responseCode: result.data.responseCode || '',
      transactionStatus: result.data.transactionStatus || '',
    });

    return res.redirect(`/result.html?${params.toString()}`);
  } catch (error) {
    console.error('Error processing VNPAY return:', error);
    return res.redirect('/result.html?status=error&message=Lỗi xử lý kết quả');
  }
});

module.exports = router;
