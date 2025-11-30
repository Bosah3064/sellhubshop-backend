const express = require('express');
const router = express.Router();

const c2b = require('./endpoints/c2b-register');
const c2bSim = require('./endpoints/c2b-simulate');
const b2c = require('./endpoints/b2c');
const b2b = require('./endpoints/b2b');
const lipa = require('./endpoints/lipa-na-mpesa-online');
const lipaQuery = require('./endpoints/lipa-na-mpesa-query');
const oauth = require('./endpoints/oauth');
const reversal = require('./endpoints/reversal');
const txnStatus = require('./endpoints/transaction-status');

// Routes
router.use('/c2b/register', c2b);
router.use('/c2b/simulate', c2bSim);
router.use('/b2c', b2c);
router.use('/b2b', b2b);
router.use('/lipa', lipa);
router.use('/lipa-query', lipaQuery);
router.use('/oauth', oauth);
router.use('/reversal', reversal);
router.use('/transaction-status', txnStatus);

module.exports = router;
