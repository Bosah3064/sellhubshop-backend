require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // <-- import cors
const mPesaRoutes = require('./m-pesa');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors({
  origin: true, // Allow all origins for easier development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(bodyParser.json());
app.use('/api', mPesaRoutes);

// Referrals endpoint
const referralsRoutes = require('./endpoints/referrals');
app.use('/api/referrals', referralsRoutes);

// Email endpoint
const emailRoutes = require('./endpoints/email');
app.use('/api/email', emailRoutes);

// Share endpoint (Social Media Logic)
const shareRoutes = require('./endpoints/share');
app.use('/api/share', shareRoutes);

// Notifications endpoint
const notificationsRoutes = require('./endpoints/notifications');
app.use('/api/notifications', notificationsRoutes);

// Admin Management endpoint
const adminRoutes = require('./endpoints/admin');
app.use('/api/admin', adminRoutes);


app.get('/', (req, res) => res.send('M-Pesa API Server is running'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
