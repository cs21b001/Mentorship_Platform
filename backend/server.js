const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { testConnection } = require('./config/db');

// Load model associations
require('./models/associations');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const connectionRoutes = require('./routes/connectionRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
testConnection();

// Middleware
const allowedOrigins = [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:3000',
    'https://mentorship-platform-frontend-two.vercel.app',
    'https://mentorship-platform-frontend-two-git-main.vercel.app',
    'https://mentorship-platform-frontend-two-*.vercel.app'
];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Check if the origin is allowed
        if (allowedOrigins.some(allowedOrigin => {
            // Handle wildcard domains
            if (allowedOrigin.includes('*')) {
                const pattern = new RegExp(allowedOrigin.replace('*', '.*'));
                return pattern.test(origin);
            }
            return allowedOrigin === origin;
        })) {
            callback(null, true);
        } else {
            console.log('Origin not allowed by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'success',
        message: 'Mentorship Platform API is running',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/connections', connectionRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        status: 'error',
        message: err.message || 'Something went wrong!'
    });
});

// Handle 404 routes
app.use('*', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found'
    });
});

// Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
