const express = require('express');
const router = express.Router();
const requestHelper = require('../helpers/request');
const helpers = require('../helpers');
const { MPESA_ENV, MPESA_SHORTCODE, CALLBACK_URL } = process.env;

router.post('/', async (req, res) => {
    res.json({ message: 'C2B register endpoint placeholder' });
});

module.exports = router;
