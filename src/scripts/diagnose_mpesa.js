const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const helpers = require('../helpers');
const security = require('../helpers/security');
const requestHelper = require('../helpers/request');

async function diagnose() {
    console.log('--- M-Pesa Diagnostic Tool ---');

    // 1. Check Environment Variables
    const requiredVars = [
        'MPESA_CONSUMER_KEY',
        'MPESA_CONSUMER_SECRET',
        'MPESA_SHORTCODE',
        'MPESA_PASSKEY', // or MPESA_STK_PASSKEY
        'MPESA_ENV',
        'CALLBACK_URL'
    ];

    const missingVars = requiredVars.filter(key => !process.env[key]);

    if (missingVars.length > 0) {
        console.error('❌ Missing Environment Variables:', missingVars.join(', '));
        process.exit(1);
    } else {
        console.log('✅ All required environment variables are present.');
    }

    // 2. Check Configuration Values
    console.log('Environment:', process.env.MPESA_ENV);
    console.log('Shortcode:', process.env.MPESA_SHORTCODE);
    console.log('Callback URL:', process.env.CALLBACK_URL);

    if (process.env.CALLBACK_URL && process.env.CALLBACK_URL.includes('localhost')) {
        console.warn('⚠️ WARNING: Callback URL contains "localhost". This will fail for M-Pesa callbacks unless using a tunnel.');
    }

    // 3. Test Access Token Generation
    console.log('\nTesting Access Token Generation...');
    try {
        const token = await helpers.getAccessToken(
            process.env.MPESA_CONSUMER_KEY,
            process.env.MPESA_CONSUMER_SECRET,
            process.env.MPESA_ENV
        );

        if (token) {
            console.log('✅ Access Token generated successfully.');
            console.log('Token (truncated):', token.substring(0, 10) + '...');
        } else {
            console.error('❌ Failed to generate Access Token: No token returned.');
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Error generating Access Token:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
        process.exit(1);
    }

    // 4. Test Password Generation (Sanity Check)
    try {
        const timestamp = security.getTimestamp();
        const passKey = process.env.MPESA_STK_PASSKEY || process.env.MPESA_PASSKEY;
        const password = security.generatePassword(process.env.MPESA_SHORTCODE, passKey, timestamp);
        if (password) {
            console.log('✅ Password generated successfully (local check).');
        }
    } catch (error) {
        console.error('❌ Error generating Password:', error.message);
    }

    // 5. Test Live STK Push (if phone provided)
    const phone = process.argv[2];
    const amount = process.argv[3] || 1;

    if (phone) {
        console.log(`\nTesting Live STK Push to ${phone} for KES ${amount}...`);
        try {
            const token = await helpers.getAccessToken(
                process.env.MPESA_CONSUMER_KEY,
                process.env.MPESA_CONSUMER_SECRET,
                process.env.MPESA_ENV
            );

            const timestamp = security.getTimestamp();
            const passKey = process.env.MPESA_STK_PASSKEY || process.env.MPESA_PASSKEY;
            const password = security.generatePassword(process.env.MPESA_SHORTCODE, passKey, timestamp);

            const isTill = !!process.env.MPESA_TILL_NUMBER;
            const transactionType = isTill ? "CustomerBuyGoodsOnline" : "CustomerPayBillOnline";
            const partyB = isTill ? process.env.MPESA_TILL_NUMBER : process.env.MPESA_SHORTCODE;

            const stkData = {
                BusinessShortCode: process.env.MPESA_SHORTCODE,
                Password: password,
                Timestamp: timestamp,
                TransactionType: transactionType,
                Amount: amount,
                PartyA: phone,
                PartyB: partyB,
                PhoneNumber: phone,
                CallBackURL: process.env.CALLBACK_URL,
                AccountReference: "Diagnostic",
                TransactionDesc: "Test Payment"
            };

            const url = process.env.MPESA_ENV === 'sandbox'
                ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
                : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

            console.log('Sending Request to Safaricom...');
            const response = await requestHelper.postRequest(url, stkData, token);
            console.log('\n✅ Safaricom Response:', JSON.stringify(response.data, null, 2));
            console.log('\nCheck your phone for the STK prompt!');

        } catch (error) {
            console.error('\n❌ STK Push Failed:');
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', JSON.stringify(error.response.data, null, 2));
            } else {
                console.error(error.message);
            }
        }
    } else {
        console.log('\nℹ️ To run a live STK push test, provide a phone number:');
        console.log('   node src/scripts/diagnose_mpesa.js <2547XXXXXXXX>');
    }

    console.log('\n--- Diagnostic Complete ---');
}

diagnose();
