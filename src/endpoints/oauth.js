const express = require('express');
const router = express.Router();
const helpers = require('../helpers');

const { MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_ENV } = process.env;

router.get('/', async (req, res) => {
    try {
        const token = await helpers.getAccessToken(MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_ENV);
        res.json({ access_token: token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
