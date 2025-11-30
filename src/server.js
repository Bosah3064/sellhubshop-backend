const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const Mpesa = require('./m-pesa')
const { createClient } = require('@supabase/supabase-js')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Initialize Supabase with service role key
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('✅ Supabase initialized with service role')

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Initialize M-Pesa with error handling - UPDATED WITH SHORT CODE
let mpesa
try {
  mpesa = new Mpesa({
    consumerKey: process.env.MPESA_CONSUMER_KEY,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET,
    // ✅ Use SHORT CODE for STK Push (3702683)
    lipaNaMpesaShortCode: process.env.MPESA_SHORTCODE || 3702683,
    lipaNaMpesaShortPass: process.env.MPESA_STK_PASSKEY || process.env.MPESA_PASSKEY,
    environment: 'production'
  })
  console.log('✅ M-Pesa initialized successfully with Short Code configuration')
} catch (error) {
  console.error('❌ M-Pesa initialization failed:', error.message)
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'SellHubShop M-Pesa API',
    version: '1.0.0',
    documentation: '/api/health'
  })
})

// STK Push Endpoint (original) - UPDATED
app.post('/api/stk-push', async (req, res) => {
  try {
    if (!mpesa) {
      return res.status(503).json({
        success: false,
        message: 'M-Pesa service is not available'
      })
    }

    const { phoneNumber, amount, accountRef } = req.body

    if (!phoneNumber || !amount || !accountRef) {
      return res.status(400).json({
        success: false,
        message: 'Phone number, amount and account reference are required'
      })
    }

    const formattedPhone = formatPhoneNumber(phoneNumber)
    const callbackUrl = `https://sellhubshop-backend.onrender.com/api/mpesa/callback`

    // ✅ CORRECT: Use object parameter format
    const response = await mpesa.lipaNaMpesaOnline({
      Amount: amount,
      PartyA: formattedPhone,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: accountRef,
      TransactionDesc: `Payment for ${accountRef}`
    })

    console.log('✅ STK Push initiated for:', formattedPhone, 'Amount:', amount)

    res.json({
      success: true,
      message: 'STK push initiated successfully',
      data: response
    })

  } catch (error) {
    console.error('❌ STK Push Error:', error.message)
    console.error('Error details:', error.response?.data)
    
    res.status(500).json({
      success: false,
      message: 'Failed to initiate STK push',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    })
  }
})

