require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files từ thư mục public
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const paymentRoute = require('./routes/payment');
const returnRoute = require('./routes/return');

app.use('/api/payment', paymentRoute);
app.use('/vnpay-return', returnRoute);

// Fallback route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log('========================================');
  console.log(`  🚀 VNPAY Payment Server đang chạy!`);
  console.log(`  📍 URL: http://localhost:${PORT}`);
  console.log(`  🔐 TmnCode: ${process.env.VNPAY_TMN_CODE}`);
  console.log(`  🔗 Return URL: ${process.env.VNPAY_RETURN_URL}`);
  console.log('========================================');
});

module.exports = app;
