require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser'); // Optional, depending on your needs

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const app = express();
const port = process.env.PORT;

// CORS middleware (adjust origins as needed)
app.use(cors({ origin: 'http://localhost:3001' }));// Replace with frontend origin

app.use(bodyParser.json());

// MVC Structure (example)
const userRoutes = require('./routes/userRoutes');

app.use('/users', userRoutes);

// Error handling middleware (optional)
// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(500).send('Something went wrong!');
// });

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

