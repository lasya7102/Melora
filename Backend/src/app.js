const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes.js');
const musicRoutes = require('./routes/music.routes.js');

const app = express();

// CORS - allow React frontend
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// To use req.body data
app.use(express.json());

// To send data to cookies and read data from cookies
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/music', musicRoutes);

module.exports = app;