// NEW: Endpoint that your frontend is calling - COMPLETELY FIXED
app.post('/api/mpesa/initiate-stk-push', async (req, res) => {
  try {
    console.log('📱 Frontend STK Push Request:', req.body)

    if (!mpesa) {
      return res.status(503).json({
        success: false,
        message: 'M-Pesa service is not available'
      })
    }

    const { phoneNumber, amount, accountRef, planId, billingCycle, fullName, userId } = req.body

    // Use accountRef if provided, otherwise use planId
    const reference = accountRef || planId || 'TEST123'

    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber)

    const callbackUrl = `https://sellhubshop-backend.onrender.com/api/mpesa/callback`

    console.log('🚀 Calling M-Pesa STK Push with CORRECT credentials...', {
      phone: formattedPhone,
      amount,
      reference,
      planId,
      billingCycle,
      userId
    })

    // Save initial subscription record
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        plan_name: planId,
        billing_cycle: billingCycle,
        amount: amount,
        status: 'pending',
        phone_number: formattedPhone,
        initiated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()

    if (subscriptionError) {
      console.error('❌ Failed to create subscription record:', subscriptionError)
    } else {
      console.log('✅ Subscription record created:', subscriptionData)
    }

    // ✅ FIX: Better error handling for M-Pesa API call
    let response;
    try {
      response = await mpesa.lipaNaMpesaOnline({
        Amount: amount,
        PartyA: formattedPhone,
        PhoneNumber: formattedPhone,
        CallBackURL: callbackUrl,
        AccountReference: reference,
        TransactionDesc: `Payment for ${reference}`
      })
      
      console.log('✅ STK Push successful:', response?.data)
      
      // ✅ FIX: Check if response and response.data exist
      if (!response || !response.data) {
        throw new Error('M-Pesa returned empty response')
      }

      // ✅ FIX: Extract checkoutRequestID safely
      const checkoutRequestId = response.data.CheckoutRequestID;
      const merchantRequestId = response.data.MerchantRequestID;
      
      console.log('🎯 Extracted M-Pesa IDs:', {
        checkoutRequestId,
        merchantRequestId
      })
      
      if (!checkoutRequestId) {
        throw new Error('CheckoutRequestID is missing from M-Pesa response')
      }
      
      // Update subscription with M-Pesa IDs
      if (subscriptionData && subscriptionData[0]) {
        await supabase
          .from('subscriptions')
          .update({
            checkout_request_id: checkoutRequestId,
            merchant_request_id: merchantRequestId,
            updated_at: new Date().toISOString()
          })
          .eq('id', subscriptionData[0].id)
      }
      
      // ✅ FIXED: Return checkoutRequestID to frontend
      res.json({
        success: true,
        message: 'STK push initiated successfully',
        checkoutRequestID: checkoutRequestId,
        merchantRequestID: merchantRequestId,
        data: response.data
      })

    } catch (mpesaError) {
      console.error('❌ M-Pesa API Error:', mpesaError.message)
      console.error('❌ M-Pesa Error Details:', mpesaError.response?.data)
      throw new Error(`M-Pesa API failed: ${mpesaError.message}`)
    }

  } catch (error) {
    console.error('❌ STK Push Error:', error.message)
    console.error('Error details:', error.response?.data)
    
    res.status(500).json({
      success: false,
      message: 'Failed to initiate STK push',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    })
  }
})

// UPDATED: STK Callback URL with Database Saving
app.post('/api/mpesa/callback', async (req, res) => {
  try {
    const callbackData = req.body

    console.log('📞 M-Pesa Callback Received:', JSON.stringify(callbackData, null, 2))

    const merchantRequestID = callbackData.Body?.stkCallback?.MerchantRequestID
    const checkoutRequestID = callbackData.Body?.stkCallback?.CheckoutRequestID
    const resultCode = callbackData.Body?.stkCallback?.ResultCode
    const resultDesc = callbackData.Body?.stkCallback?.ResultDesc

    if (resultCode === 0) {
      // Payment successful
      const result = callbackData.Body.stkCallback.CallbackMetadata?.Item || []
      const amount = result.find(item => item.Name === 'Amount')?.Value
      const mpesaReceiptNumber = result.find(item => item.Name === 'MpesaReceiptNumber')?.Value
      const phoneNumber = result.find(item => item.Name === 'PhoneNumber')?.Value
      const transactionDate = result.find(item => item.Name === 'TransactionDate')?.Value

      console.log('💰 Payment Successful - Saving to database...')

      // Update subscription with successful payment details
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          amount: amount,
          phone_number: phoneNumber,
          mpesa_receipt_number: mpesaReceiptNumber,
          transaction_date: transactionDate?.toString(),
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('checkout_request_id', checkoutRequestID)
        .eq('merchant_request_id', merchantRequestID)

      if (error) {
        console.error('❌ Database update failed:', error)
      } else {
        console.log('✅ Payment successfully saved to database. Updated rows:', data)
      }

    } else {
      // Payment failed
      console.log('❌ Payment Failed:', resultDesc)

      // Update subscription with failure reason
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          status: 'failed',
          failure_reason: resultDesc,
          updated_at: new Date().toISOString()
        })
        .eq('checkout_request_id', checkoutRequestID)
        .eq('merchant_request_id', merchantRequestID)

      if (error) {
        console.error('❌ Failed to update subscription with error:', error)
      } else {
        console.log('✅ Failure recorded in database:', data)
      }
    }

    res.json({
      ResultCode: 0,
      ResultDesc: 'Callback processed successfully'
    })

  } catch (error) {
    console.error('❌ Callback Processing Error:', error)
    res.status(500).json({
      ResultCode: 1,
      ResultDesc: 'Error processing callback'
    })
  }
})

