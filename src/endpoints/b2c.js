const express = require('express');
const router = express.Router();
const helpers = require('../helpers');
const requestHelper = require('../helpers/request');
const { MPESA_SHORTCODE, MPESA_ENV, MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET } = process.env;

router.post('/', async (req, res) => {
    const { amount, phone, remarks } = req.body;

    try {
        const token = await helpers.getAccessToken(MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_ENV);

        const b2cData = {
            InitiatorName: "testapi",
            SecurityCredential: "SECURITY_CREDENTIAL", // generate via Safaricom docs
            CommandID: "BusinessPayment",
            Amount: amount,
            PartyA: MPESA_SHORTCODE,
            PartyB: phone,
            Remarks: remarks || "Payment",
            QueueTimeOutURL: "https://example.com/b2c/timeout",
            ResultURL: "https://example.com/b2c/result",
            Occasion: "Payment"
        };

        const url = MPESA_ENV === 'sandbox'
            ? 'https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest'
            : 'https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest';

        const response = await requestHelper.postRequest(url, b2cData, token);
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
