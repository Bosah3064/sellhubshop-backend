module.exports = {
    generatePassword: (shortcode, passkey, timestamp) => Buffer.from(shortcode + passkey + timestamp).toString('base64'),
    getTimestamp: () => {
        const now = new Date();
        return now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
    }
};