// STK Query Endpoint
app.post('/api/stk-query', async (req, res) => {
  try {
    if (!mpesa) {
      return res.status(503).json({
        success: false,
        message: 'M-Pesa service is not available'
      })
    }

    const { checkoutRequestId } = req.body

    if (!checkoutRequestId) {
      return res.status(400).json({
        success: false,
        message: 'Checkout Request ID is required'
      })
    }

    const response = await mpesa.lipaNaMpesaQuery(checkoutRequestId)

    res.json({
      success: true,
      data: response
    })

  } catch (error) {
    console.error('❌ STK Query Error:', error.response?.data || error.message)
    res.status(500).json({
      success: false,
      message: 'Failed to query STK status',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.response?.data || error.message
    })
  }
})

// ADD THIS ENDPOINT - Payment Status Check
app.post('/api/mpesa/check-status', async (req, res) => {
  try {
    const { checkoutRequestId, reference } = req.body;
    
    console.log('🔍 Checking payment status:', { checkoutRequestId, reference });
    
    if (!checkoutRequestId) {
      return res.status(400).json({
        success: false,
        message: 'checkoutRequestId is required'
      });
    }
    
    if (!mpesa) {
      return res.status(503).json({
        success: false,
        message: 'M-Pesa service is not available'
      });
    }

    // Query M-Pesa for transaction status
    const queryResult = await mpesa.lipaNaMpesaQuery(checkoutRequestId);
    
    console.log('📊 M-Pesa Query Result:', queryResult.data);
    
    // Check if we have a subscription to update
    if (queryResult.data.ResultCode === '0') {
      // Payment successful - update subscription
      const { data: subscriptionData, error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('checkout_request_id', checkoutRequestId)
        .select();

      if (updateError) {
        console.error('❌ Failed to update subscription:', updateError);
      } else {
        console.log('✅ Subscription updated to active:', subscriptionData);
      }
    }
    
    res.json({
      success: true,
      data: queryResult.data,
      status: queryResult.data.ResultCode === '0' ? 'completed' : 'pending',
      resultCode: queryResult.data.ResultCode,
      resultDesc: queryResult.data.ResultDesc
    });
    
  } catch (error) {
    console.error('❌ Payment status check failed:', error.message);
    
    // Even if query fails, we can check database status
    if (checkoutRequestId) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, mpesa_receipt_number')
        .eq('checkout_request_id', checkoutRequestId)
        .single();

      if (subscription) {
        return res.json({
          success: true,
          status: subscription.status,
          mpesaReceiptNumber: subscription.mpesa_receipt_number,
          message: 'Using database status'
        });
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
      error: error.message
    });
  }
});

// ADD THIS: M-Pesa Debug Test Endpoint
app.post('/api/debug/test-stk', async (req, res) => {
  try {
    const { phoneNumber, amount } = req.body;
    
    if (!mpesa) {
      return res.status(503).json({
        success: false,
        message: 'M-Pesa service is not available'
      });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber || '254708374149');
    const testAmount = amount || 1;
    
    console.log('🧪 Testing M-Pesa STK with:', { phone: formattedPhone, amount: testAmount });

    // Test M-Pesa authentication first
    const auth = await mpesa.oAuth();
    console.log('🔑 M-Pesa Auth:', auth.data);

    // Test STK push
    const response = await mpesa.lipaNaMpesaOnline({
      Amount: testAmount,
      PartyA: formattedPhone,
      PhoneNumber: formattedPhone,
      CallBackURL: 'https://sellhubshop-backend.onrender.com/api/mpesa/callback',
      AccountReference: 'DEBUG_TEST',
      TransactionDesc: 'Debug Test'
    });

    console.log('✅ M-Pesa Test Successful:', response.data);
    
    res.json({
      success: true,
      message: 'M-Pesa test successful',
      auth: auth.data,
      stkResponse: response.data
    });

  } catch (error) {
    console.error('❌ M-Pesa Test Failed:', error.message);
    console.error('Error details:', error.response?.data);
    
    res.status(500).json({
      success: false,
      message: 'M-Pesa test failed',
      error: error.message,
      details: error.response?.data
    });
  }
});

