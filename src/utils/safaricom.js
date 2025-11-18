import dotenv from 'dotenv';
dotenv.config();

const SAFARICOM_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.safaricom.co.ke' 
  : 'https://sandbox.safaricom.co.ke';

export async function generateAccessToken() {
  try {
    // Validate environment variables
    if (!process.env.SAFARICOM_CONSUMER_KEY || !process.env.SAFARICOM_CONSUMER_SECRET) {
      throw new Error('Safaricom credentials are not configured');
    }

    const auth = Buffer.from(
      `${process.env.SAFARICOM_CONSUMER_KEY}:${process.env.SAFARICOM_CONSUMER_SECRET}`
    ).toString('base64');

    const response = await fetch(`${SAFARICOM_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Safaricom API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.access_token) {
      throw new Error('No access token received from Safaricom');
    }

    return data.access_token;
  } catch (error) {
    console.error('Access token generation error:', error);
    throw new Error(`Unable to connect to Safaricom: ${error.message}`);
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
    throw new Error('Safaricom business shortcode or passkey not configured');
  }
  
  const password = Buffer.from(
    process.env.SAFARICOM_BUSINESS_SHORTCODE + 
    process.env.SAFARICOM_PASSKEY + 
    timestamp
  ).toString('base64');
  return password;
}