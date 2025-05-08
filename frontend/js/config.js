// Configuration
window.config = {
    // API URL will be determined based on environment
    API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000/api'
        : 'https://mentorshipplatform-production.up.railway.app/',
    
    // Other configuration values
    TOKEN_KEY: 'mentorship_token',
    USER_KEY: 'mentorship_user'
}; 