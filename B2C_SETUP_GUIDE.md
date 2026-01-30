# M-Pesa B2C Withdrawal Setup Guide

## Overview

This guide explains how to configure M-Pesa B2C (Business to Customer) payments
for wallet withdrawals.

## Prerequisites

- Active Safaricom Daraja API account
- Production M-Pesa Paybill/Till number
- Access to Daraja Portal

## Step 1: Get B2C Credentials from Safaricom

### 1.1 Login to Daraja Portal

Visit: https://developer.safaricom.co.ke/

### 1.2 Navigate to B2C API

- Go to "My Apps"
- Select your production app
- Navigate to "B2C API"

### 1.3 Get Initiator Name

The Initiator Name is your API operator username. Contact Safaricom support to
get this.

Example: `testapi` (sandbox) or your actual username (production)

### 1.4 Generate Security Credential

The Security Credential is your API password encrypted with Safaricom's public
certificate.

**Steps**:

1. Download Safaricom's public certificate:
   - Sandbox: https://developer.safaricom.co.ke/test_credentials
   - Production: Contact Safaricom support

2. Encrypt your initiator password:
   ```bash
   # Using OpenSSL
   echo -n 'YOUR_INITIATOR_PASSWORD' | openssl pkeyutl -encrypt -pubin -inkey ProductionCertificate.cer -out encrypted.bin
   base64 encrypted.bin
   ```

3. The base64 output is your `MPESA_B2C_SECURITY_CREDENTIAL`

## Step 2: Update Environment Variables

Add to `backend/.env`:

```env
# M-Pesa B2C (Withdrawals)
MPESA_B2C_INITIATOR_NAME=your_initiator_username
MPESA_B2C_SECURITY_CREDENTIAL=your_encrypted_credential_here
```

## Step 3: Register Callback URLs

Register these URLs in Daraja Portal:

- **Result URL**:
  `https://sellhubshop-backend.onrender.com/api/v1/callback/b2c/result`
- **Timeout URL**:
  `https://sellhubshop-backend.onrender.com/api/v1/callback/b2c/timeout`

## Step 4: Test in Sandbox (Optional)

Before going live, test with sandbox credentials:

```env
MPESA_ENV=sandbox
MPESA_B2C_INITIATOR_NAME=testapi
MPESA_B2C_SECURITY_CREDENTIAL=<sandbox_encrypted_credential>
```

Test phone numbers (sandbox):

- `254708374149`
- `254711111111`

## Step 5: Deploy Migration

Run the wallet auto-creation migration:

```bash
# In your Supabase dashboard, run:
supabase/migrations/20260130010124_auto_create_wallets.sql
```

Or use Supabase CLI:

```bash
supabase db push
```

## Security Notes

⚠️ **IMPORTANT**:

- Never commit real credentials to Git
- Keep `.env` file in `.gitignore`
- Rotate credentials periodically
- Use production credentials only in production environment

## Troubleshooting

### Error: "B2C not configured"

- Check that `MPESA_B2C_INITIATOR_NAME` and `MPESA_B2C_SECURITY_CREDENTIAL` are
  set
- Verify credentials are not placeholder values

### Error: "Invalid Security Credential"

- Ensure you encrypted with the correct certificate
- Verify base64 encoding is correct
- Contact Safaricom if issues persist

### Withdrawal not received

- Check backend logs for B2C response
- Verify callback URLs are publicly accessible
- Check transaction status in Daraja Portal

## Testing Checklist

- [ ] B2C credentials configured in `.env`
- [ ] Callback URLs registered in Daraja
- [ ] Migration run successfully
- [ ] Test withdrawal in sandbox
- [ ] Verify callback receives confirmation
- [ ] Check wallet balance updates correctly
- [ ] Test failure scenario (insufficient balance)
- [ ] Test refund on failed withdrawal

## Support

For issues with:

- **Daraja API**: Contact Safaricom support
- **Wallet System**: Check backend logs
- **Database**: Verify Supabase connection

## API Endpoints

### Initiate Withdrawal

```
POST /api/mpesa/b2c
Content-Type: application/json

{
  "amount": 100,
  "phone": "254712345678",
  "userId": "user-uuid-here"
}
```

### Response

```json
{
    "success": true,
    "message": "Withdrawal initiated successfully",
    "transactionId": "transaction-uuid",
    "conversationId": "AG_20240130_...",
    "amount": 100,
    "phone": "254712345678"
}
```
