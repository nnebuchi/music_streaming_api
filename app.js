require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser'); // Optional, depending on your needs

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const app = express();
const port = process.env.PORT;

// CORS middleware
app.use(cors({ origin: 'http://localhost:3001' }));// Replace with frontend origin

app.use(bodyParser.json());

//Serve static files from the 'public' directory
app.use(express.static('public'));

// MVC Structure routing
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const genericRoutes = require('./routes/genericRoutes');
const songRouters = require('./routes/songRoutes');


app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/app', genericRoutes);
app.use('/song', songRouters);

// Error handling middleware (optional)
// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(500).send('Something went wrong!');
// });

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

