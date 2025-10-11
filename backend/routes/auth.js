const express = require('express');
const router = express.Router();

router.post('/login', async (req, res) => {
  const { role, email, password } = req.body;

  // Dummy validation
  if (email === 'admin@example.com' && password === 'admin123' && role === 'admin') {
    return res.json({ message: 'Admin login successful' });
  }

  if (email === 'employee@example.com' && password === 'emp123' && role === 'employee') {
    return res.json({ message: 'Employee login successful' });
  }

  res.status(401).json({ error: 'Invalid credentials' });
});

module.exports = router;
