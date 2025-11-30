const express = require('express');
const router = express.Router();
const helpers = require('../helpers');
const requestHelper = require('../helpers/request');
const { MPESA_SHORTCODE, MPESA_ENV, MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET } = process.env;

router.post('/', async (req, res) => {
    const { transactionID, remarks } = req.body;

    try {
        const token = await helpers.getAccessToken(MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_ENV);

        const txnStatusData = {
            Initiator: "testapi",
            SecurityCredential: "SECURITY_CREDENTIAL",
            CommandID: "TransactionStatusQuery",
            TransactionID: transactionID,
            PartyA: MPESA_SHORTCODE,
            IdentifierType: "4",
            ResultURL: "https://example.com/transaction/result",
            QueueTimeOutURL: "https://example.com/transaction/timeout",
            Remarks: remarks || "Transaction Status"
        };

        const url = MPESA_ENV === 'sandbox'
            ? 'https://sandbox.safaricom.co.ke/mpesa/transactionstatus/v1/query'
            : 'https://api.safaricom.co.ke/mpesa/transactionstatus/v1/query';

        const response = await requestHelper.postRequest(url, txnStatusData, token);
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
