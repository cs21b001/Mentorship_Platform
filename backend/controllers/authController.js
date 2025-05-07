const User = require('../models/User');
const Profile = require('../models/Profile');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../config/db');

// Register user
exports.register = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { firstName, lastName, email, password, role, skills = [], interests = [], bio = '' } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: { email }
    });
    
    if (existingUser) {
      await t.rollback();
      return res.status(400).json({ msg: 'User already exists' });
    }
    
    // Create new user with transaction
    const userData = {
      firstName,
      lastName,
      email,
      password,
      role
    };

    console.log('Creating user with data:', { ...userData, password: '[HIDDEN]' });
    
    const user = await User.create(userData, { transaction: t });
    console.log('Created user:', { id: user.id, email: user.email });

    // Create profile data
    const profileData = {
      userId: user.id,
      bio: bio || '',
      skills: skills || [],
      interests: interests || []
    };

    console.log('Creating profile with data:', profileData);

    // Create profile for the user
    const profile = await Profile.create(profileData, { transaction: t });
    console.log('Created profile:', profile.toJSON());
    
    // Commit the transaction
    await t.commit();
    console.log('Transaction committed successfully');
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profile: {
          bio: profile.bio,
          skills: profile.skills,
          interests: profile.interests
        }
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Registration error:', error);
    
    // Detailed error response
    const errorResponse = {
      msg: 'Server error',
      error: error.message
    };

    if (error.name === 'SequelizeValidationError') {
      errorResponse.validationErrors = error.errors.map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
    }

    res.status(500).json(errorResponse);
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please provide both email and password' });
    }

    // Check if user exists
    const user = await User.findOne({
      where: { email },
      include: [{ model: Profile }]
    });
    
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    
    // Check password
    try {
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Password comparison error:', error);
      return res.status(500).json({ msg: 'Error verifying credentials' });
    }
    
    // Generate JWT token
    try {
      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '30d' }
      );
      
      res.json({
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          profile: user.Profile ? {
            bio: user.Profile.bio,
            skills: user.Profile.skills,
            interests: user.Profile.interests
          } : null
        }
      });
    } catch (error) {
      console.error('Token generation error:', error);
      return res.status(500).json({ msg: 'Error generating authentication token' });
    }
  } catch (error) {
    console.error('Login error:', error);
    if (error.name === 'SequelizeConnectionError') {
      return res.status(500).json({ msg: 'Database connection error' });
    }
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Profile }]
    });
    
    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      profile: user.Profile ? {
        bio: user.Profile.bio,
        skills: user.Profile.skills,
        interests: user.Profile.interests
      } : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};