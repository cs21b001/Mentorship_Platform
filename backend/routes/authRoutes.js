const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Register user
// POST /api/auth/register
router.post('/register', authController.register);

// Login user
// POST /api/auth/login
router.post('/login', authController.login);

// Get current user
// GET /api/auth/me
router.get('/me', auth, authController.getCurrentUser);

module.exports = router;