const express = require('express');
const router = express.Router();
const helpers = require('../helpers');
const requestHelper = require('../helpers/request');
const {
    MPESA_ENV,
    MPESA_SHORTCODE,
    C2B_CONFIRMATION_URL,
    C2B_VALIDATION_URL,
    MPESA_CONSUMER_KEY,
    MPESA_CONSUMER_SECRET
} = process.env;

router.post('/', async (req, res) => {
    try {
        console.log('[M-Pesa C2B] Registering URLs...');
        const token = await helpers.getAccessToken(MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_ENV);

        const registrationData = {
            ShortCode: MPESA_SHORTCODE,
            ResponseType: "Completed",
            ConfirmationURL: C2B_CONFIRMATION_URL,
            ValidationURL: C2B_VALIDATION_URL
        };

        const url = MPESA_ENV === 'sandbox'
            ? 'https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl'
            : 'https://api.safaricom.co.ke/mpesa/c2b/v1/registerurl';

        console.log(`[M-Pesa C2B] Requesting ${url} with payload:`, registrationData);

        const response = await requestHelper.postRequest(url, registrationData, token);
        console.log('[M-Pesa C2B] Registration Response:', response.data);

        res.json({
            success: true,
            message: 'C2B registration initiated',
            data: response.data
        });
    } catch (err) {
        console.error('[M-Pesa C2B] Registration Error:', err.message);
        if (err.response) {
            console.error('[M-Pesa C2B] Safaricom Response Error:', err.response.data);
            return res.status(err.response.status).json(err.response.data);
        }
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
