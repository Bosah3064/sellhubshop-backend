import express from 'express';
import { initiateSTKPush, handleCallback, checkPaymentStatus } from '../controllers/mpesaController.js';

const router = express.Router();

// ADD THESE GET ROUTES:
// Root route for /api/mpesa
router.get('/', (req, res) => {
  res.json({
    message: 'M-Pesa API is working!',
    availableEndpoints: {
      'GET /': 'API information',
      'GET /test': 'Test route',
      'POST /initiate-stk-push': 'Initiate M-Pesa payment',
      'POST /callback': 'Handle M-Pesa callback',
      'POST /check-status': 'Check payment status'
    },
    timestamp: new Date().toISOString()
  });
});

// Test route
router.get('/test', (req, res) => {
  res.json({
    message: 'M-Pesa test route is working!',
    timestamp: new Date().toISOString()
  });
});

// Info route for initiation (optional)
router.get('/initiate-info', (req, res) => {
  res.json({
    message: 'Use POST /initiate-stk-push to initiate payment',
    example: {
      phoneNumber: "254712345678",
      amount: 1,
      planId: "silver",
      billingCycle: "monthly",
      fullName: "Test User",
      userId: "test-123"
    }
  });
});

// Your existing POST routes
router.post('/initiate-stk-push', initiateSTKPush);
router.post('/callback', handleCallback);
router.post('/check-status', checkPaymentStatus);

export default router;