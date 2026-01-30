const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase with Service Role Key to bypass RLS
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    // Note: Using Service Role Key is critical for this to work.
    // If undefined, it falls back to ANON_KEY which fails RLS. 
);

// GET /api/admin/list - List all admins with profiles
router.get('/list', async (req, res) => {
    try {
        const { data: adminUsers, error } = await supabase
            .from('admin_users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Manually join with profiles since we are in node.js and want full control
        // OR we could use the select includes if foreign keys are set up, 
        // but fetching manually is sometimes safer with mixed permissions.
        // Let's try the join first if the relationship exists.
        // Actually, let's fetch profiles for these users manually to be robust.

        const userIds = adminUsers.map(a => a.user_id);

        if (userIds.length === 0) {
            return res.json({ success: true, daa: [] });
        }

        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', userIds);

        if (profileError) throw profileError;

        // Map profiles to admins
        const profileMap = {};
        profiles.forEach(p => profileMap[p.id] = p);

        const result = adminUsers.map(admin => ({
            ...admin,
            email: profileMap[admin.user_id]?.email || 'Unknown',
            full_name: profileMap[admin.user_id]?.full_name || 'Unknown'
        }));

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error listing admins:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/admin/search-users - Search users to add
router.get('/search-users', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.json({ success: true, data: [] });

        const { data: users, error } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .ilike('email', `%${query}%`)
            .limit(10);

        if (error) throw error;

        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/admin/add - Add a new admin
router.post('/add', async (req, res) => {
    try {
        const { email, role, permissions } = req.body;

        // 1. Find user by email
        const { data: user, error: userError } = await supabase
            .from('profiles')
            .select('id')
            .ilike('email', email)
            .single();

        if (userError || !user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // 2. Check if already admin
        const { data: existing, error: checkError } = await supabase
            .from('admin_users')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (existing) {
            return res.status(400).json({ success: false, error: 'User is already an admin' });
        }

        // 3. Insert admin
        const { data: newAdmin, error: insertError } = await supabase
            .from('admin_users')
            .insert({
                user_id: user.id,
                role: role,
                permissions: permissions || {},
                is_active: true
            })
            .select()
            .single();

        if (insertError) throw insertError;

        res.json({ success: true, data: newAdmin });
    } catch (error) {
        console.error('Error adding admin:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/admin/remove/:id - Remove an admin
router.delete('/remove/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('admin_users')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ success: true });
    } catch (error) {
        console.error('Error removing admin:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
