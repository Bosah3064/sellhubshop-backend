const moment = require('moment')

/**
 * Lipa Na Mpesa Online Payment
 * @name lipaNaMpesaOnline
 * @function
 * @description Use this API to initiate online payment on behalf of a customer.
 * @param {Object} payload - The data required for Lipa Na Mpesa Online Payment
 * @see {@link https://developer.safaricom.co.ke/docs#lipa-na-m-pesa-online-request | Lipa Na Mpesa Online Request}
 */
const lipaNaMpesaOnline = async function (payload = {}) {
  try {
    const {
      BusinessShortCode = this.configs?.lipaNaMpesaShortCode,
      TransactionType = 'CustomerPayBillOnline', // ✅ Changed for Short Code
      Amount,
      PartyA,
      PartyB = this.configs?.lipaNaMpesaShortCode,
      PhoneNumber,
      CallBackURL,
      AccountReference,
      TransactionDesc
    } = payload

    // ✅ Enhanced validation with better error handling
    const missing = []
    if (!Amount) missing.push('Amount')
    if (!PartyA) missing.push('PartyA')
    if (!PhoneNumber) missing.push('PhoneNumber')
    if (!CallBackURL) missing.push('CallBackURL')

    if (missing.length) {
      throw new Error(`The following LipaNaMpesaOnline parameters are missing: ${missing.join(', ')}`)
    }

    // ✅ Validate configuration exists
    if (!this.configs?.lipaNaMpesaShortCode || !this.configs?.lipaNaMpesaShortPass) {
      throw new Error('M-Pesa configuration is missing or incomplete. Please check lipaNaMpesaShortCode and lipaNaMpesaShortPass.')
    }

    // ✅ Generate password with SHORT CODE
    const timestamp = moment().format('YYYYMMDDHHmmss')
    const password = Buffer.from(
      `${BusinessShortCode}${this.configs.lipaNaMpesaShortPass}${timestamp}`
    ).toString('base64')

    // ✅ Safely format phone numbers with error handling
    const formattedPartyA = formatPhoneNumber(PartyA)
    const formattedPhoneNumber = formatPhoneNumber(PhoneNumber)

    const requestPayload = {
      BusinessShortCode: parseInt(BusinessShortCode),
      Password: password,
      Timestamp: timestamp,
      TransactionType, // ✅ Now 'CustomerPayBillOnline' for Short Code
      Amount: parseInt(Amount),
      PartyA: formattedPartyA,
      PartyB: parseInt(PartyB),
      PhoneNumber: formattedPhoneNumber,
      CallBackURL,
      AccountReference: AccountReference?.toString().substring(0, 12) || 'Payment',
      TransactionDesc: TransactionDesc?.toString().substring(0, 13) || 'Payment'
    }

    console.log('🎯 CORRECT STK Push Payload:', {
      BusinessShortCode: requestPayload.BusinessShortCode,
      TransactionType: requestPayload.TransactionType,
      PartyB: requestPayload.PartyB,
      Amount: requestPayload.Amount,
      PhoneNumber: requestPayload.PhoneNumber,
      AccountReference: requestPayload.AccountReference
    })

    // ✅ FIX: Use await and proper request handling
    const req = await this.request()
    const response = await req.post('/mpesa/stkpush/v1/processrequest', requestPayload)
    
    console.log('✅ M-Pesa STK Push Response:', response.data)
    
    return response

  } catch (error) {
    console.error('❌ STK Push Initialization Error:', {
      message: error.message,
      payload: payload,
      config: {
        shortCode: this.configs?.lipaNaMpesaShortCode,
        hasPass: !!this.configs?.lipaNaMpesaShortPass
      },
      errorResponse: error.response?.data
    })
    throw error
  }
}

/**
 * Enhanced phone formatting helper with safety checks
 * @param {string|number} phone - The phone number to format
 * @returns {string} Formatted phone number (254XXXXXXXXX)
 */
function formatPhoneNumber(phone) {
  try {
    if (phone === null || phone === undefined) {
      throw new Error('Phone number is null or undefined')
    }

    const phoneString = phone.toString ? phone.toString() : String(phone)
    
    if (!phoneString || phoneString.trim().length === 0) {
      throw new Error('Phone number is empty')
    }

    const cleaned = phoneString.replace(/\D/g, '')
    
    if (!cleaned) {
      throw new Error('Phone number contains no digits')
    }

    if (cleaned.length < 9) {
      throw new Error(`Phone number too short: ${cleaned}`)
    }

    if (cleaned.length > 12) {
      throw new Error(`Phone number too long: ${cleaned}`)
    }

    if (cleaned.startsWith('0')) {
      return '254' + cleaned.substring(1)
    } else if (cleaned.startsWith('7') && cleaned.length === 9) {
      return '254' + cleaned
    } else if (cleaned.startsWith('254') && cleaned.length === 12) {
      return cleaned
    } else if (cleaned.startsWith('+254')) {
      return cleaned.substring(1)
    }
    
    console.warn(`⚠️ Unexpected phone number format: ${cleaned}. Using as-is.`)
    return cleaned
    
  } catch (error) {
    console.error('❌ Phone Number Formatting Error:', {
      originalPhone: phone,
      error: error.message
    })
    throw new Error(`Invalid phone number: ${error.message}`)
  }
}

module.exports = lipaNaMpesaOnline