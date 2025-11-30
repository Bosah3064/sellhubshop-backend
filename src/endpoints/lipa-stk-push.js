require('dotenv').config();
const express = require('express');
const axios = require('axios');
const router = express.Router();

// Helper: get M-Pesa access token
async function getAccessToken() {
  const url = 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
  const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');

  const response = await axios.get(url, {
    headers: { Authorization: `Basic ${auth}` },
  });
  return response.data.access_token;
}

// POST /api/mpesa/initiate-stk-push
router.post('/initiate-stk-push', async (req, res) => {
  const { phoneNumber, amount } = req.body;

  if (!phoneNumber || !amount) {
    return res.status(400).json({ error: 'phoneNumber and amount are required' });
  }

  try {
    const accessToken = await getAccessToken();
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const password = Buffer.from(`${process.env.BUSINESS_SHORT_CODE}${process.env.STK_PASSKEY}${timestamp}`).toString('base64');

    const stkRequest = {
      BusinessShortCode: process.env.BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: process.env.BUSINESS_SHORT_CODE,
      PhoneNumber: phoneNumber,
      CallBackURL: process.env.STK_CALLBACK_URL,
      AccountReference: 'YourCompany',
      TransactionDesc: 'Payment for services',
    };

    const response = await axios.post(
      'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      stkRequest,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data); // This contains MerchantRequestID, CheckoutRequestID, etc.
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to initiate STK Push' });
  }
});

module.exports = router;
