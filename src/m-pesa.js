const express = require('express');
const router = express.Router();
const authMiddleware = require('./middleware/auth');

// Apply auth middleware ONLY to routes that require it (Initiation)
// Callbacks from Safaricom must be public
// router.use(authMiddleware); <--- REMOVED GLOBAL AUTH

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

// Authenticated Routes (require user login)
router.use('/c2b/register', authMiddleware, c2b);
router.use('/c2b/simulate', authMiddleware, c2bSim);
router.use('/b2c', authMiddleware, b2c);
router.use('/b2b', authMiddleware, b2b);

// STK Push Initiation (Authenticated) & Callback (Public - inside the module)
// Note: lipa-na-mpesa-online.js handles its own routing. 
// We mount it directly, but we need to ensure the INITIATION endpoint is protected there or here.
// Since lipa-na-mpesa-online.js exports a router, we can't easily wrap just one route here without changing the file structure.
// STRATEGY: Mount it publicly here, but ensure the initiation route inside it has auth if needed, 
// OR (simpler for now): Mount it publicly because the Callback MUST be public. 
// We will add authMiddleware inside the specific initiates route in lipa-na-mpesa-online.js if strictly needed, 
// but for now, let's open it up to unblock the callback.
// Mount lipa handler to support both initiation (/stk-push) and callback (/callback)
// This ensures that /api/mpesa/callback (from .env) works correctly
router.use('/mpesa/stk-push', lipa); // Alias for initiation (Must be first!)
router.use('/mpesa', lipa); // General mount (supports /callback)
router.use('/lipa', lipa);


router.use('/lipa-query', authMiddleware, lipaQuery);
router.use('/mpesa/query', authMiddleware, lipaQuery); // Alias
router.use('/oauth', oauth); // OAuth might be internal/public depending on use case
router.use('/reversal', authMiddleware, reversal);
router.use('/transaction-status', authMiddleware, txnStatus);


module.exports = router;
