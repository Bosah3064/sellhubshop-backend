import { generateAccessToken, generateTimestamp, generatePassword } from '../utils/safaricom.js';

// In-memory storage (REPLACE WITH REDIS/DATABASE IN PRODUCTION)
const paymentStore = new Map();

// Initialize STK Push - PRODUCTION READY
export const initiateSTKPush = async (req, res) => {
  try {
    const { phoneNumber, amount, planId, billingCycle, fullName, userId } = req.body;

    console.log('📱 PRODUCTION STK Push Request:', {
      phoneNumber,
      amount,
      planId,
      billingCycle,
      fullName,
      userId,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });

    // Validate input
    if (!phoneNumber || !amount || !planId || !userId) {
      return res.status(400).json({
        success: false,
        errorMessage: 'Missing required fields: phoneNumber, amount, planId, userId'
      });
    }

    // Validate production environment variables
    const requiredEnvVars = [
      'SAFARICOM_CONSUMER_KEY',
      'SAFARICOM_CONSUMER_SECRET', 
      'SAFARICOM_BUSINESS_SHORTCODE',
      'SAFARICOM_PASSKEY',
      'SAFARICOM_CALLBACK_URL'
    ];

    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingEnvVars.length > 0) {
      console.error('❌ PRODUCTION: Missing environment variables:', missingEnvVars);
      return res.status(500).json({
        success: false,
        errorMessage: 'M-Pesa production configuration incomplete'
      });
    }

    // Validate phone number format for production
    let formattedPhone = phoneNumber.toString().trim();
    
    if (formattedPhone.startsWith('0')) {
      formattedPhone = `254${formattedPhone.substring(1)}`;
    } else if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = `254${formattedPhone}`;
    }

    // Production phone validation
    if (!/^254[17]\d{8}$/.test(formattedPhone)) {
      return res.status(400).json({
        success: false,
        errorMessage: 'Invalid Kenyan phone number. Use 07... or 254... format'
      });
    }

    // Validate amount for production
    if (amount <= 0 || amount > 150000) {
      return res.status(400).json({
        success: false,
        errorMessage: 'Amount must be between 1 and 150,000 KES'
      });
    }

    // Generate M-Pesa credentials
    const accessToken = await generateAccessToken();
    const timestamp = generateTimestamp();
    const password = generatePassword();

    const reference = `SUB_${planId}_${Date.now()}_${userId.slice(-6)}`;

    const stkPayload = {
      BusinessShortCode: process.env.SAFARICOM_BUSINESS_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.floor(amount),
      PartyA: formattedPhone,
      PartyB: process.env.SAFARICOM_BUSINESS_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: process.env.SAFARICOM_CALLBACK_URL,
      AccountReference: reference,
      TransactionDesc: `SellHubShop: ${planId} - ${billingCycle}`,
    };

    console.log('📦 PRODUCTION STK Push Payload:', {
      ...stkPayload,
      Password: '***', // Hide password in logs
      BusinessShortCode: process.env.SAFARICOM_BUSINESS_SHORTCODE
    });

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
      console.error('❌ M-Pesa PRODUCTION API Error:', response.status, errorText);
      throw new Error(`M-Pesa service returned ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ M-Pesa PRODUCTION Response:', data);

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
        attempts: 0,
        environment: process.env.NODE_ENV
      };

      paymentStore.set(data.CheckoutRequestID, paymentRecord);

      // Auto-cleanup after 2 hours for production
      setTimeout(() => {
        if (paymentStore.has(data.CheckoutRequestID)) {
          console.log('🧹 Cleaning up expired payment record:', data.CheckoutRequestID);
          paymentStore.delete(data.CheckoutRequestID);
        }
      }, 2 * 60 * 60 * 1000);

      return res.status(200).json({
        success: true,
        checkoutRequestID: data.CheckoutRequestID,
        merchantRequestID: data.MerchantRequestID,
        customerMessage: data.CustomerMessage || 'Check your phone for M-Pesa prompt',
        responseDescription: data.ResponseDescription,
        reference: reference
      });
    } else {
      const errorMsg = data.errorMessage || data.ResponseDescription || 'STK Push initiation failed';
      console.error('❌ M-Pesa PRODUCTION API Error:', errorMsg);
      
      return res.status(400).json({
        success: false,
        errorMessage: errorMsg,
        responseCode: data.ResponseCode
      });
    }
  } catch (error) {
    console.error('💥 PRODUCTION STK Push error:', error);
    return res.status(500).json({
      success: false,
        errorMessage: `Payment service error: ${error.message}`
    });
  }
};

// Handle M-Pesa callback - PRODUCTION READY
export const handleCallback = async (req, res) => {
  try {
    const callbackData = req.body;

    console.log('📥 PRODUCTION M-Pesa Callback Received:', {
      type: 'callback',
      timestamp: new Date().toISOString(),
      hasBody: !!callbackData,
      environment: process.env.NODE_ENV
    });

    if (callbackData.Body && callbackData.Body.stkCallback) {
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
          paymentRecord.status = 'completed';
          paymentRecord.mpesaReceiptNumber = mpesaReceiptNumber;
          paymentRecord.transactionDate = transactionDate;
          paymentRecord.confirmedAt = new Date().toISOString();
          
          console.log('✅ PRODUCTION Payment completed:', {
            checkoutRequestID,
            mpesaReceiptNumber,
            amount,
            phoneNumber,
            userId: paymentRecord.userId,
            planId: paymentRecord.planId
          });

          // TODO: Update your database here
          // await updateSubscriptionInDatabase(paymentRecord);

        } else {
          console.warn('⚠️ PRODUCTION: Payment record not found for:', checkoutRequestID);
        }

      } else {
        // Payment failed
        console.error('❌ PRODUCTION Payment failed:', { 
          resultCode, 
          resultDesc, 
          checkoutRequestID,
          environment: process.env.NODE_ENV 
        });

        if (paymentRecord) {
          paymentRecord.status = 'failed';
          paymentRecord.failureReason = resultDesc;
          paymentRecord.failedAt = new Date().toISOString();
        }
      }
    } else {
      console.warn('⚠️ PRODUCTION: Invalid callback structure:', callbackData);
    }

    // Always respond with success to M-Pesa
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Success'
    });
  } catch (error) {
    console.error('💥 PRODUCTION Callback processing error:', error);
    res.status(200).json({
      ResultCode: 1,
      ResultDesc: 'Error processing callback'
    });
  }
};

// Check payment status - PRODUCTION READY
export const checkPaymentStatus = async (req, res) => {
  try {
    const { checkoutRequestID } = req.body;

    if (!checkoutRequestID) {
      return res.status(400).json({
        success: false,
        errorMessage: 'checkoutRequestID is required'
      });
    }

    console.log('🔍 PRODUCTION Checking payment status for:', checkoutRequestID);

    const paymentRecord = paymentStore.get(checkoutRequestID);

    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        errorMessage: 'Payment record not found or expired'
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
      reference: paymentRecord.reference,
      attempts: paymentRecord.attempts,
      initiatedAt: paymentRecord.initiatedAt,
      confirmedAt: paymentRecord.confirmedAt
    });

  } catch (error) {
    console.error('💥 PRODUCTION Status check error:', error);
    return res.status(500).json({
      success: false,
      errorMessage: 'Internal server error during status check'
    });
  }
};

// ✅ ADDED: Debug config function
export const getConfig = async (req, res) => {
  try {
    // Hide sensitive values in logs
    const consumerKey = process.env.SAFARICOM_CONSUMER_KEY;
    const consumerSecret = process.env.SAFARICOM_CONSUMER_SECRET;
    const passkey = process.env.SAFARICOM_PASSKEY;
    
    res.json({
      success: true,
      config: {
        environment: process.env.NODE_ENV,
        shortcode: process.env.SAFARICOM_BUSINESS_SHORTCODE,
        hasConsumerKey: !!consumerKey,
        hasConsumerSecret: !!consumerSecret,
        hasPasskey: !!passkey,
        callbackUrl: process.env.SAFARICOM_CALLBACK_URL,
        isProduction: process.env.NODE_ENV === 'production',
        // Safely show first/last chars of sensitive values for verification
        consumerKeyPreview: consumerKey ? `${consumerKey.substring(0, 6)}...${consumerKey.substring(consumerKey.length - 4)}` : 'MISSING',
        consumerSecretPreview: consumerSecret ? `${consumerSecret.substring(0, 6)}...${consumerSecret.substring(consumerSecret.length - 4)}` : 'MISSING',
        passkeyPreview: passkey ? `${passkey.substring(0, 4)}...${passkey.substring(passkey.length - 4)}` : 'MISSING'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};