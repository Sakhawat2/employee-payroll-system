// payments.js
const express = require('express');
const router = express.Router();

router.get('/employee/:id', (req, res) => {
  res.json([{ month: 'October', netPay: 1200 }]);
});

module.exports = router;
