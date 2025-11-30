const express = require('express');
const router = express.Router();

// POST /api/mpesa/initiate-stk-push
router.post('/initiate-stk-push', async (req, res) => {
  const { phoneNumber, amount } = req.body;

  if (!phoneNumber || !amount) {
    return res.status(400).json({ error: 'phoneNumber and amount are required' });
  }

  try {
    // Call your Safaricom M-Pesa API here
    const response = {
      message: `STK Push initiated for ${phoneNumber} for KES ${amount}`,
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
