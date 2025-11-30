const express = require('express');
const router = express.Router();
const helpers = require('../helpers');
const requestHelper = require('../helpers/request');
const { MPESA_SHORTCODE, MPESA_ENV, MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET } = process.env;

router.post('/', async (req, res) => {
    const { amount, receiverShortcode, remarks } = req.body;

    try {
        const token = await helpers.getAccessToken(MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_ENV);

        const b2bData = {
            Initiator: "testapi",
            SecurityCredential: "SECURITY_CREDENTIAL",
            CommandID: "BusinessToBusinessTransfer",
            SenderIdentifierType: "4",
            RecieverIdentifierType: "4",
            Amount: amount,
            PartyA: MPESA_SHORTCODE,
            PartyB: receiverShortcode,
            AccountReference: "CompanyXYZ",
            Remarks: remarks || "B2B Payment",
            QueueTimeOutURL: "https://example.com/b2b/timeout",
            ResultURL: "https://example.com/b2b/result"
        };

        const url = MPESA_ENV === 'sandbox'
            ? 'https://sandbox.safaricom.co.ke/mpesa/b2b/v1/paymentrequest'
            : 'https://api.safaricom.co.ke/mpesa/b2b/v1/paymentrequest';

        const response = await requestHelper.postRequest(url, b2bData, token);
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
