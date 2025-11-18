import dotenv from 'dotenv';
dotenv.config();

const SAFARICOM_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.safaricom.co.ke' 
  : 'https://sandbox.safaricom.co.ke';

let cachedToken = null;
let tokenExpiry = null;

export async function generateAccessToken() {
  try {
    // Use cached token if still valid (5 minutes buffer)
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry - 300000) {
      console.log('🔁 Using cached access token');
      return cachedToken;
    }

    console.log('🔄 Generating new M-Pesa access token...');
    
    // Validate production credentials
    if (!process.env.SAFARICOM_CONSUMER_KEY || !process.env.SAFARICOM_CONSUMER_SECRET) {
      throw new Error('M-Pesa production credentials are not configured');
    }

    const auth = Buffer.from(
      `${process.env.SAFARICOM_CONSUMER_KEY}:${process.env.SAFARICOM_CONSUMER_SECRET}`
    ).toString('base64');

    const response = await fetch(`${SAFARICOM_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000 // 10 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ M-Pesa API authentication failed:', response.status);
      throw new Error(`M-Pesa authentication failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.access_token) {
      throw new Error('No access token received from M-Pesa');
    }

    // Cache the token
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000);
    
    console.log('✅ M-Pesa access token generated successfully');
    return data.access_token;
    
  } catch (error) {
    console.error('💥 M-Pesa access token generation failed:', error.message);
    throw new Error(`M-Pesa service unavailable: ${error.message}`);
  }
}

export function generateTimestamp() {
  const date = new Date();
  return (
    date.getFullYear() +
    ('0' + (date.getMonth() + 1)).slice(-2) +
    ('0' + date.getDate()).slice(-2) +
    ('0' + date.getHours()).slice(-2) +
    ('0' + date.getMinutes()).slice(-2) +
    ('0' + date.getSeconds()).slice(-2)
  );
}

export function generatePassword() {
  const timestamp = generateTimestamp();
  
  if (!process.env.SAFARICOM_BUSINESS_SHORTCODE || !process.env.SAFARICOM_PASSKEY) {
    throw new Error('M-Pesa business credentials not configured');
  }
  
  const password = Buffer.from(
    process.env.SAFARICOM_BUSINESS_SHORTCODE + 
    process.env.SAFARICOM_PASSKEY + 
    timestamp
  ).toString('base64');
  
  console.log('🔐 M-Pesa password generated for timestamp:', timestamp);
  return password;
}