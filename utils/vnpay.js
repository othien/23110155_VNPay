const crypto = require('crypto');

/**
 * PHP-style urlencode: spaces -> '+', special chars -> %XX
 * Giống PHP urlencode() đúng chuẩn VNPAY
 */
function phpUrlencode(str) {
  return encodeURIComponent(String(str)).replace(/%20/g, '+');
}

/**
 * Stringify object thành query string với PHP urlencode (theo chuẩn VNPAY)
 * Ví dụ: { a: 1, b: 'hello world' } → 'a=1&b=hello+world'
 */
function stringifyParams(obj) {
  return Object.keys(obj)
    .map((key) => `${key}=${phpUrlencode(obj[key])}`)
    .join('&');
}

/**
 * Sắp xếp object theo thứ tự alphabet của key (bắt buộc của VNPAY)
 */
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  keys.forEach((key) => {
    sorted[key] = obj[key];
  });
  return sorted;
}

/**
 * Tạo VNPAY Payment URL
 * @param {Object} params - Thông tin đơn hàng
 * @param {number} params.amount - Số tiền (VND)
 * @param {string} params.orderInfo - Thông tin đơn hàng
 * @param {string} params.txnRef - Mã đơn hàng (unique)
 * @param {string} params.ipAddr - IP của client
 * @returns {string} VNPAY payment URL
 */
function buildPaymentUrl(params) {
  const tmnCode = process.env.VNPAY_TMN_CODE;
  const secretKey = process.env.VNPAY_HASH_SECRET;
  const vnpUrl = process.env.VNPAY_URL;
  const returnUrl = process.env.VNPAY_RETURN_URL;

  const now = new Date();
  // Format: yyyyMMddHHmmss (VN time GMT+7)
  const createDate = formatDate(now);

  let vnpParams = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: params.txnRef,
    vnp_OrderInfo: params.orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: params.amount * 100, // VNPAY yêu cầu nhân 100
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: params.ipAddr,
    vnp_CreateDate: createDate,
  };

  // Sắp xếp params theo alphabet
  vnpParams = sortObject(vnpParams);

  // Tạo chuỗi ký (signData) - KHÔNG encode theo chuẩn VNPAY
  const signData = stringifyParams(vnpParams);

  // Tạo chữ ký HmacSHA512
  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  vnpParams['vnp_SecureHash'] = signed;

  // Build URL với PHP urlencode style (spaces=+) — đúng chuẩn VNPAY
  const paymentUrl =
    vnpUrl + '?' + Object.keys(vnpParams).map(k => `${k}=${phpUrlencode(vnpParams[k])}`).join('&');

  return paymentUrl;
}

/**
 * Xác thực dữ liệu trả về từ VNPAY (verify secure hash)
 * @param {Object} query - Query params từ VNPAY return URL
 * @returns {Object} { isValid, isSuccess, data }
 */
function verifyReturnUrl(query) {
  const secretKey = process.env.VNPAY_HASH_SECRET;

  // Lấy secure hash từ query, sau đó loại bỏ nó
  const secureHash = query['vnp_SecureHash'];

  // Tạo bản copy và xóa các field hash
  const vnpParams = { ...query };
  delete vnpParams['vnp_SecureHash'];
  delete vnpParams['vnp_SecureHashType'];

  // Sắp xếp lại
  const sortedParams = sortObject(vnpParams);

  // Tạo lại chữ ký để so sánh (phải stringify KHÔNG encode, giống lúc tạo)
  const signData = stringifyParams(sortedParams);
  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  const isValid = secureHash === signed;

  // vnp_ResponseCode = '00' là thành công
  const isSuccess = isValid && query['vnp_ResponseCode'] === '00';

  return {
    isValid,
    isSuccess,
    data: {
      txnRef: query['vnp_TxnRef'],
      amount: parseInt(query['vnp_Amount']) / 100, // Chia 100 để ra số tiền thật
      bankCode: query['vnp_BankCode'] || 'N/A',
      bankTranNo: query['vnp_BankTranNo'] || 'N/A',
      cardType: query['vnp_CardType'] || 'N/A',
      payDate: formatPayDate(query['vnp_PayDate']),
      orderInfo: query['vnp_OrderInfo'],
      transactionNo: query['vnp_TransactionNo'] || 'N/A',
      responseCode: query['vnp_ResponseCode'],
      transactionStatus: query['vnp_TransactionStatus'],
      tmnCode: query['vnp_TmnCode'],
    },
  };
}

/**
 * Format Date thành chuỗi yyyyMMddHHmmss (UTC+7)
 */
function formatDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  // Chuyển sang giờ VN (UTC+7)
  const vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const yyyy = vnTime.getUTCFullYear();
  const MM = pad(vnTime.getUTCMonth() + 1);
  const dd = pad(vnTime.getUTCDate());
  const HH = pad(vnTime.getUTCHours());
  const mm = pad(vnTime.getUTCMinutes());
  const ss = pad(vnTime.getUTCSeconds());
  return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
}

/**
 * Format chuỗi thời gian VNPAY (yyyyMMddHHmmss) sang readable format
 */
function formatPayDate(dateStr) {
  if (!dateStr || dateStr.length !== 14) return dateStr || 'N/A';
  const yyyy = dateStr.substring(0, 4);
  const MM = dateStr.substring(4, 6);
  const dd = dateStr.substring(6, 8);
  const HH = dateStr.substring(8, 10);
  const mm = dateStr.substring(10, 12);
  const ss = dateStr.substring(12, 14);
  return `${dd}/${MM}/${yyyy} ${HH}:${mm}:${ss}`;
}

module.exports = { buildPaymentUrl, verifyReturnUrl, sortObject };
