const express = require('express');
const router = express.Router();
const { supabase } = require('../helpers/supabase');

/**
 * POST /api/referrals/create
 * Create a referral record during user registration
 * Uses service role to bypass RLS
 */
router.post('/create', async (req, res) => {
    try {
        const { referrer_id, referred_id, referral_code_used } = req.body;

        // Validate required fields
        if (!referrer_id || !referred_id || !referral_code_used) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: referrer_id, referred_id, referral_code_used'
            });
        }

        console.log('[Referral] Creating referral record:', {
            referrer_id,
            referred_id,
            referral_code_used
        });

        // Insert referral record using service role (bypasses RLS)
        const { data, error } = await supabase
            .from('referrals')
            .insert({
                referrer_id,
                referred_id,
                referral_code_used,
                status: 'pending',
                reward_amount: 0,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('[Referral] Error creating referral:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }

        console.log('[Referral] Successfully created referral:', data.id);

        res.json({
            success: true,
            data
        });

    } catch (error) {
        console.error('[Referral] Unexpected error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

module.exports = router;
