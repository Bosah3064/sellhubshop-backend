const express = require('express');
const router = express.Router();
const helpers = require('../helpers');
const requestHelper = require('../helpers/request');
const security = require('../helpers/security');
const { MPESA_SHORTCODE, MPESA_PASSKEY, CALLBACK_URL, MPESA_ENV, MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET } = process.env;

router.post('/', async (req, res) => {
    const { amount, phone } = req.body;
    try {
        const token = await helpers.getAccessToken(MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_ENV);
        const timestamp = security.getTimestamp();
        const password = security.generatePassword(MPESA_SHORTCODE, MPESA_PASSKEY, timestamp);

        const stkData = {
            BusinessShortCode: MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: amount,
            PartyA: phone,
            PartyB: MPESA_SHORTCODE,
            PhoneNumber: phone,
            CallBackURL: CALLBACK_URL,
            AccountReference: "CompanyXYZ",
            TransactionDesc: "Payment"
        };

        const url = MPESA_ENV === 'sandbox'
            ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
            : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

        const response = await requestHelper.postRequest(url, stkData, token);
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
