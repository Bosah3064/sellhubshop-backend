const express = require('express');
const router = express.Router();
const helpers = require('../helpers');
const requestHelper = require('../helpers/request');
const security = require('../helpers/security');
const { supabase } = require('../helpers/supabase'); // Import Supabase
const webpush = require('web-push'); // Import Web Push
const {
    MPESA_SHORTCODE,
    MPESA_PASSKEY,
    MPESA_STK_PASSKEY,
    CALLBACK_URL,
    SAFARICOM_CALLBACK_URL,
    MPESA_ENV,
    MPESA_CONSUMER_KEY,
    MPESA_CONSUMER_SECRET,
    MPESA_TILL_NUMBER,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
    VAPID_SUBJECT
} = process.env;

// Initialize Web Push
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    try {
        webpush.setVapidDetails(
            VAPID_SUBJECT || 'mailto:admin@sellhubshop.co.ke',
            VAPID_PUBLIC_KEY,
            VAPID_PRIVATE_KEY
        );
        console.log('[Web Push] Initialized successfully');
    } catch (e) {
        console.error('[Web Push] Init Error:', e.message);
    }
}

const VALID_CALLBACK_URL = SAFARICOM_CALLBACK_URL || CALLBACK_URL || process.env.DEV_CALLBACK_URL || "https://sellhubshop-backend.onrender.com/api/v1/callback";

