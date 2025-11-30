const {
  accountBalance,
  b2b,
  b2c,
  c2bRegister,
  c2bSimulate,
  lipaNaMpesaOnline,
  lipaNaMpesaQuery,
  oAuth,
  reversal,
  transactionStatus
} = require('./endpoints')
const {
  request,
  security
} = require('./helpers')

/**
 * Class representing the Mpesa instance
 */
class Mpesa {
  /**
   * Introduce Mpesa Configuration
   * @constructor
   * @param {Object} [config={}] The Configuration to use for mPesa
   */
  constructor (config = {}) {
    // Check both config object AND environment variables
    const consumerKey = config.consumerKey || process.env.MPESA_CONSUMER_KEY
    const consumerSecret = config.consumerSecret || process.env.MPESA_CONSUMER_SECRET
    
    if (!consumerKey) throw new Error('Consumer Key is Missing')
    if (!consumerSecret) throw new Error('Consumer Secret is Missing')
    
    // ✅ CORRECT: Use TILL NUMBER for STK Push, SHORTCODE for C2B
    this.configs = {
      consumerKey,
      consumerSecret,
      // ✅ For STK Push (Lipa Na M-Pesa) - Use Till Number (3188230)
      lipaNaMpesaShortCode: config.lipaNaMpesaShortCode || process.env.MPESA_TILL_NUMBER || 3188230,
      lipaNaMpesaShortPass: config.lipaNaMpesaShortPass || process.env.MPESA_STK_PASSKEY || process.env.MPESA_PASSKEY,
      // For C2B - Use ShortCode (3702673)
      c2bShortCode: config.c2bShortCode || process.env.MPESA_SHORTCODE || 3702673,
      securityCredential: config.securityCredential || process.env.MPESA_SECURITY_CREDENTIAL,
      initiatorName: config.initiatorName || process.env.MPESA_INITIATOR_NAME,
      ...config
    }
    
    this.enviroment = this.configs.environment === 'production' ? 'production' : 'sandbox'
    this.request = request.bind(this)
    this.security = () => {
      return security(this.configs.certPath, this.configs.securityCredential)
    }
    this.baseURL = `https://${this.enviroment === 'production' ? 'api' : 'sandbox'}.safaricom.co.ke`
    
    console.log('🎯 M-Pesa Configuration:', {
      environment: this.enviroment,
      stkShortCode: this.configs.lipaNaMpesaShortCode,
      c2bShortCode: this.configs.c2bShortCode,
      baseURL: this.baseURL
    })
  }

  /**
   * AccountBalance via instance
   */
  accountBalance () {
    return accountBalance.bind(this)(...arguments)
  }

  /**
   * B2B Request via instance
   */
  b2b () {
    return b2b.bind(this)(...arguments)
  }

  /**
   * B2C Request
   */
  b2c () {
    return b2c.bind(this)(...arguments)
  }
  
  c2bRegister () {
    return c2bRegister.bind(this)(...arguments)
  }
  
  c2bSimulate () {
    if(this.enviroment === 'production'){
      throw new Error('Cannot call C2B simulate in production.')
    }
    return c2bSimulate.bind(this)(...arguments)
  }

  lipaNaMpesaOnline () {
    return lipaNaMpesaOnline.bind(this)(...arguments)
  }

  lipaNaMpesaQuery () {
    return lipaNaMpesaQuery.bind(this)(...arguments)
  }

  oAuth () {
    const { consumerKey, consumerSecret } = this.configs
    return oAuth.bind(this)(consumerKey, consumerSecret)
  }

  reversal () {
    return reversal.bind(this)(...arguments)
  }
          
  transactionStatus () {
    return transactionStatus.bind(this)(...arguments)
  }
}

module.exports = Mpesa