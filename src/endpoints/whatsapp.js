const express = require('express');
const router = express.Router();

// Mock WhatsApp Sending Endpoint
router.post('/send', async (req, res) => {
    try {
        const { phone, message, orderId } = req.body;

        if (!phone || !message) {
            return res.status(400).json({ success: false, error: "Phone and message are required" });
        }

        // Simulating 3rd Party API Call Time
        // In a real app, this is where you'd call Twilio, Infobip, or a WhatsApp Gateway
        // e.g. await twilioClient.messages.create({ ... })
        
        console.log(`\n--- [SYSTEM] PRIVATE WHATSAPP SIMULATION ---`);
        console.log(`To: ${phone}`);
        console.log(`Order ID: ${orderId}`);
        console.log(`Message Preview: ${message.slice(0, 50)}...`);
        console.log(`--------------------------------------------\n`);

        setTimeout(() => {
             // Simulate network delay
        }, 500);

        return res.json({ 
            success: true, 
            status: "queued", 
            message: "Message dispatched to WhatsApp Gateway" 
        });

    } catch (error) {
        console.error("WhatsApp Error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
