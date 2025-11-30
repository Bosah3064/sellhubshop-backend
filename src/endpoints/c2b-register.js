// register-simple.js
require('dotenv').config();
const axios = require('axios');

async function registerC2BUrls() {
  try {
    console.log('🚀 Registering C2B URLs with Safaricom Production...');
    
    // Step 1: Get access token
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
    
    console.log('🔑 Getting access token...');
    const tokenResponse = await axios.get('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    const accessToken = tokenResponse.data.access_token;
    console.log('✅ Access token received');

    // Step 2: Register URLs
    console.log('📝 Registering URLs:');
    console.log('- Confirmation: https://sellhubshop.onrender.com/api/mpesa/confirm');
    console.log('- Validation: https://sellhubshop.onrender.com/api/mpesa/validate');
    console.log('- ShortCode: 3702673');

    const registerData = {
      ShortCode: '3702673',
      ResponseType: 'Completed', 
      ConfirmationURL: 'https://sellhubshop.onrender.com/api/mpesa/confirm',
      ValidationURL: 'https://sellhubshop.onrender.com/api/mpesa/validate'
    };

    console.log('📤 Sending registration request...');
    const registerResponse = await axios.post(
      'https://api.safaricom.co.ke/mpesa/c2b/v1/registerurl',
      registerData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ C2B URLs Registered Successfully!');
    console.log('Response:', JSON.stringify(registerResponse.data, null, 2));
    
    return registerResponse.data;
    
  } catch (error) {
    console.error('❌ Registration Failed:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Safaricom API Response:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    }
    
    throw error;
  }
}

// Execute
registerC2BUrls();