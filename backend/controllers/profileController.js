const Profile = require('../models/Profile');
const User = require('../models/User');
const Connection = require('../models/Connection');
const { Op, Sequelize } = require('sequelize');
const db = require('../config/db');
const { sanitizeHtml } = require('../utils/sanitizer');

// Create or update profile
exports.createOrUpdateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Sanitize input data
    const sanitizedData = {
      bio: sanitizeHtml(req.body.bio),
      skills: req.body.skills?.map(skill => sanitizeHtml(skill)),
      interests: req.body.interests?.map(interest => sanitizeHtml(interest))
    };

    // Check for existing profile
    let profile = await Profile.findOne({ where: { userId } });

    if (profile) {
      // Update existing profile
      profile = await profile.update(sanitizedData);
    } else {
      // Create new profile
      profile = await Profile.create({
        ...sanitizedData,
        userId
      });
    }

    // Get updated profile with user data
    const updatedProfile = await Profile.findOne({
      where: { userId },
      include: [{
        model: User,
        attributes: ['firstName', 'lastName', 'email', 'role']
      }]
    });

    res.json({
      status: 'success',
      data: updatedProfile
    });

  } catch (error) {
    console.error('Error in createOrUpdateProfile:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create/update profile'
    });
  }
};

// Get current user's profile
exports.getCurrentProfile = async (req, res) => {
  try {
    console.log('Getting profile for user:', req.user.id);
    
    // Get profile with user data
    const profile = await Profile.findOne({
      where: { userId: req.user.id },
      include: [{
        model: User,
        required: true,
        attributes: ['firstName', 'lastName', 'email', 'role']
      }]
    });

    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    // Get pending connection requests
    const pendingRequests = await Connection.findAll({
      where: {
        [Op.or]: [
          { mentorId: req.user.id, status: 'pending' },
          { menteeId: req.user.id, status: 'pending' }
        ]
      },
      include: [
        { 
          model: User, 
          as: 'mentor', 
          attributes: ['firstName', 'lastName', 'email'],
          required: true
        },
        { 
          model: User, 
          as: 'mentee', 
          attributes: ['firstName', 'lastName', 'email'],
          required: true
        },
        { 
          model: User, 
          as: 'initiator', 
          attributes: ['firstName', 'lastName', 'email'],
          required: true
        }
      ]
    });

    // Get active connections
    const activeConnections = await Connection.findAll({
      where: {
        [Op.or]: [
          { mentorId: req.user.id, status: 'accepted' },
          { menteeId: req.user.id, status: 'accepted' }
        ]
      },
      include: [
        { 
          model: User, 
          as: 'mentor', 
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: true
        },
        { 
          model: User, 
          as: 'mentee', 
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: true
        },
        { 
          model: User, 
          as: 'initiator', 
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: true
        }
      ]
    });
    
    // Add debug logging
    console.log('Raw profile data:', JSON.stringify(profile, null, 2));
    
    const profileData = {
      ...profile.toJSON(),
      pendingRequests,
      activeConnections
    };
    
    console.log('Sending profile data:', JSON.stringify(profileData, null, 2));
    res.json(profileData);
  } catch (error) {
    console.error('Error in getCurrentProfile:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// Get profile by user ID
exports.getProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await Profile.findOne({
      where: { userId },
      include: [{
        model: User,
        attributes: ['firstName', 'lastName', 'email', 'role']
      }]
    });

    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: 'Profile not found'
      });
    }

    res.json({
      status: 'success',
      data: profile
    });

  } catch (error) {
    console.error('Error in getProfileByUserId:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch profile'
    });
  }
};

// Get all profiles with filters
exports.getAllProfiles = async (req, res) => {
  try {
    const { role, skills, interests } = req.query;
    const userId = req.user.id;

    // Base query
    const whereClause = {
      userId: { [Op.ne]: userId } // Exclude current user
    };

    // Add role filter if provided
    if (role) {
      whereClause['$User.role$'] = role;
    }

    // Build query
    const query = {
      where: whereClause,
      include: [{
        model: User,
        attributes: ['firstName', 'lastName', 'email', 'role']
      }]
    };

    // Get all profiles
    const profiles = await Profile.findAll(query);

    // Filter by skills and interests in memory (since they're JSON fields)
    let filteredProfiles = profiles;

    if (skills) {
      const skillsArray = skills.toLowerCase().split(',').map(s => s.trim());
      filteredProfiles = filteredProfiles.filter(profile => {
        const profileSkills = profile.skills?.map(s => s.toLowerCase()) || [];
        return skillsArray.some(skill => profileSkills.includes(skill));
      });
    }

    if (interests) {
      const interestsArray = interests.toLowerCase().split(',').map(i => i.trim());
      filteredProfiles = filteredProfiles.filter(profile => {
        const profileInterests = profile.interests?.map(i => i.toLowerCase()) || [];
        return interestsArray.some(interest => profileInterests.includes(interest));
      });
    }

    res.json({
      status: 'success',
      data: filteredProfiles
    });

  } catch (error) {
    console.error('Error in getAllProfiles:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch profiles'
    });
  }
};

// Delete profile and user
exports.deleteProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // This will automatically delete the profile due to CASCADE
    await user.destroy();
    
    res.json({ msg: 'User and profile deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};
