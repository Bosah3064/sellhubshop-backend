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

        // Use STK specific passkey if available, matching lipa-na-mpesa-online.js
        const passKey = process.env.MPESA_STK_PASSKEY || MPESA_PASSKEY;
        const password = security.generatePassword(MPESA_SHORTCODE, passKey, timestamp);

        const queryData = {
            BusinessShortCode: MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            CheckoutRequestID: checkoutRequestID
        };

        const url = MPESA_ENV === 'sandbox'
            ? 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query'
            : 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query';

        console.log('[M-Pesa Query] Requesting status for:', checkoutRequestID);

        const response = await requestHelper.postRequest(url, queryData, token);
        console.log('[M-Pesa Query] Response:', response.data);
        res.json(response.data);
    } catch (err) {
        console.error('[M-Pesa Query] Error:', err.message);

        // If Safaricom returns an error response (e.g. 400/404/500), 
        // we should try to return it as a structured response so the frontend can handle it.
        if (err.response && err.response.data) {
            console.error('[M-Pesa Query] Safaricom Error:', err.response.data);

            // Return 200 with the error data so the frontend can parse the ResultCode/requestId
            // This prevents the "Server error" catch in the frontend.
            return res.status(200).json({
                ...err.response.data,
                success: false,
                status: 'failed',
                error: err.response.data.errorMessage || 'M-Pesa query failed'
            });
        }

        // Generic server error
        res.status(200).json({
            success: false,
            status: 'failed',
            error: err.message || 'Internal server error'
        });
    }
});

module.exports = router;
