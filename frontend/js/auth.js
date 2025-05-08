// Constants
const API_URL = window.config.API_URL;
const TOKEN_KEY = window.config.TOKEN_KEY;
const USER_KEY = window.config.USER_KEY;

// Check if user is authenticated
function isAuthenticated() {
    const token = localStorage.getItem(TOKEN_KEY);
    return !!token;
}

// Set authenticated state
function checkAuthStatus() {
    if (isAuthenticated()) {
        document.body.classList.add('is-authenticated');
        document.body.classList.remove('not-authenticated');
    } else {
        document.body.classList.add('not-authenticated');
        document.body.classList.remove('is-authenticated');
    }
}

// Initialize register form
function initializeRegisterForm() {
    const registerForm = document.getElementById('register-form');
    if (!registerForm) return;

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset error messages
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
        });
        
        // Get form values
        const firstName = document.getElementById('first-name').value.trim();
        const lastName = document.getElementById('last-name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const role = document.getElementById('role').value;
        const skills = document.getElementById('skills')?.value
            .split(',')
            .map(skill => skill.trim())
            .filter(skill => skill) || [];
        const interests = document.getElementById('interests')?.value
            .split(',')
            .map(interest => interest.trim())
            .filter(interest => interest) || [];
        const bio = document.getElementById('bio')?.value.trim() || '';
        
        // Basic validation
        let hasError = false;
        
        if (!firstName) {
            document.getElementById('first-name-error').textContent = 'First name is required';
            hasError = true;
        }
        
        if (!lastName) {
            document.getElementById('last-name-error').textContent = 'Last name is required';
            hasError = true;
        }
        
        if (!email) {
            document.getElementById('email-error').textContent = 'Email is required';
            hasError = true;
        } else if (!validateEmail(email)) {
            document.getElementById('email-error').textContent = 'Please enter a valid email';
            hasError = true;
        }
        
        if (!password) {
            document.getElementById('password-error').textContent = 'Password is required';
            hasError = true;
        } else if (password.length < 6) {
            document.getElementById('password-error').textContent = 'Password must be at least 6 characters';
            hasError = true;
        }
        
        if (password !== confirmPassword) {
            document.getElementById('confirm-password-error').textContent = 'Passwords do not match';
            hasError = true;
        }
        
        if (!role) {
            document.getElementById('role-error').textContent = 'Please select a role';
            hasError = true;
        }
        
        if (hasError) return;
        
        // Show loading state
        const submitButton = registerForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Registering...';
        
        try {
            const userData = {
                firstName,
                lastName,
                email,
                password,
                role,
                skills,
                interests,
                bio
            };
            
            const result = await registerUser(userData);
            if (result.error) {
                document.getElementById('form-error').textContent = result.error;
            }
        } catch (error) {
            document.getElementById('form-error').textContent = 'Registration failed. Please try again.';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Register';
        }
    });
}

// Initialize login form
function initializeLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset error messages
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
        });
        
        // Get form values
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        // Basic validation
        let hasError = false;
        
        if (!email) {
            document.getElementById('email-error').textContent = 'Email is required';
            hasError = true;
        } else if (!validateEmail(email)) {
            document.getElementById('email-error').textContent = 'Please enter a valid email';
            hasError = true;
        }
        
        if (!password) {
            document.getElementById('password-error').textContent = 'Password is required';
            hasError = true;
        }
        
        if (hasError) return;
        
        // Show loading state
        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Logging in...';
        
        try {
            const result = await loginUser(email, password);
            if (result.error) {
                document.getElementById('form-error').textContent = result.error;
            }
        } catch (error) {
            document.getElementById('form-error').textContent = 'Login failed. Please try again.';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Login';
        }
    });
}

// Initialize logout button
function initializeLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logoutUser();
    });
}

// Handle user registration
async function registerUser(userData) {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.msg || 'Registration failed');
        }
        
        // Save auth data
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        
        // Redirect to profile setup
        window.location.href = 'profile.html';
        
    } catch (error) {
        console.error('Registration error:', error);
        return { error: error.message };
    }
}

// Handle user login
async function loginUser(email, password) {
    try {
        const url = `${API_URL}/auth/login`;
        console.log('Attempting login at:', url);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        console.log('Login response status:', response.status);
        
        if (!response.ok) {
            throw new Error(data.msg || data.message || 'Login failed');
        }
        
        if (!data.token) {
            throw new Error('No token received from server');
        }
        
        // Save auth data
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        
        // Verify token was saved
        const savedToken = localStorage.getItem(TOKEN_KEY);
        if (!savedToken) {
            throw new Error('Failed to save token');
        }
        
        // Redirect to profile page
        window.location.href = 'profile.html';
        
    } catch (error) {
        console.error('Login error details:', {
            message: error.message,
            stack: error.stack,
            type: error.name
        });
        return { error: error.message };
    }
}

// Handle user logout
function logoutUser() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = 'index.html';
}

// Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    
    try {
        return JSON.parse(userStr);
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
}

// Get auth token
function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

// Make authenticated API request
window.authenticatedRequest = async function(url, method = 'GET', body = null) {
    try {
        const token = getToken();
        
        if (!token) {
            throw new Error('Authentication required');
        }
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        
        const options = {
            method,
            headers
        };
        
        if (body && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(url, options);
        
        const data = await response.json();
        
        if (!response.ok) {
            const error = new Error(data.message || data.msg || 'Request failed');
            error.response = data;
            error.status = response.status;
            throw error;
        }
        
        return data;
    } catch (error) {
        // Redirect to login if unauthorized
        if (error.status === 401 || 
            error.message === 'Authentication required' || 
            error.message === 'Token is not valid') {
            logoutUser();
        }
        
        throw error;
    }
}

// Email validation helper
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Initialize forms and buttons when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    initializeLoginForm();
    initializeRegisterForm();
    initializeLogoutButton();
});