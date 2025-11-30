const moment = require('moment')

/**
 * Lipa Na M-Pesa Query Request API
 * @name LipaNaMpesaQuery
 * @description Use this API to check the status of a Lipa Na M-Pesa Online Payment.
 * @param  {string} checkoutRequestId Checkout RequestID
 * @param  {number} [shortCode=null]  Business Short Code
 * @param  {number} [timeStamp=null]  timeStamp
 * @param  {string} [passKey=null]    lipaNaMpesa Pass Key
 * @return {Promise}
 */
module.exports = async function (checkoutRequestId, shortCode = null, passKey = null) {
  try {
    // ✅ Enhanced validation
    if (!checkoutRequestId) {
      throw new Error('checkoutRequestId is required')
    }

    if (!this.configs?.lipaNaMpesaShortCode || !this.configs?.lipaNaMpesaShortPass) {
      throw new Error('M-Pesa configuration is missing')
    }

    const _shortCode = shortCode || this.configs.lipaNaMpesaShortCode
    const _passKey = passKey || this.configs.lipaNaMpesaShortPass
    const timeStamp = moment().format('YYYYMMDDHHmmss')
    const password = Buffer.from(`${_shortCode}${_passKey}${timeStamp}`).toString('base64')

    console.log('🔍 STK Query Request:', {
      BusinessShortCode: _shortCode,
      CheckoutRequestID: checkoutRequestId,
      Timestamp: timeStamp
    })

    const req = await this.request()
    const response = await req.post('/mpesa/stkpushquery/v1/query', {
      'BusinessShortCode': _shortCode,
      'Password': password,
      'Timestamp': timeStamp,
      'CheckoutRequestID': checkoutRequestId
    })

    console.log('📊 STK Query Response:', response.data)
    return response

  } catch (error) {
    console.error('❌ STK Query Error:', {
      message: error.message,
      checkoutRequestId: checkoutRequestId,
      error: error.response?.data || error.message
    })
    throw error
  }
}