const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const vapidKeys = webpush.generateVAPIDKeys();

const output = {
    publicKey: vapidKeys.publicKey,
    privateKey: vapidKeys.privateKey
};

fs.writeFileSync(path.join(__dirname, 'vapid_keys.json'), JSON.stringify(output, null, 2));

console.log('Keys saved to vapid_keys.json');
