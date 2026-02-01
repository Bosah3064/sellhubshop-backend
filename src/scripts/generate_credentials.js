const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('--- M-Pesa Security Credential Generator ---');
console.log('This tool encrypts your Initiator Password using the Safaricom Public Certificate.');

// 1. Find Certificate File automatically
const backendDir = path.resolve(__dirname, '../../');
const files = fs.readdirSync(backendDir);
const certFile = files.find(f => f.endsWith('.cer') || f.endsWith('.pem'));

if (!certFile) {
    console.error('\n[ERROR] No certificate file found in backend folder!');
    console.error('Please download the Production Public Certificate from Safaricom Portal');
    console.error('and copy it to: ' + backendDir);
    process.exit(1);
}

console.log(`\nFound Certificate: ${certFile}`);

rl.question('\nEnter your Initiator Password (e.g. Deborah...): ', (password) => {
    if (!password) {
        console.error('Password is required!');
        process.exit(1);
    }

    try {
        const certPath = path.join(backendDir, certFile);
        const certData = fs.readFileSync(certPath, 'utf8');

        // Ensure cert has headers if missing (Node crypto needs PEM format)
        let formattedCert = certData;
        if (!certData.includes('-----BEGIN CERTIFICATE-----')) {
            // Attempt to wrap if it looks like raw base64 or just try using it
            // Many .cer files from Safaricom are already PEM. If binary, we might need more logic.
            // But let's assume it's the standard PEM text they provide.
            console.log('Note: Certificate might need formatting. Attempting to use as-is...');
        }

        const buffer = Buffer.from(password);
        const encrypted = crypto.publicEncrypt({
            key: formattedCert,
            padding: crypto.constants.RSA_PKCS1_PADDING
        }, buffer);

        const authStr = encrypted.toString('base64');

        console.log('\n-------------------------------------------------------------');
        console.log('SUCCESS! Copy the string below into your .env file:');
        console.log('\nMPESA_B2C_SECURITY_CREDENTIAL=' + authStr);
        console.log('-------------------------------------------------------------');

    } catch (error) {
        console.error('\n[ERROR] Encryption failed:', error.message);
        console.error('Make sure the certificate file is a valid PEM/X.509 format.');
    }
    
    rl.close();
});
