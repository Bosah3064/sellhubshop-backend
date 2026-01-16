const express = require('express');
const router = express.Router();
const helpers = require('../helpers');
const requestHelper = require('../helpers/request');
const security = require('../helpers/security');
const { supabase } = require('../helpers/supabase'); // Import Supabase
const {
    MPESA_SHORTCODE,
    MPESA_PASSKEY,
    MPESA_STK_PASSKEY,
    CALLBACK_URL,
    SAFARICOM_CALLBACK_URL,
    MPESA_ENV,
    MPESA_CONSUMER_KEY,
    MPESA_CONSUMER_SECRET,
    MPESA_TILL_NUMBER
} = process.env;

const VALID_CALLBACK_URL = SAFARICOM_CALLBACK_URL || CALLBACK_URL || process.env.DEV_CALLBACK_URL || "https://sellhubshop-backend.onrender.com/api/mpesa/callback";

router.post('/', async (req, res) => {
    // ... (existing STK push logic remains unchanged) ...
    const { amount, phone, phoneNumber } = req.body;
    let actualPhone = phone || phoneNumber;

    // Validate and format phone number (254...)
    if (actualPhone) {
        actualPhone = actualPhone.toString().replace(/\D/g, ''); // Remove non-digits
        if (actualPhone.startsWith('0')) {
            actualPhone = '254' + actualPhone.substring(1);
        } else if (actualPhone.startsWith('7')) {
            actualPhone = '254' + actualPhone;
        }
    }

    console.log('[M-Pesa] STK Push Request:', { amount, phone: actualPhone });

    if (!actualPhone || !amount) {
        return res.status(400).json({ error: 'Phone number and amount are required' });
    }

    try {
        console.log('[M-Pesa] Requesting access token...');
        const token = await helpers.getAccessToken(MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_ENV);
        console.log('[M-Pesa] Access token received.');

        const timestamp = security.getTimestamp();
        // Use STK specific passkey if available, otherwise default
        const passKey = MPESA_STK_PASSKEY || MPESA_PASSKEY;

        // Check if passkey is available
        if (!passKey || passKey.includes('PLEASE_ADD') || passKey.includes('NEEDED')) {
            console.error('[M-Pesa] ERROR: MPESA_PASSKEY is not configured!');
            return res.status(500).json({
                error: 'M-Pesa configuration incomplete',
                message: 'MPESA_PASSKEY is required. Please contact Safaricom support to get your production passkey.',
                details: 'The passkey is needed to generate the secure password for STK push requests.'
            });
        }

        const password = security.generatePassword(MPESA_SHORTCODE, passKey, timestamp);

        // Determine if this is a Till Number (Buy Goods) or Paybill
        const isTill = !!MPESA_TILL_NUMBER;
        const transactionType = isTill ? "CustomerBuyGoodsOnline" : "CustomerPayBillOnline";
        const partyB = isTill ? MPESA_TILL_NUMBER : MPESA_SHORTCODE;

        // Check if using localhost and warn
        if (VALID_CALLBACK_URL && VALID_CALLBACK_URL.includes('localhost')) {
            console.warn('[M-Pesa] WARNING: Callback URL is localhost. Safaricom cannot reach this URL. Use ngrok or a public URL.');
        }

        const stkData = {
            BusinessShortCode: MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: transactionType,
            Amount: Math.floor(amount),
            PartyA: actualPhone,
            PartyB: partyB,
            PhoneNumber: actualPhone,
            CallBackURL: VALID_CALLBACK_URL,
            AccountReference: req.body.accountRef || "SaleStreamLink",
            TransactionDesc: req.body.description ? req.body.description.substring(0, 13) : "Payment"
        };

        console.log('[M-Pesa] STK Payload:', JSON.stringify(stkData, null, 2));

        const url = MPESA_ENV === 'sandbox'
            ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
            : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

        const response = await requestHelper.postRequest(url, stkData, token);
        console.log('[M-Pesa] Safaricom Response:', response.data);
        res.json(response.data);
    } catch (err) {
        console.error('[M-Pesa] Error:', err.message);
        if (err.response) {
            console.error('[M-Pesa] Safaricom Error Response:', err.response.data);
            return res.status(err.response.status).json(err.response.data);
        }
        res.status(500).json({ error: err.message });
    }
});

