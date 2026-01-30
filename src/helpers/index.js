const axios = require('axios');

module.exports = {
    getAccessToken: async (consumerKey, consumerSecret, env) => {
        // Trim keys to avoid whitespace issues
        const cleanKey = (consumerKey || '').trim();
        const cleanSecret = (consumerSecret || '').trim();

        const auth = Buffer.from(`${cleanKey}:${cleanSecret}`).toString('base64');
        const url = env === 'sandbox'
            ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
            : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

        const response = await axios.get(url, { headers: { Authorization: `Basic ${auth}` } });
        return response.data.access_token;
    }
};
