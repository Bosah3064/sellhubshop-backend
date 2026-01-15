const express = require('express');
const router = express.Router();
const helpers = require('../helpers');
const requestHelper = require('../helpers/request');
const { MPESA_SHORTCODE, MPESA_ENV, MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET } = process.env;

router.post('/', async (req, res) => {
    const { transactionID, amount, remarks } = req.body;

    try {
        const token = await helpers.getAccessToken(MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_ENV);

        const reversalData = {
            Initiator: "testapi",
            SecurityCredential: "SECURITY_CREDENTIAL",
            CommandID: "TransactionReversal",
            TransactionID: transactionID,
            Amount: amount,
            ReceiverParty: MPESA_SHORTCODE,
            RecieverIdentifierType: "4",
            ResultURL: "https://example.com/reversal/result",
            QueueTimeOutURL: "https://example.com/reversal/timeout",
            Remarks: remarks || "Reversal"
        };

        const url = MPESA_ENV === 'sandbox'
            ? 'https://sandbox.safaricom.co.ke/mpesa/reversal/v1/request'
            : 'https://api.safaricom.co.ke/mpesa/reversal/v1/request';

        const response = await requestHelper.postRequest(url, reversalData, token);
        res.json(response.data);
    } catch (err) {
        console.error('[M-Pesa Reversal] Error:', err.message);
        if (err.response && err.response.data) {
            console.error('[M-Pesa Reversal] Safaricom Error:', err.response.data);
            return res.status(200).json({
                ...err.response.data,
                success: false,
                status: 'failed',
                error: err.response.data.errorMessage || 'Reversal failed'
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
