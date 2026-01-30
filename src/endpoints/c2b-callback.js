const express = require('express');
const router = express.Router();
const { supabase } = require('../helpers/supabase');

// Validation Endpoint - Safaricom calls this to check if payment should be accepted
router.post('/validation', (req, res) => {
    console.log('[M-Pesa C2B] Validation Received:', JSON.stringify(req.body, null, 2));

    // In many cases, we just accept all payments. 
    // You could check if the AccountNumber exists if you want to be strict.
    res.json({
        ResultCode: 0,
        ResultDesc: "Accepted"
    });
});

// Confirmation Endpoint - Safaricom calls this after successful payment
router.post('/confirmation', async (req, res) => {
    console.log('------------------------------------------------');
    console.log('[M-Pesa C2B] Confirmation Received');
    const data = req.body;
    console.log(JSON.stringify(data, null, 2));

    const {
        TransactionType,
        TransID,
        TransTime,
        TransAmount,
        BusinessShortCode,
        BillRefNumber,
        InvoiceNumber,
        OrgAccountBalance,
        ThirdPartyTransID,
        MSISDN,
        FirstName,
        MiddleName,
        LastName
    } = data;

    try {
        // Log manual payment to subscriptions or a dedicated table
        // For C2B, the BillRefNumber is often used to identify the user/plan
        console.log(`[C2B] Payment of ${TransAmount} from ${MSISDN} for Ref: ${BillRefNumber}`);

        // 1. Log to generic billing history or transactions table
        await supabase.from('billing_history').insert({
            amount: parseFloat(TransAmount),
            currency: 'KES',
            status: 'completed',
            description: `C2B Payment: ${BillRefNumber} (${TransactionType})`,
            payment_method: 'mpesa_c2b',
            mpesa_receipt_number: TransID,
            created_at: new Date().toISOString()
        });

        // Add logic here to automatically upgrade the user if BillRefNumber matches a user ID or custom reference

    } catch (err) {
        console.error('[M-Pesa C2B] Processing Error:', err.message);
    }

    console.log('------------------------------------------------');
    res.json({ ResultCode: 0, ResultDesc: "Success" });
});

module.exports = router;
