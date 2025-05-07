// Configuration
const config = {
    // API URL will be determined based on environment
    API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000/api'
        : 'https://your-production-api.com/api', // Replace with your production API URL
    
    // Other configuration values
    TOKEN_KEY: 'mentorship_token',
    USER_KEY: 'mentorship_user'
};

// Make config available globally
window.config = config; 