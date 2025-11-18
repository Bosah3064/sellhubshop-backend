import { generateAccessToken, generateTimestamp, generatePassword } from '../utils/safaricom.js';

// In-memory storage for demo (replace with database in production)
const paymentStore = new Map();

// Initialize STK Push
export const initiateSTKPush = async (req, res) => {
  try {
    const { phoneNumber, amount, planId, billingCycle, fullName, userId } = req.body;

    console.log('📱 STK Push Request:', {
      phoneNumber,
      amount,
      planId,
      billingCycle,
      fullName,
      userId,
      timestamp: new Date().toISOString()
    });

    // Validate input
    if (!phoneNumber || !amount || !planId || !userId) {
      return res.status(400).json({
        success: false,
        errorMessage: 'Missing required fields: phoneNumber, amount, planId, userId'
      });
    }

    // Validate environment variables
    const requiredEnvVars = [
      'SAFARICOM_CONSUMER_KEY',
      'SAFARICOM_CONSUMER_SECRET', 
      'SAFARICOM_BUSINESS_SHORTCODE',
      'SAFARICOM_PASSKEY',
      'SAFARICOM_CALLBACK_URL'
    ];

    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingEnvVars.length > 0) {
      console.error('❌ Missing environment variables:', missingEnvVars);
      return res.status(500).json({
        success: false,
        errorMessage: 'Payment service configuration incomplete'
      });
    }

    // Validate phone number format
    let formattedPhone = phoneNumber.toString().trim();
    
    if (formattedPhone.startsWith('0')) {
      formattedPhone = `254${formattedPhone.substring(1)}`;
    } else if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = `254${formattedPhone}`;
    }

    if (!/^254[17]\d{8}$/.test(formattedPhone)) {
      return res.status(400).json({
        success: false,
        errorMessage: 'Invalid phone number format. Use 07... or 254... format (10 digits after 254)'
      });
    }

    // Validate amount
    if (amount <= 0 || amount > 150000) {
      return res.status(400).json({
        success: false,
        errorMessage: 'Amount must be between 1 and 150,000 KES'
      });
    }

    // Generate Safaricom credentials
    const accessToken = await generateAccessToken();
    const timestamp = generateTimestamp();
    const password = generatePassword();

    const reference = `SUB_${planId}_${Date.now()}`;

    const stkPayload = {
      BusinessShortCode: process.env.SAFARICOM_BUSINESS_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.floor(amount), // Ensure whole number
      PartyA: formattedPhone,
      PartyB: process.env.SAFARICOM_BUSINESS_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: process.env.SAFARICOM_CALLBACK_URL,
      AccountReference: reference,
      TransactionDesc: `Subscription: ${planId} - ${billingCycle}`,
    };

    console.log('📦 STK Push Payload:', stkPayload);

    const safaricomUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

    const response = await fetch(safaricomUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Safaricom API HTTP Error:', response.status, errorText);
      throw new Error(`Safaricom API returned ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Safaricom Response:', data);

    if (data.ResponseCode === '0') {
      // Store payment record
      const paymentRecord = {
        checkoutRequestID: data.CheckoutRequestID,
        merchantRequestID: data.MerchantRequestID,
        phoneNumber: formattedPhone,
        amount,
        planId,
        billingCycle,
        fullName,
        userId,
        reference,
        status: 'pending',
        initiatedAt: new Date().toISOString(),
        attempts: 0
      };

      paymentStore.set(data.CheckoutRequestID, paymentRecord);

      // Auto-cleanup after 1 hour
      setTimeout(() => {
        if (paymentStore.has(data.CheckoutRequestID)) {
          paymentStore.delete(data.CheckoutRequestID);
        }
      }, 60 * 60 * 1000);

      return res.status(200).json({
        success: true,
        checkoutRequestID: data.CheckoutRequestID,
        merchantRequestID: data.MerchantRequestID,
        customerMessage: data.CustomerMessage || 'Check your phone for M-Pesa prompt',
        responseDescription: data.ResponseDescription
      });
    } else {
      const errorMsg = data.errorMessage || data.ResponseDescription || 'STK Push initiation failed';
      console.error('❌ Safaricom API Error:', errorMsg);
      
      return res.status(400).json({
        success: false,
        errorMessage: errorMsg,
        responseCode: data.ResponseCode
      });
    }
  } catch (error) {
    console.error('💥 STK Push error:', error);
    return res.status(500).json({
      success: false,
      errorMessage: error.message || 'Internal server error during STK push'
    });
  }
};

// Handle M-Pesa callback (keep your existing version - it's good)
export const handleCallback = async (req, res) => {
  try {
    const callbackData = req.body;

    console.log('📥 M-Pesa Callback Received:', JSON.stringify(callbackData, null, 2));

    if (callbackData.Body.stkCallback) {
      const resultCode = callbackData.Body.stkCallback.ResultCode;
      const resultDesc = callbackData.Body.stkCallback.ResultDesc;
      const checkoutRequestID = callbackData.Body.stkCallback.CheckoutRequestID;
      const callbackMetadata = callbackData.Body.stkCallback.CallbackMetadata;

      const paymentRecord = paymentStore.get(checkoutRequestID);

      if (resultCode === 0 && callbackMetadata) {
        // Payment successful
        const items = callbackMetadata.Item;
        const amount = items.find((item) => item.Name === 'Amount')?.Value;
        const mpesaReceiptNumber = items.find((item) => item.Name === 'MpesaReceiptNumber')?.Value;
        const phoneNumber = items.find((item) => item.Name === 'PhoneNumber')?.Value;
        const transactionDate = items.find((item) => item.Name === 'TransactionDate')?.Value;

        if (paymentRecord) {
          paymentRecord.status = 'active';
          paymentRecord.mpesaReceiptNumber = mpesaReceiptNumber;
          paymentRecord.transactionDate = transactionDate;
          paymentRecord.confirmedAt = new Date().toISOString();
        }

        console.log('✅ Payment successful:', {
          checkoutRequestID,
          mpesaReceiptNumber,
          amount,
          phoneNumber,
          transactionDate
        });

      } else {
        // Payment failed
        console.error('❌ Payment failed:', { resultCode, resultDesc, checkoutRequestID });

        if (paymentRecord) {
          paymentRecord.status = 'failed';
          paymentRecord.failureReason = resultDesc;
        }
      }
    }

    // Always respond with success to Safaricom
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Success'
    });
  } catch (error) {
    console.error('💥 Callback processing error:', error);
    res.status(200).json({
      ResultCode: 1,
      ResultDesc: 'Error processing callback'
    });
  }
};

// Check payment status (improved version)
export const checkPaymentStatus = async (req, res) => {
  try {
    const { checkoutRequestID } = req.body;

    if (!checkoutRequestID) {
      return res.status(400).json({
        success: false,
        errorMessage: 'checkoutRequestID is required'
      });
    }

    console.log('🔍 Checking payment status for:', checkoutRequestID);

    const paymentRecord = paymentStore.get(checkoutRequestID);

    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        errorMessage: 'Payment record not found. It may have expired.'
      });
    }

    // Increment attempt count
    paymentRecord.attempts = (paymentRecord.attempts || 0) + 1;

    return res.status(200).json({
      success: true,
      status: paymentRecord.status,
      mpesaReceiptNumber: paymentRecord.mpesaReceiptNumber,
      failureReason: paymentRecord.failureReason,
      amount: paymentRecord.amount,
      planId: paymentRecord.planId,
      attempts: paymentRecord.attempts
    });

  } catch (error) {
    console.error('💥 Status check error:', error);
    return res.status(500).json({
      success: false,
      errorMessage: 'Internal server error during status check'
    });
  }
};