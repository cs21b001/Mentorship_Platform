const Profile = require('../models/Profile');
const User = require('../models/User');
const Connection = require('../models/Connection');

// Create or update profile
exports.createUpdateProfile = async (req, res) => {
  try {
    const { role, firstName, lastName, bio, skills, interests } = req.body;
    
    // Validate required fields
    if (!role || !firstName || !lastName) {
      return res.status(400).json({ msg: 'Role, first name, and last name are required' });
    }
    
    // Check if profile exists
    let profile = await Profile.findOne({ user: req.user._id });
    
    if (profile) {
      // Update existing profile
      profile = await Profile.findOneAndUpdate(
        { user: req.user._id },
        { role, firstName, lastName, bio, skills, interests },
        { new: true }
      );
    } else {
      // Create new profile
      profile = new Profile({
        user: req.user._id,
        role,
        firstName,
        lastName,
        bio,
        skills,
        interests
      });
      
      await profile.save();
    }
    
    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get current user's profile
exports.getCurrentProfile = async (req, res) => {
  try {
    console.log('Getting profile for user:', req.user._id);
    
    // Get user data
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Get profile data
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    // Get pending connection requests
    const pendingRequests = await Connection.find({
      $or: [
        { mentor: req.user._id, status: 'pending' },
        { mentee: req.user._id, status: 'pending' }
      ]
    })
    .populate('mentor', ['email'])
    .populate('mentee', ['email'])
    .populate('initiator', ['email', '_id']);

    // Get active connections
    const activeConnections = await Connection.find({
      $or: [
        { mentor: req.user._id, status: 'accepted' },
        { mentee: req.user._id, status: 'accepted' }
      ]
    })
    .populate('mentor', ['email'])
    .populate('mentee', ['email'])
    .populate('initiator', ['email', '_id']);
    
    // Combine user and profile data
    const profileData = {
      ...profile.toObject(),
      email: user.email,
      pendingRequests,
      activeConnections
    };
    
    console.log('Sending profile data:', profileData);
    res.json(profileData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get profile by user ID
exports.getProfileById = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log('Getting profile for user ID:', userId);
    
    // Get user data
    const user = await User.findById(userId).select('-password');
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Get profile data
    const profile = await Profile.findOne({ user: userId });
    if (!profile) {
      console.log('Profile not found for user:', userId);
      return res.status(404).json({ msg: 'Profile not found' });
    }
    
    // Combine user and profile data
    const profileData = {
      ...profile.toObject(),
      email: user.email
    };
    
    console.log('Sending profile data:', profileData);
    res.json(profileData);
  } catch (error) {
    console.error('Error in getProfileById:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get all profiles with filters
exports.getAllProfiles = async (req, res) => {
  try {
    let query = {};
    
    // Apply filters if provided
    if (req.query.role) {
      query.role = req.query.role;
    }
    
    if (req.query.skills) {
      query.skills = { $in: req.query.skills.split(',') };
    }
    
    if (req.query.interests) {
      query.interests = { $in: req.query.interests.split(',') };
    }
    
    const profiles = await Profile.find(query).populate('user', ['email']);
    
    res.json(profiles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Delete profile and user
exports.deleteProfile = async (req, res) => {
  try {
    // Remove profile
    await Profile.findOneAndRemove({ user: req.user._id });
    
    // Remove user
    await User.findOneAndRemove({ _id: req.user._id });
    
    res.json({ msg: 'User and profile deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};
