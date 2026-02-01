const express = require('express');
const router = express.Router();
const { supabase } = require('../helpers/supabase');

// POST /api/notifications/subscribe
router.post('/subscribe', async (req, res) => {
    const { userId, subscription } = req.body;

    if (!userId || !subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Missing userId or subscription data' });
    }

    try {
        // Save subscription to Supabase
        // subscription object contains: endpoint, keys: { p256dh, auth }
        // We flatten it for the DB table push_subscriptions(user_id, endpoint, p256dh, auth)
        
        const { data, error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: userId,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                created_at: new Date().toISOString()
            }, { onConflict: 'user_id, endpoint' })
            .select();

        if (error) throw error;

        console.log(`[Web Push] Subscribed user ${userId}`);
        res.json({ success: true, message: 'Subscription saved' });

    } catch (err) {
        console.error('[Web Push] Subscribe Error:', err.message);
        res.status(500).json({ error: 'Failed to save subscription' });
    }
});

// POST /api/notifications/unsubscribe (Optional)
router.post('/unsubscribe', async (req, res) => {
    const { userId, endpoint } = req.body;
    
    try {
        await supabase
            .from('push_subscriptions')
            .delete()
            .match({ user_id: userId, endpoint: endpoint });
            
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