router.post('/callback', async (req, res) => {
    console.log('------------------------------------------------');
    console.log('[M-Pesa] STK Push Callback Received');
    const callbackData = req.body;

    // Log the entire body for debugging
    console.log(JSON.stringify(callbackData, null, 2));

    if (!callbackData.Body || !callbackData.Body.stkCallback) {
        console.error('[M-Pesa] Invalid Callback Structure');
        return res.json({ result: 'fail', message: 'Invalid structure' });
    }

    const { ResultCode, ResultDesc, CallbackMetadata, CheckoutRequestID } = callbackData.Body.stkCallback;

    console.log(`[M-Pesa] Result Code: ${ResultCode}`);
    console.log(`[M-Pesa] Description: ${ResultDesc}`);
    console.log(`[M-Pesa] Checkout Request ID: ${CheckoutRequestID}`);

    try {
        if (ResultCode === 0) {
            console.log('[M-Pesa] Payment Successful!');

            // Extract metadata items if they exist
            let amount = null;
            let receipt = null;
            let phone = null;
            let date = null;

            if (CallbackMetadata && CallbackMetadata.Item) {
                amount = CallbackMetadata.Item.find(i => i.Name === 'Amount')?.Value;
                receipt = CallbackMetadata.Item.find(i => i.Name === 'MpesaReceiptNumber')?.Value;
                phone = CallbackMetadata.Item.find(i => i.Name === 'PhoneNumber')?.Value;
                date = CallbackMetadata.Item.find(i => i.Name === 'TransactionDate')?.Value;

                console.log(`[M-Pesa] Receipt: ${receipt}, Amount: ${amount}, Phone: ${phone}`);
            }

            // Plan UUID Mapping for user_plans table
            const planMapping = {
                "free": "ceb71ae1-caaa-44df-8b1a-62daa6a2938e",
                "silver": "0b922be5-91b7-46c7-8ac9-2c0a95e32593",
                "gold": "f34c0928-7494-46a6-9ff9-c4d498818297",
                "test": "0b922be5-91b7-46c7-8ac9-2c0a95e32593" // Map test payments to professional features
            };

            // Update Database for Success and Fetch User/Plan details
            const { data: subData, error } = await supabase
                .from('subscriptions')
                .update({
                    status: 'active',
                    mpesa_receipt_number: receipt,
                    activated_at: new Date().toISOString(),
                    confirmed_at: new Date().toISOString()
                })
                .eq('checkout_request_id', CheckoutRequestID)
                .select('id, user_id, plan_id, billing_cycle, amount')
                .single();

            if (error) {
                console.error('[M-Pesa] Supabase Update Error (Success):', error.message);
            } else {
                console.log('[M-Pesa] Database updated to ACTIVE via Callback');

                // CRITICAL: Update User Profile Plan and User_Plans to unlock limits
                if (subData && subData.user_id && subData.plan_id) {
                    console.log(`[M-Pesa] Upgrading user ${subData.user_id} to plan ${subData.plan_id}`);

                    // Reverse Mapping to get readable name for Profile table
                    const reverseMapping = {
                        "ceb71ae1-caaa-44df-8b1a-62daa6a2938e": "free",
                        "0b922be5-91b7-46c7-8ac9-2c0a95e32593": "silver",
                        "f34c0928-7494-46a6-9ff9-c4d498818297": "gold"
                    };

                    const planName = reverseMapping[subData.plan_id] || subData.plan_id;

                    // 1. Update Profile (Seller Dashboard & Product Limits look here)
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .update({ plan_type: planName })
                        .eq('id', subData.user_id);

                    if (profileError) {
                        console.error('[M-Pesa] Profile Update Failed:', profileError.message);
                    } else {
                        console.log('[M-Pesa] User Profile Plan Updated Successfully');
                    }

                    // 2. Sync User Plans table (Dashboard looks here first)
                    await supabase.from('user_plans').delete().eq('user_id', subData.user_id);
                    const { error: userPlanError } = await supabase
                        .from('user_plans')
                        .insert({
                            user_id: subData.user_id,
                            plan_id: subData.plan_id,
                            status: 'active',
                            starts_at: new Date().toISOString(),
                            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                        });

                    if (userPlanError) {
                        console.error('[M-Pesa] User Plan Sync Failed:', userPlanError.message);
                    } else {
                        console.log('[M-Pesa] User Plan Swapped/Updated Successfully');
                    }
                    // 3. Log to Billing History (Traceability)
                    const { error: billingError } = await supabase.from('billing_history').insert({
                        user_id: subData.user_id,
                        subscription_id: subData.id,
                        amount: amount || subData.amount || 0,
                        currency: 'KES',
                        status: 'completed',
                        description: `Subscription: ${planName} plan`,
                        payment_method: 'mpesa',
                        mpesa_receipt_number: receipt,
                        created_at: new Date().toISOString()
                    });

                    if (billingError) {
                        console.error('[M-Pesa] Billing History Update Failed:', billingError.message);
                    }

                    // 4. Referral Reward Processing (New Feature)
                    try {
                        console.log('[M-Pesa] Checking for referral rewards...');
                        const { data: payerProfile } = await supabase
                            .from('profiles')
                            .select('referral_code_used')
                            .eq('id', subData.user_id)
                            .single();

                        if (payerProfile?.referral_code_used) {
                            console.log(`[M-Pesa] Payer was referred by code: ${payerProfile.referral_code_used}`);

                            // Find the referrer
                            const { data: codeData } = await supabase
                                .from('referral_codes')
                                .select('user_id')
                                .eq('code', payerProfile.referral_code_used)
                                .eq('is_active', true)
                                .single();

                            if (codeData && codeData.user_id) {
                                console.log(`[M-Pesa] Found referrer: ${codeData.user_id}`);

                                // 1. Calculate Referrer Tier/Reward
                                const { count: completedCount } = await supabase
                                    .from('referrals')
                                    .select('*', { count: 'exact', head: true })
                                    .eq('referrer_id', codeData.user_id)
                                    .eq('status', 'completed');

                                let rewardAmount = 50; // Default Starter
                                if (completedCount >= 20) rewardAmount = 150;
                                else if (completedCount >= 10) rewardAmount = 100;
                                else if (completedCount >= 5) rewardAmount = 75;

                                // Boost reward for Gold plan referrals
                                if (planName === 'gold') rewardAmount += 50;

                                // 2. Check if this referral session was already recorded
                                const { data: existingRef } = await supabase
                                    .from('referrals')
                                    .select('id, status')
                                    .eq('referred_id', subData.user_id)
                                    .maybeSingle();

                                if (!existingRef) {
                                    // Fallback: Create new if pending wasn't created at registration
                                    await supabase.from('referrals').insert({
                                        id: require('crypto').randomUUID(),
                                        referrer_id: codeData.user_id,
                                        referred_id: subData.user_id,
                                        referral_code_used: payerProfile.referral_code_used,
                                        status: 'completed',
                                        reward_amount: rewardAmount,
                                        completed_at: new Date().toISOString()
                                    });
                                } else if (existingRef.status !== 'completed') {
                                    // Update existing pending record to completed
                                    await supabase.from('referrals')
                                        .update({
                                            status: 'completed',
                                            reward_amount: rewardAmount,
                                            completed_at: new Date().toISOString()
                                        })
                                        .eq('id', existingRef.id);
                                }

                                console.log(`[M-Pesa] Referral reward of KES ${rewardAmount} processed for ${codeData.user_id}`);
                            }
                        }
                    } catch (refProcError) {
                        console.error('[M-Pesa] Referral Processing Error:', refProcError.message);
                    }
                }
            }

        } else {
            console.log('[M-Pesa] Payment Failed/Cancelled.');

            // Update Database for Failure
            const { data: failSubData, error: updateError } = await supabase
                .from('subscriptions')
                .update({
                    status: 'failed',
                    failure_reason: ResultDesc || 'M-Pesa Transaction Failed',
                    mpesa_receipt_number: CheckoutRequestID // Store CheckoutID as Ref for failures
                })
                .eq('checkout_request_id', CheckoutRequestID)
                .select('user_id, plan_id, amount')
                .single();

            if (updateError) {
                console.error('[M-Pesa] Supabase Update Error (Failure):', updateError.message);
            } else if (failSubData) {
                console.log('[M-Pesa] Database updated to FAILED via Callback');

                // Reverse Mapping for Plan Name
                const reverseMapping = {
                    "ceb71ae1-caaa-44df-8b1a-62daa6a2938e": "free",
                    "0b922be5-91b7-46c7-8ac9-2c0a95e32593": "silver",
                    "f34c0928-7494-46a6-9ff9-c4d498818297": "gold"
                };
                const planName = reverseMapping[failSubData.plan_id] || failSubData.plan_id;

                // Log Failed/Cancelled Transaction in Billing History so user can see it
                let historyStatus = 'failed';
                if (ResultDesc && (ResultDesc.includes('cancel') || ResultDesc.includes('Cancel'))) {
                    historyStatus = 'canceled';
                }

                await supabase.from('billing_history').insert({
                    user_id: failSubData.user_id,
                    amount: failSubData.amount || 0,
                    currency: 'KES',
                    status: historyStatus,
                    description: `Failed Prompt: ${planName} plan (${ResultDesc || 'No reason provided'})`,
                    payment_method: 'mpesa',
                    mpesa_receipt_number: CheckoutRequestID, // Store CheckoutID as Ref
                    created_at: new Date().toISOString()
                });
            }
        }
    } catch (dbError) {
        console.error('[M-Pesa] Callback Processing Error:', dbError);
    }

    console.log('------------------------------------------------');
    res.json({ result: 'success' });
});

module.exports = router;
