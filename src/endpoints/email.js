const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

router.post('/send-2fa-code', async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ success: false, error: 'Email and code are required' });
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Admin Panel" <admin@example.com>',
            to: email,
            subject: 'Your 2FA Verification Code',
            text: `Your verification code is: ${code}`,
            html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>2FA Verification</h2>
              <p>Your verification code is:</p>
              <h1 style="color: #4F46E5; letter-spacing: 5px;">${code}</h1>
              <p>This code will expire in 10 minutes.</p>
             </div>`,
        });

        console.log('Message sent: %s', info.messageId);
        res.json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
