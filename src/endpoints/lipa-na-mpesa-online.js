const moment = require('moment')

/**
 * Lipa Na Mpesa Online Payment
 * @name lipaNaMpesaOnline
 * @function
 * @description Use this API to initiate online payment on behalf of a customer.
 * @param {Object} payload - The data required for Lipa Na Mpesa Online Payment
 * @see {@link https://developer.safaricom.co.ke/docs#lipa-na-m-pesa-online-request | Lipa Na Mpesa Online Request}
 */
const lipaNaMpesaOnline = function (payload = {}) {
  const {
    BusinessShortCode = this.configs.lipaNaMpesaShortCode, // ✅ Now uses Till Number (3188230)
    TransactionType = 'CustomerBuyGoodsOnline', // ✅ Changed from CustomerPayBillOnline
    Amount,
    PartyA,
    PartyB = this.configs.lipaNaMpesaShortCode, // ✅ Now uses Till Number (3188230)
    PhoneNumber,
    CallBackURL,
    AccountReference,
    TransactionDesc
  } = payload

  // Validate required fields
  const missing = []
  if (!Amount) missing.push('Amount')
  if (!PartyA) missing.push('PartyA')
  if (!PhoneNumber) missing.push('PhoneNumber')
  if (!CallBackURL) missing.push('CallBackURL')

  if (missing.length) {
    throw new Error(`The following LipaNaMpesaOnline parameters are missing: ${missing.join(', ')}`)
  }

  // ✅ Generate password with TILL NUMBER
  const timestamp = moment().format('YYYYMMDDHHmmss')
  const password = Buffer.from(
    `${BusinessShortCode}${this.configs.lipaNaMpesaShortPass}${timestamp}`
  ).toString('base64')

  const requestPayload = {
    BusinessShortCode: parseInt(BusinessShortCode),
    Password: password,
    Timestamp: timestamp,
    TransactionType, // ✅ Now 'CustomerBuyGoodsOnline'
    Amount: parseInt(Amount),
    PartyA: formatPhoneNumber(PartyA),
    PartyB: parseInt(PartyB), // ✅ Now Till Number
    PhoneNumber: formatPhoneNumber(PhoneNumber),
    CallBackURL,
    AccountReference: AccountReference || 'Payment',
    TransactionDesc: TransactionDesc || 'Payment'
  }

  console.log('🎯 CORRECT STK Push Payload:', {
    BusinessShortCode: requestPayload.BusinessShortCode,
    TransactionType: requestPayload.TransactionType,
    PartyB: requestPayload.PartyB,
    Amount: requestPayload.Amount,
    PhoneNumber: requestPayload.PhoneNumber,
    AccountReference: requestPayload.AccountReference
  })

  return this.request({
    url: '/mpesa/stkpush/v1/processrequest',
    method: 'POST',
    body: requestPayload
  })
}

// Add phone formatting helper
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
  
  return cleaned // Return as-is if we can't format
}

module.exports = lipaNaMpesaOnline