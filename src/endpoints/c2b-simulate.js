const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
    res.json({ message: 'C2B simulate endpoint placeholder' });
});

router.post('/callback', async (req, res) => {
    console.log('C2B Callback received:', req.body);
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
});

module.exports = router;
