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
        console.error('[M-Pesa Status] Error:', err.message);
        if (err.response && err.response.data) {
            console.error('[M-Pesa Status] Safaricom Error:', err.response.data);
            return res.status(200).json({
                ...err.response.data,
                success: false,
                status: 'failed',
                error: err.response.data.errorMessage || 'Transaction status check failed'
            });
        }
        res.status(200).json({
            success: false,
            status: 'failed',
            error: err.message || 'Internal server error'
        });
    }
});

module.exports = router;
