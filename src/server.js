require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // <-- import cors
const mPesaRoutes = require('./m-pesa');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors({
  origin: ['http://localhost:8080', 'https://sellhubshop.co.ke'], // frontend domains you want to allow
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(bodyParser.json());
app.use('/api', mPesaRoutes);

app.get('/', (req, res) => res.send('M-Pesa API Server is running'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
