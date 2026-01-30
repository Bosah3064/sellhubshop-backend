const moment = require('moment');

module.exports = {
    generatePassword: (shortcode, passkey, timestamp) => Buffer.from(shortcode + passkey + timestamp).toString('base64'),
    getTimestamp: () => {
        // Enforce Nairobi time (UTC+3) format YYYYMMDDHHmmss
        const timestamp = moment().utcOffset(3).format('YYYYMMDDHHmmss');
        console.log('[Security] Generated Timestamp:', timestamp);
        return timestamp;
    }
};
