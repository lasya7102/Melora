const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes.js');
const musicRoutes = require('./routes/music.routes.js');

const app = express();
const allowedOrigins = [
    "http://localhost:5173",
    "https://YOUR-VERCEL-DOMAIN.vercel.app"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));
// CORS - allow React frontend

// To use req.body data
app.use(express.json());

// To send data to cookies and read data from cookies
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/music', musicRoutes);

module.exports = app;