// invoices.js
const express = require('express');
const router = express.Router();

router.get('/:id', (req, res) => {
  res.json({ invoiceId: req.params.id, status: 'pending' });
});

module.exports = router;
