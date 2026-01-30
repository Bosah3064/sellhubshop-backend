const express = require('express');
const router = express.Router();

// Import all endpoint modules
const accountBalance = require('./account-balance');
const b2b = require('./b2b');
const b2c = require('./b2c');
const c2bRegister = require('./c2b-register');
const c2bSimulate = require('./c2b-simulate');
const lipaNaMpesaOnline = require('./lipa-na-mpesa-online');
const lipaNaMpesaQuery = require('./lipa-na-mpesa-query');
const oauth = require('./oauth');
const reversal = require('./reversal');
const transactionStatus = require('./transaction-status');

// Mount routes
router.use('/account-balance', accountBalance);
router.use('/b2b', b2b);
router.use('/b2c', b2c);
router.use('/c2b-register', c2bRegister);
router.use('/c2b-simulate', c2bSimulate);
router.use('/lipa-na-mpesa-online', lipaNaMpesaOnline);
router.use('/lipa-na-mpesa-query', lipaNaMpesaQuery);
router.use('/oauth', oauth);
router.use('/reversal', reversal);
router.use('/transaction-status', transactionStatus);

module.exports = router;
