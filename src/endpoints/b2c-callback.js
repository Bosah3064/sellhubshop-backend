const express = require('express');
const router = express.Router();
const { supabase } = require('../helpers/supabase');

// B2C Result Callback - Handles withdrawal confirmations
router.post('/result', async (req, res) => {
    console.log('------------------------------------------------');
    console.log('[B2C Callback] Result Received');
    const callbackData = req.body;

    // Log the entire body for debugging
    console.log(JSON.stringify(callbackData, null, 2));

    if (!callbackData.Result) {
        console.error('[B2C] Invalid Callback Structure');
        return res.json({ result: 'fail', message: 'Invalid structure' });
    }

    const { ResultCode, ResultDesc, ConversationID, TransactionID } = callbackData.Result;
    const resultParams = callbackData.Result.ResultParameters?.ResultParameter || [];

    console.log(`[B2C] Result Code: ${ResultCode}`);
    console.log(`[B2C] Description: ${ResultDesc}`);
    console.log(`[B2C] Conversation ID: ${ConversationID}`);
    console.log(`[B2C] Transaction ID: ${TransactionID}`);

    try {
        // Find the transaction by conversation ID
        const { data: transaction, error: findError } = await supabase
            .from('wallet_transactions')
            .select('*, wallets(*)')
            .eq('reference_id', ConversationID)
            .eq('reference_type', 'withdrawal')
            .single();

        if (findError || !transaction) {
            console.error('[B2C] Transaction not found:', findError);
            return res.json({ result: 'success', message: 'Transaction not found' });
        }

        console.log(`[B2C] Found transaction: ${transaction.id}`);

        if (ResultCode === 0) {
            // SUCCESS - Withdrawal completed
            console.log('[B2C] Withdrawal Successful!');

            // Extract result parameters
            let amount = null;
            let recipientPhone = null;
            let transactionDate = null;
            let receiverPartyPublicName = null;

            resultParams.forEach(param => {
                if (param.Key === 'TransactionAmount') amount = param.Value;
                if (param.Key === 'TransactionReceipt') TransactionID = param.Value;
                if (param.Key === 'ReceiverPartyPublicName') receiverPartyPublicName = param.Value;
                if (param.Key === 'TransactionCompletedDateTime') transactionDate = param.Value;
                if (param.Key === 'B2CRecipientIsRegisteredCustomer') recipientPhone = param.Value;
            });

            console.log(`[B2C] Amount: ${amount}, Receipt: ${TransactionID}, Recipient: ${receiverPartyPublicName}`);

            // Update transaction to completed
            const { error: updateError } = await supabase
                .from('wallet_transactions')
                .update({
                    status: 'completed',
                    reference_id: TransactionID || ConversationID,
                    description: `${transaction.description} - Completed`
                })
                .eq('id', transaction.id);

            if (updateError) {
                console.error('[B2C] Transaction update failed:', updateError);
            } else {
                console.log('[B2C] Transaction marked as completed');
            }

        } else {
            // FAILURE - Withdrawal failed
            console.log('[B2C] Withdrawal Failed/Cancelled');
            console.log(`[B2C] Reason: ${ResultDesc}`);

            // Update transaction to failed
            const { error: updateError } = await supabase
                .from('wallet_transactions')
                .update({
                    status: 'failed',
                    description: `${transaction.description} - Failed: ${ResultDesc}`
                })
                .eq('id', transaction.id);

            if (updateError) {
                console.error('[B2C] Transaction update failed:', updateError);
            }

            // REFUND - Add money back to wallet
            if (transaction.wallets) {
                const { error: refundError } = await supabase
                    .from('wallets')
                    .update({
                        balance: parseFloat(transaction.wallets.balance) + parseFloat(transaction.amount)
                    })
                    .eq('id', transaction.wallet_id);

                if (refundError) {
                    console.error('[B2C] Refund failed:', refundError);
                } else {
                    console.log(`[B2C] Refunded KSh ${transaction.amount} to wallet`);
                }
            }
        }

    } catch (error) {
        console.error('[B2C] Callback Processing Error:', error);
    }

    console.log('------------------------------------------------');
    res.json({ result: 'success' });
});

// B2C Timeout Callback - Handles timeout scenarios
router.post('/timeout', async (req, res) => {
    console.log('[B2C Timeout] Received');
    console.log(JSON.stringify(req.body, null, 2));

    const { ConversationID } = req.body.Result || {};

    if (ConversationID) {
        try {
            // Find and mark transaction as failed
            const { data: transaction } = await supabase
                .from('wallet_transactions')
                .select('*, wallets(*)')
                .eq('reference_id', ConversationID)
                .eq('reference_type', 'withdrawal')
                .single();

            if (transaction) {
                // Mark as failed
                await supabase
                    .from('wallet_transactions')
                    .update({
                        status: 'failed',
                        description: `${transaction.description} - Timeout`
                    })
                    .eq('id', transaction.id);

                // Refund to wallet
                if (transaction.wallets) {
                    await supabase
                        .from('wallets')
                        .update({
                            balance: parseFloat(transaction.wallets.balance) + parseFloat(transaction.amount)
                        })
                        .eq('id', transaction.wallet_id);

                    console.log(`[B2C Timeout] Refunded KSh ${transaction.amount}`);
                }
            }
        } catch (error) {
            console.error('[B2C Timeout] Error:', error);
        }
    }

    res.json({ result: 'success' });
});

module.exports = router;
