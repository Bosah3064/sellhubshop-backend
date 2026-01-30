const express = require('express');
const router = express.Router();
const helpers = require('../helpers');
const requestHelper = require('../helpers/request');
const security = require('../helpers/security');
const { supabase } = require('../helpers/supabase');
const { 
    MPESA_SHORTCODE, 
    MPESA_ENV, 
    MPESA_CONSUMER_KEY, 
    MPESA_CONSUMER_SECRET,
    MPESA_B2C_INITIATOR_NAME,
    MPESA_B2C_SECURITY_CREDENTIAL,
    CALLBACK_URL
} = process.env;

// B2C Withdrawal Endpoint - Integrated with Wallet System
router.post('/', async (req, res) => {
    const { amount, phone, userId } = req.body;
    
    console.log('[B2C Withdrawal] Request:', { amount, phone, userId });

    // Validate required fields
    if (!amount || !phone || !userId) {
        return res.status(400).json({ 
            error: 'Missing required fields',
            required: ['amount', 'phone', 'userId']
        });
    }

    // Validate amount
    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
    }

    // Minimum withdrawal amount (to avoid small transaction fees)
    if (withdrawalAmount < 10) {
        return res.status(400).json({ error: 'Minimum withdrawal is KSh 10' });
    }

    // Format phone number
    let formattedPhone = phone.toString().replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
        formattedPhone = '254' + formattedPhone;
    }

    // Validate phone format
    if (!formattedPhone.startsWith('254') || formattedPhone.length !== 12) {
        return res.status(400).json({ error: 'Invalid phone number format. Use 254XXXXXXXXX' });
    }

    try {
        // 1. Fetch and validate wallet
        const { data: wallet, error: walletError } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (walletError || !wallet) {
            console.error('[B2C] Wallet not found:', walletError);
            return res.status(404).json({ error: 'Wallet not found' });
        }

        // 2. Check sufficient balance
        if (wallet.balance < withdrawalAmount) {
            return res.status(400).json({ 
                error: 'Insufficient balance',
                available: wallet.balance,
                requested: withdrawalAmount
            });
        }

        // 3. Create pending withdrawal transaction
        const { data: transaction, error: transError } = await supabase
            .from('wallet_transactions')
            .insert({
                wallet_id: wallet.id,
                amount: withdrawalAmount,
                type: 'debit',
                reference_type: 'withdrawal',
                description: `M-Pesa withdrawal to ${formattedPhone}`,
                status: 'pending'
            })
            .select()
            .single();

        if (transError) {
            console.error('[B2C] Transaction creation failed:', transError);
            return res.status(500).json({ error: 'Failed to create transaction' });
        }

        console.log('[B2C] Transaction created:', transaction.id);

        // 4. Check B2C credentials
        if (!MPESA_B2C_INITIATOR_NAME || !MPESA_B2C_SECURITY_CREDENTIAL) {
            console.error('[B2C] Missing B2C credentials');
            
            // Mark transaction as failed
            await supabase
                .from('wallet_transactions')
                .update({ 
                    status: 'failed',
                    description: `${transaction.description} - Configuration error`
                })
                .eq('id', transaction.id);

            return res.status(500).json({ 
                error: 'B2C not configured',
                message: 'Please contact support to enable withdrawals'
            });
        }

        // 5. Get M-Pesa access token
        const token = await helpers.getAccessToken(MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_ENV);

        // 6. Prepare B2C request
        const b2cCallbackUrl = `${CALLBACK_URL}/b2c/result` || 'https://sellhubshop-backend.onrender.com/api/v1/callback/b2c/result';
        const b2cTimeoutUrl = `${CALLBACK_URL}/b2c/timeout` || 'https://sellhubshop-backend.onrender.com/api/v1/callback/b2c/timeout';

        const b2cData = {
            InitiatorName: MPESA_B2C_INITIATOR_NAME,
            SecurityCredential: MPESA_B2C_SECURITY_CREDENTIAL,
            CommandID: "BusinessPayment", // or "SalaryPayment" / "PromotionPayment"
            Amount: Math.floor(withdrawalAmount),
            PartyA: MPESA_SHORTCODE,
            PartyB: formattedPhone,
            Remarks: `Withdrawal-${transaction.id.substring(0, 8)}`,
            QueueTimeOutURL: b2cTimeoutUrl,
            ResultURL: b2cCallbackUrl,
            Occasion: `WD${transaction.id.substring(0, 10)}`
        };

        console.log('[B2C] Sending request to Safaricom:', {
            ...b2cData,
            SecurityCredential: '***HIDDEN***'
        });

        const url = MPESA_ENV === 'sandbox'
            ? 'https://sandbox.safaricom.co.ke/mpesa/b2c/v3/paymentrequest'
            : 'https://api.safaricom.co.ke/mpesa/b2c/v3/paymentrequest';

        // 7. Send B2C request
        const response = await requestHelper.postRequest(url, b2cData, token);
        
        console.log('[B2C] Safaricom Response:', response.data);

        // 8. Update transaction with conversation ID
        if (response.data.ConversationID) {
            await supabase
                .from('wallet_transactions')
                .update({ 
                    reference_id: response.data.ConversationID
                })
                .eq('id', transaction.id);
        }

        // 9. Deduct from wallet immediately (will be refunded if B2C fails)
        await supabase
            .from('wallets')
            .update({ 
                balance: wallet.balance - withdrawalAmount 
            })
            .eq('id', wallet.id);

        res.json({
            success: true,
            message: 'Withdrawal initiated successfully',
            transactionId: transaction.id,
            conversationId: response.data.ConversationID,
            amount: withdrawalAmount,
            phone: formattedPhone
        });

    } catch (err) {
        console.error('[B2C] Error:', err.message);
        if (err.response) {
            console.error('[B2C] Safaricom Error:', err.response.data);
            return res.status(err.response.status).json({
                error: 'M-Pesa error',
                details: err.response.data
            });
        }
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