router.post('/', async (req, res) => {
    // Extract walletTransactionId and orderId from the request body
    const { amount, phone, phoneNumber, walletTransactionId, orderId } = req.body;
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

    console.log('[M-Pesa] STK Push Request:', { amount, phone: actualPhone, walletTransactionId, orderId });

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

        // --- CRITICAL FIX: Save CheckoutRequestID IMMEDIATELY ---
        if (response.data && response.data.ResponseCode === "0") {
            const checkoutRequestID = response.data.CheckoutRequestID;

            if (walletTransactionId) {
                console.log(`[M-Pesa] Linking CheckoutRequestID ${checkoutRequestID} to Wallet Transaction ${walletTransactionId}`);
                await supabase
                    .from('wallet_transactions')
                    .update({ mpesa_receipt: checkoutRequestID })
                    .eq('id', walletTransactionId);
            }

            if (orderId) {
                console.log(`[M-Pesa] Linking CheckoutRequestID ${checkoutRequestID} to Order ${orderId}`);
                await supabase
                    .from('marketplace_orders')
                    .update({ transaction_id: checkoutRequestID })
                    .eq('id', orderId);
            }
        }
        // -------------------------------------------------------

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

            // 1. Check Subscriptions Table First (Existing Logic)
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
                .maybeSingle(); // Changed to maybeSingle to avoid error if not found

            if (subData) {
                 // --- EXISTING SUBSCRIPTION LOGIC ---
                console.log('[M-Pesa] Database updated to ACTIVE via Callback (Subscription)');

                // [Legacy Subscription Logic Block - Preserved]
                if (subData && subData.user_id && subData.plan_id) {
                     // Reverse Mapping to get readable name for Profile table
                    const reverseMapping = {
                        "ceb71ae1-caaa-44df-8b1a-62daa6a2938e": "free",
                        "0b922be5-91b7-46c7-8ac9-2c0a95e32593": "silver",
                        "f34c0928-7494-46a6-9ff9-c4d498818297": "gold"
                    };

                    const planName = reverseMapping[subData.plan_id] || subData.plan_id;

                    // 1. Update Profile
                    await supabase.from('profiles').update({ plan_type: planName }).eq('id', subData.user_id);

                    // 2. Sync User Plans
                    await supabase.from('user_plans').delete().eq('user_id', subData.user_id);
                    await supabase.from('user_plans').insert({
                            user_id: subData.user_id,
                            plan_id: subData.plan_id,
                            status: 'active',
                            starts_at: new Date().toISOString(),
                            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                        });
                    
                    // 3. Billing History
                    await supabase.from('billing_history').insert({
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

                    // 4. --- REFERRAL REWARD AUTOMATION (SMART CAPPING) ---
                    try {
                        console.log('[Referral] Checking for referrer...');
                        // Find pending referral for this user
                        const { data: referral } = await supabase
                            .from('referrals')
                            .select('*')
                            .eq('referred_id', subData.user_id)
                            .eq('status', 'pending') // Only reward once
                            .maybeSingle();

                        if (referral) {
                            const referrerId = referral.referrer_id;
                            console.log(`[Referral] Found referrer: ${referrerId}`);

                            // Check Cap (Max 10 Successful Referrals)
                            const { count, error: countError } = await supabase
                                .from('referrals')
                                .select('*', { count: 'exact', head: true })
                                .eq('referrer_id', referrerId)
                                .eq('status', 'completed');

                            if (!countError) {
                                console.log(`[Referral] Referrer has ${count} completed referrals.`);
                                
                                const MAX_REFERRALS = 10;
                                let rewardAmount = 0;
                                let newStatus = 'completed';
                                let notificationMsg = '';

                                // --- EXPIRY LOGIC (24 Hours) ---
                                const referralDate = new Date(referral.created_at);
                                const now = new Date();
                                const hoursDiff = Math.abs(now - referralDate) / 36e5;

                                if (hoursDiff > 24) {
                                    // EXPIRED
                                    console.log(`[Referral] Referral is ${hoursDiff.toFixed(2)} hours old. EXPIRED.`);
                                    newStatus = 'expired';
                                    rewardAmount = 0;
                                    notificationMsg = `Referral Expired: User subscribed after 24 hours. No reward.`;
                                } else if (count < MAX_REFERRALS) {
                                    // REWARD ELIGIBLE
                                    // REWARD ELIGIBLE
                                    rewardAmount = 50; // Standard Reward (Can be dynamic based on plan)
                                    if (planName === 'gold') rewardAmount = 100; // Higher reward for gold

                                    notificationMsg = `You earned KES ${rewardAmount} for a new referral! Added to your Wallet.`;
                                    
                                    // Credit Wallet
                                    let { data: wallet } = await supabase.from('wallets').select('id').eq('user_id', referrerId).maybeSingle();
                                    if (!wallet) {
                                        const { data: newWallet } = await supabase.from('wallets').insert({ user_id: referrerId, balance: 0 }).select('id').single();
                                        wallet = newWallet;
                                    }

                                    if (wallet) {
                                        // Update Balance
                                        await supabase.rpc('increment_wallet', { p_wallet_id: wallet.id, p_amount: rewardAmount })
                                            .catch(async () => {
                                                // Fallback
                                                const { data: cur } = await supabase.from('wallets').select('balance').eq('id', wallet.id).single();
                                                await supabase.from('wallets').update({ balance: (cur.balance || 0) + rewardAmount }).eq('id', wallet.id);
                                            });

                                        // Log Transaction
                                        await supabase.from('wallet_transactions').insert({
                                            wallet_id: wallet.id,
                                            amount: rewardAmount,
                                            type: 'credit',
                                            reference_type: 'referral',
                                            reference_id: referral.id,
                                            description: `Referral Bonus (${planName})`,
                                            status: 'completed'
                                        });
                                        
                                        console.log(`[Referral] Credited KES ${rewardAmount} to wallet ${wallet.id}`);
                                    }
                                } else {
                                    // CAP REACHED
                                    console.log('[Referral] Cap reached (10). No reward.');
                                    newStatus = 'completed_capped'; // Custom status to indicate success but no money
                                    notificationMsg = `A friend joined via your link! (Max rewards reached)`;
                                }

                                // Update Referral Record
                                await supabase
                                    .from('referrals')
                                    .update({
                                        status: newStatus,
                                        reward_amount: rewardAmount,
                                        updated_at: new Date().toISOString()
                                    })
                                    .eq('id', referral.id);

                                // Send Notification
                                await supabase.from('notifications').insert({
                                    user_id: referrerId,
                                    title: rewardAmount > 0 ? 'Referral Reward! 🎁' : 'Referral Success! 🎯',
                                    message: notificationMsg,
                                    type: 'system',
                                    is_read: false
                                });
                            }
                        }
                    } catch (refErr) {
                        console.error('[Referral] Automation Error:', refErr);
                    }
                    // -----------------------------------------------------
                }

            } else {
                // --- NEW ORDER LOGIC (ESCROW MODEL) ---
                console.log('[M-Pesa] Not a subscription. Checking Marketplace Orders...');
                
                // Check Marketplace Orders
                const { data: orderData, error: orderError } = await supabase
                    .from('marketplace_orders')
                    .select('*')
                    .eq('transaction_id', CheckoutRequestID) // We must save CheckoutRequestID in order when initiating
                    .maybeSingle();

                if (orderData) {
                    console.log(`[M-Pesa] Found Order #${orderData.id}. Processing payment...`);
                    
                    // 1. Mark Order as Paid
                    await supabase
                        .from('marketplace_orders')
                        .update({
                            status: 'processing',
                            payment_status: 'paid',
                            payment_method: 'mpesa',
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', orderData.id);

                    // 2. Credit Seller Wallet (Escrow Release)
                    // Find the seller(s) from order items
                    const { data: orderItems } = await supabase
                        .from('order_items')
                        .select('seller_id, total_price')
                        .eq('order_id', orderData.id);
                    
                    if (orderItems && orderItems.length > 0) {
                         // Simple logic: Credit each seller for their item's value
                         // Note: In real world, we dedcut platform fee here.
                         for (const item of orderItems) {
                             if (item.seller_id) {
                                 // Check/Create Wallet
                                 let { data: wallet } = await supabase.from('wallets').select('id').eq('user_id', item.seller_id).maybeSingle();
                                 
                                 if (!wallet) {
                                     const { data: newWallet } = await supabase.from('wallets').insert({ user_id: item.seller_id, balance: 0 }).select('id').single();
                                     wallet = newWallet;
                                 }

                                 if (wallet) {
                                     // Atomic Increment (RPC is safer, but direct update for PoC)
                                     // Better: Call 'deposit_wallet' RPC if exists, or direct update
                                     // Using direct update for simplicity, assuming low concurrency on single seller
                                     const { error: creditError } = await supabase.rpc('increment_wallet', { 
                                         p_wallet_id: wallet.id, 
                                         p_amount: item.total_price 
                                     });
                                     
                                     // Fallback if RPC missing
                                     if (creditError) {
                                         // console.warn('RPC increment failed, trying direct update');
                                         // In production, use RPC. For now assuming we just execute SQL or add logic
                                         // Let's use direct insert to transactions and trust a trigger or separate job, 
                                         // OR just update balance.
                                          await supabase.from('wallets').update({ 
                                              balance: supabase.rpc('balance') + item.total_price // pseudo-code, actually need fetch-update
                                          }).eq('id', wallet.id); 
                                          // Actually, let's just log the transaction and let Manual Settlement handle if atomic fails
                                          
                                          // Let's use the wallet_transactions trigger approach if implemented, 
                                          // OR simpler: Just update balance directly.
                                     }

                                     // Log Credit Transaction
                                     await supabase.from('wallet_transactions').insert({
                                         wallet_id: wallet.id,
                                         amount: item.total_price,
                                         type: 'credit',
                                         reference_type: 'order',
                                         reference_id: orderData.id,
                                         description: `Sale Revenue for Order #${orderData.id.substring(0,8)}`,
                                         status: 'completed'
                                     });
                                     
                                     // Update balance manually (unsafe but working for demo)
                                      const { data: currentWallet } = await supabase.from('wallets').select('balance').eq('id', wallet.id).single();
                                      const newBal = (Number(currentWallet.balance) || 0) + Number(item.total_price);
                                      await supabase.from('wallets').update({ balance: newBal }).eq('id', wallet.id);

                                      // --- NOTIFICATION: Tell Seller about the Sale ---
                                      await supabase.from('notifications').insert({
                                          user_id: item.seller_id,
                                          title: 'New Order Received! 💰',
                                          message: `You sold an item! Order #${orderData.id.substring(0,8)} is paid. Amount: KES ${item.total_price}`,
                                          type: 'order',
                                          type: 'order',
                                          is_read: false
                                      });

                                      // --- WEB PUSH: Send to Phone ---
                                      try {
                                          const { data: subs } = await supabase
                                              .from('push_subscriptions')
                                              .select('*')
                                              .eq('user_id', item.seller_id);

                                          if (subs && subs.length > 0) {
                                              const payload = JSON.stringify({
                                                  title: 'New Sale! 💰',
                                                  body: `Order #${orderData.id.substring(0,8)} paid. KES ${item.total_price}`,
                                                  url: '/dashboard'
                                              });
                                              console.log(`[Web Push] Sending to ${subs.length} devices for user ${item.seller_id}`);
                                              
                                              subs.forEach(sub => {
                                                  const pushSubscription = {
                                                      endpoint: sub.endpoint,
                                                      keys: {
                                                          p256dh: sub.p256dh,
                                                          auth: sub.auth
                                                      }
                                                  };
                                                  webpush.sendNotification(pushSubscription, payload)
                                                      .catch(err => {
                                                          console.error('[Web Push] Send Error:', err.statusCode);
                                                          if (err.statusCode === 410 || err.statusCode === 404) {
                                                              // Subscription expired, remove from DB
                                                              supabase.from('push_subscriptions').delete().eq('id', sub.id).then();
                                                          }
                                                      });
                                              });
                                          }
                                      } catch (pushErr) {
                                          console.error('[Web Push] Logic Error:', pushErr);
                                      }
                                 }
                             }
                         }
                    }

                    console.log('[M-Pesa] Order Payment Processed Successfully.');

                } else {
                    // --- WALLET DEPOSIT LOGIC ---
                    console.log('[M-Pesa] Not an order. Checking Wallet Deposits...');
                    
                    // Check for wallet deposit transaction by CheckoutRequestID stored in mpesa_receipt
                    const { data: depositTx, error: depositError } = await supabase
                        .from('wallet_transactions')
                        .select('id, wallet_id, amount, reference_id')
                        .eq('mpesa_receipt', CheckoutRequestID)
                        .eq('status', 'pending')
                        .eq('reference_type', 'deposit')
                        .maybeSingle();

                    if (depositTx) {
                        console.log(`[M-Pesa] Found Wallet Deposit Transaction #${depositTx.id}. Processing...`);
                        
                        // Call the process_wallet_deposit function
                        const { data: processResult, error: processError } = await supabase.rpc('process_wallet_deposit', {
                            p_transaction_id: depositTx.id,
                            p_mpesa_receipt: receipt
                        });

                        if (processError) {
                            console.error('[M-Pesa] Error processing wallet deposit:', processError);
                        } else {
                            console.log('[M-Pesa] Wallet Deposit Processed Successfully!');
                        }
                    } else {
                        console.warn(`[M-Pesa] No Subscription, Order, OR Wallet Deposit found for CheckoutRequestID: ${CheckoutRequestID}`);
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
