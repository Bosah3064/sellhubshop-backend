const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// USAGE: node generate_security_credential.js <path-to-cert.cer> <initiator-password>

const certPath = process.argv[2];
const password = process.argv[3];

if (!certPath || !password) {
    console.error('Usage: node generate_security_credential.js <path-to-cert.cer> <initiator-password>');
    process.exit(1);
}

try {
    const certBuffer = fs.readFileSync(certPath);
    // Safaricom Application Certificate (Public Key)
    // We encrypt the password using this public key
    
    const encrypted = crypto.publicEncrypt({
        key: certBuffer,
        padding: crypto.constants.RSA_PKCS1_PADDING
    }, Buffer.from(password));

    const securityCredential = encrypted.toString('base64');
    
    console.log('\n--- SUCCESS ---');
    console.log('MPESA_B2C_SECURITY_CREDENTIAL=');
    console.log(securityCredential);
    console.log('---------------\n');
    console.log('Copy the string above and paste it into your .env file.');

} catch (error) {
    console.error('Error generating credential:', error.message);
}
