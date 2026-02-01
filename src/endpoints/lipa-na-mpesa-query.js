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

        // --- ENHANCEMENT: Process Payment if Query says Successful ---
        if (response.data && response.data.ResultCode === "0") {
             console.log('[M-Pesa Query] Transaction Confirmed as PAID via Query. Updating Database...');
             
             // Check Marketplace Orders linked to this CheckoutRequestID
             const { supabase } = require('../helpers/supabase');
             
             // 1. Find Order
             const { data: orderData } = await supabase
                 .from('marketplace_orders')
                 .select('*')
                 .eq('transaction_id', checkoutRequestID)
                 .maybeSingle();

             if (orderData && orderData.payment_status !== 'paid') {
                 console.log(`[M-Pesa Query] Found Unpaid Order #${orderData.id}. Processing...`);

                 // 2. Mark Order as Paid
                 await supabase
                     .from('marketplace_orders')
                     .update({
                         status: 'processing',
                         payment_status: 'paid',
                         payment_method: 'mpesa',
                         updated_at: new Date().toISOString()
                     })
                     .eq('id', orderData.id);

                 // 3. Credit Seller Wallet (Escrow Release)
                 const { data: orderItems } = await supabase
                     .from('order_items')
                     .select('seller_id, total_price')
                     .eq('order_id', orderData.id);
                 
                 if (orderItems && orderItems.length > 0) {
                     for (const item of orderItems) {
                         if (item.seller_id) {
                             // Check/Create Wallet
                             let { data: wallet } = await supabase.from('wallets').select('id').eq('user_id', item.seller_id).maybeSingle();
                             
                             if (!wallet) {
                                 const { data: newWallet } = await supabase.from('wallets').insert({ user_id: item.seller_id, balance: 0 }).select('id').single();
                                 wallet = newWallet;
                             }

                             if (wallet) {
                                 // Update Balance
                                 const { data: currentWallet } = await supabase.from('wallets').select('balance').eq('id', wallet.id).single();
                                 const newBal = (Number(currentWallet.balance) || 0) + Number(item.total_price);
                                 await supabase.from('wallets').update({ balance: newBal }).eq('id', wallet.id);

                                 // Log Transaction
                                 await supabase.from('wallet_transactions').insert({
                                     wallet_id: wallet.id,
                                     amount: item.total_price,
                                     type: 'credit',
                                     reference_type: 'order',
                                     reference_id: orderData.id,
                                     description: `Sale Revenue for Order #${orderData.id.substring(0,8)}`,
                                     status: 'completed'
                                 });
                             }
                         }
                     }
                 }
                 console.log('[M-Pesa Query] Order Payment Processed Successfully.');
             } else if (orderData && orderData.payment_status === 'paid') {
                  console.log('[M-Pesa Query] Order is already paid.');
             } else {
                 console.log('[M-Pesa Query] No matching unpaid order found for this transaction.');
             }
        }
        // -------------------------------------------------------------

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