// Debug endpoints to check configuration - UPDATED
app.get('/api/debug/config', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV,
    mpesaInitialized: !!mpesa,
    stkShortCode: process.env.MPESA_SHORTCODE ? '✅ Short Code Set' : '❌ Short Code Missing',
    c2bShortCode: process.env.MPESA_SHORTCODE ? '✅ PayBill Set' : '❌ PayBill Missing',
    passkey: process.env.MPESA_PASSKEY ? '✅ Set' : '❌ Missing',
    consumerKey: process.env.MPESA_CONSUMER_KEY ? '✅ Set' : '❌ Missing',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET ? '✅ Set' : '❌ Missing',
    supabaseInitialized: !!supabase
  })
})

app.get('/api/debug/auth', async (req, res) => {
  try {
    const token = await mpesa.oAuth()
    res.json({ 
      success: true, 
      message: 'Authentication successful',
      access_token: token.data?.access_token ? '✅ Valid' : '❌ Invalid',
      token_type: token.data?.token_type
    })
  } catch (error) {
    res.json({ 
      success: false, 
      message: 'Authentication failed',
      error: error.message 
    })
  }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SellHubShop M-Pesa API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mpesaInitialized: !!mpesa,
    supabaseInitialized: !!supabase,
    port: PORT
  })
})

// C2B Validation Endpoint - REQUIRED by Safaricom
app.post('/api/mpesa/validate', async (req, res) => {
  try {
    const validationData = req.body;
    console.log('🔍 C2B Validation Received:', JSON.stringify(validationData, null, 2));
    
    // Always accept for now - you can add business logic later
    res.json({
      ResultCode: 0,
      ResultDesc: "Accepted"
    });
    
  } catch (error) {
    console.error('❌ C2B Validation Error:', error);
    res.json({
      ResultCode: 1,
      ResultDesc: "Validation Error"
    });
  }
});

// C2B Confirmation Endpoint - REQUIRED by Safaricom
app.post('/api/mpesa/confirm', async (req, res) => {
  try {
    const confirmationData = req.body;
    console.log('💰 C2B Confirmation Received:', JSON.stringify(confirmationData, null, 2));
    
    // Log the payment - you can save to database later
    console.log('💳 Payment Details:', {
      TransactionID: confirmationData.TransID,
      Amount: confirmationData.TransAmount,
      Reference: confirmationData.BillRefNumber,
      Phone: confirmationData.MSISDN
    });
    
    res.json({
      ResultCode: 0,
      ResultDesc: "Success"
    });
    
  } catch (error) {
    console.error('❌ C2B Confirmation Error:', error);
    res.json({
      ResultCode: 1,
      ResultDesc: "Processing Error"
    });
  }
});

// Phone number formatting helper function
function formatPhoneNumber(phone) {
  const cleaned = phone.toString().replace(/\D/g, '')
  
  if (cleaned.startsWith('0')) {
    return '254' + cleaned.substring(1)
  } else if (cleaned.startsWith('7') && cleaned.length === 9) {
    return '254' + cleaned
  } else if (cleaned.startsWith('254') && cleaned.length === 12) {
    return cleaned
  } else if (cleaned.startsWith('+254')) {
    return cleaned.substring(1)
  }
  
  return cleaned
}

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  })
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('🚨 Unhandled Error:', error)
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SellHubShop Backend running on port ${PORT}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`📍 Health: https://sellhubshop-backend.onrender.com/api/health`)
  console.log(`🔑 M-Pesa Initialized: ${!!mpesa}`)
  console.log(`🎯 STK ShortCode: ${process.env.MPESA_SHORTCODE || 3702683}`) // ✅ Updated to show Short Code
  console.log(`🗄️ Supabase Initialized: ${!!supabase}`)
})

module.exports = app