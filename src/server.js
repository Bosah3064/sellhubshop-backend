require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mPesaRoutes = require('./m-pesa');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use('/endpoints', mPesaRoutes);

app.get('/', (req, res) => res.send('M-Pesa API Server is running'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
