require('dotenv').config({ path: '../../.env' });
const helpers = require('../helpers');
const requestHelper = require('../helpers/request');

const {
    MPESA_ENV,
    MPESA_SHORTCODE,
    C2B_CONFIRMATION_URL,
    C2B_VALIDATION_URL,
    MPESA_CONSUMER_KEY,
    MPESA_CONSUMER_SECRET
} = process.env;

async function registerC2B() {
    try {
        console.log('--- M-Pesa C2B Registration Tool ---');
        console.log(`Env: ${MPESA_ENV}`);
        console.log(`Shortcode: ${MPESA_SHORTCODE}`);
        console.log(`Confirmation URL: ${C2B_CONFIRMATION_URL}`);
        console.log(`Validation URL: ${C2B_VALIDATION_URL}`);

        if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET) {
            throw new Error('Missing Consumer Key or Secret in .env');
        }

        console.log('\n[1/2] Fetching access token...');
        const token = await helpers.getAccessToken(MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_ENV);
        console.log('Token received. Starts with:', token.substring(0, 10) + '...');

        const registrationData = {
            ShortCode: MPESA_SHORTCODE.toString().trim(),
            ResponseType: "Completed",
            ConfirmationURL: C2B_CONFIRMATION_URL.trim(),
            ValidationURL: C2B_VALIDATION_URL.trim()
        };

        const url = MPESA_ENV === 'sandbox'
            ? 'https://sandbox.safaricom.co.ke/mpesa/c2b/v2/registerurl'
            : 'https://api.safaricom.co.ke/mpesa/c2b/v2/registerurl';

        console.log(`\n[2/2] Registering URLs at ${url}...`);
        console.log('Using Headers:', { Authorization: `Bearer ${token.substring(0, 5)}...` });

        const response = await requestHelper.postRequest(url, registrationData, token);

        console.log('\n--- SUCCESS ---');
        console.log(JSON.stringify(response.data, null, 2));
        console.log('\nYour C2B URLs are now registered with Safaricom.');
        console.log('Ensure your backend is running to receive callbacks at these URLs.');

    } catch (err) {
        console.error('\n--- ERROR ---');
        if (err.response) {
            console.error(JSON.stringify(err.response.data, null, 2));
        } else {
            console.error(err.message);
        }
        process.exit(1);
    }
}

registerC2B();
