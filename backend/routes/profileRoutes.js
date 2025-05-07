const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const auth = require('../middleware/auth');

// Create or update profile
// POST /api/profile
router.post('/', auth, profileController.createUpdateProfile);

// Get current user's profile
// GET /api/profile/me
router.get('/me', auth, profileController.getCurrentProfile);

// Get profile by user ID
// GET /api/profile/user/:userId
router.get('/user/:userId', auth, profileController.getProfileById);

// Get all profiles with filters
// GET /api/profile
router.get('/', auth, profileController.getAllProfiles);

// Delete profile and user
// DELETE /api/profile
router.delete('/', auth, profileController.deleteProfile);

module.exports = router;
