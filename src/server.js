const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const Mpesa = require('./m-pesa')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ✅ FIX: Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// ✅ FIX: Initialize M-Pesa with error handling
let mpesa
try {
  mpesa = new Mpesa({
    consumerKey: process.env.MPESA_CONSUMER_KEY,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET,
    lipaNaMpesaShortCode: process.env.MPESA_SHORTCODE,
    lipaNaMpesaShortPass: process.env.MPESA_PASSKEY,
    securityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
    initiatorName: process.env.MPESA_INITIATOR_NAME,
    environment: process.env.NODE_ENV || 'sandbox'
  })
  console.log('✅ M-Pesa initialized successfully')
} catch (error) {
  console.error('❌ M-Pesa initialization failed:', error.message)
  // Don't exit in production, but log the error
}

// ✅ FIX: Add root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'SellHubShop M-Pesa API',
    version: '1.0.0',
    documentation: '/api/health'
  })
})

// STK Push Endpoint
app.post('/api/stk-push', async (req, res) => {
  try {
    // ✅ FIX: Check if M-Pesa is initialized
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

    // ✅ FIX: Validate phone number format
    const formattedPhone = phoneNumber.startsWith('254') ? phoneNumber : 
                           phoneNumber.startsWith('0') ? `254${phoneNumber.substring(1)}` : 
                           phoneNumber.startsWith('+254') ? phoneNumber.substring(1) : 
                           `254${phoneNumber}`

    // ✅ FIX: Use environment variable for callback URL
    const callbackUrl = process.env.MPESA_CALLBACK_URL || `https://${req.get('host')}/api/mpesa/callback`

    const response = await mpesa.lipaNaMpesaOnline(
      formattedPhone,
      amount,
      callbackUrl,
      accountRef
    )

    console.log('✅ STK Push initiated for:', formattedPhone, 'Amount:', amount)

    res.json({
      success: true,
      message: 'STK push initiated successfully',
      data: response
    })

  } catch (error) {
    console.error('❌ STK Push Error:', error.response?.data || error.message)
    res.status(500).json({
      success: false,
      message: 'Failed to initiate STK push',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.response?.data || error.message
    })
  }
})

// STK Callback URL
app.post('/api/mpesa/callback', (req, res) => {
  try {
    const callbackData = req.body

    console.log('📞 M-Pesa Callback Received:', JSON.stringify(callbackData, null, 2))

    if (callbackData.Body?.stkCallback?.ResultCode === 0) {
      const result = callbackData.Body.stkCallback.CallbackMetadata?.Item || []
      const amount = result.find(item => item.Name === 'Amount')?.Value
      const mpesaReceiptNumber = result.find(item => item.Name === 'MpesaReceiptNumber')?.Value
      const phoneNumber = result.find(item => item.Name === 'PhoneNumber')?.Value

      console.log('💰 Payment Successful:', {
        amount,
        mpesaReceiptNumber,
        phoneNumber,
        timestamp: new Date().toISOString()
      })

      // TODO: Update your database here
      // Add your business logic to process successful payment

    } else {
      const errorMessage = callbackData.Body?.stkCallback?.ResultDesc || 'Unknown error'
      console.log('❌ Payment Failed:', errorMessage)
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
    // ✅ FIX: Check if M-Pesa is initialized
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SellHubShop M-Pesa API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mpesaInitialized: !!mpesa,
    port: PORT
  })
})

// ✅ FIX: Add 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  })
})

// ✅ FIX: Add error handling middleware
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
})

module.exports = app