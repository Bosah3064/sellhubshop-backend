const express = require('express');
const router = express.Router();
const helpers = require('../helpers');
const requestHelper = require('../helpers/request');
const security = require('../helpers/security');
const { MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_ENV, MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET } = process.env;

router.post('/', async (req, res) => {
    const { checkoutRequestID } = req.body;

    try {
        const token = await helpers.getAccessToken(MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_ENV);
        const timestamp = security.getTimestamp();
        const password = security.generatePassword(MPESA_SHORTCODE, MPESA_PASSKEY, timestamp);

        const queryData = {
            BusinessShortCode: MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            CheckoutRequestID: checkoutRequestID
        };

        const url = MPESA_ENV === 'sandbox'
            ? 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query'
            : 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query';

        const response = await requestHelper.postRequest(url, queryData, token);
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
