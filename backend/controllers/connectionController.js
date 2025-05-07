const Connection = require('../models/Connection');
const Profile = require('../models/Profile');

// Send connection request
exports.sendConnectionRequest = async (req, res) => {
    try {
        console.log('Received connection request:', req.body);
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ msg: 'User ID is required' });
        }

        // Get the current user's profile to determine their role
        const currentProfile = await Profile.findOne({ user: req.user._id });
        if (!currentProfile) {
            return res.status(404).json({ msg: 'Your profile not found' });
        }

        // Get the target user's profile
        const targetProfile = await Profile.findOne({ user: userId });
        if (!targetProfile) {
            console.log('Target profile not found for user:', userId);
            return res.status(404).json({ msg: 'Target user profile not found' });
        }

        // Determine mentor and mentee based on roles
        let mentor, mentee;
        if (currentProfile.role === 'mentor' && targetProfile.role === 'mentee') {
            mentor = req.user._id;
            mentee = userId;
        } else if (currentProfile.role === 'mentee' && targetProfile.role === 'mentor') {
            mentor = userId;
            mentee = req.user._id;
        } else {
            return res.status(400).json({ 
                msg: 'Invalid connection request. Users must have different roles.' 
            });
        }

        // Check if connection already exists
        const existingConnection = await Connection.findOne({
            mentor,
            mentee
        });

        if (existingConnection) {
            return res.status(400).json({ 
                msg: 'Connection request already exists' 
            });
        }

        // Create new connection request
        const connection = new Connection({
            mentor,
            mentee,
            initiator: req.user._id
        });

        await connection.save();
        console.log('Connection request created:', connection);
        res.json(connection);
    } catch (error) {
        console.error('Error in sendConnectionRequest:', error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get user's connections
exports.getUserConnections = async (req, res) => {
    try {
        const connections = await Connection.find({
            $or: [
                { mentor: req.user._id },
                { mentee: req.user._id }
            ]
        })
        .populate('mentor', ['email'])
        .populate('mentee', ['email'])
        .populate('initiator', ['email']);

        res.json(connections);
    } catch (error) {
        console.error('Error in getUserConnections:', error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Respond to connection request
exports.respondToRequest = async (req, res) => {
    try {
        const { connectionId, status } = req.body;
        
        const connection = await Connection.findById(connectionId);
        if (!connection) {
            return res.status(404).json({ msg: 'Connection request not found' });
        }

        // Verify the user is the recipient of the request (not the initiator)
        if (connection.initiator.toString() === req.user._id.toString()) {
            return res.status(403).json({ msg: 'Cannot respond to your own request' });
        }

        // Verify the user is either the mentor or mentee
        if (connection.mentor.toString() !== req.user._id.toString() && 
            connection.mentee.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: 'Not authorized to respond to this request' });
        }

        connection.status = status;
        await connection.save();

        res.json(connection);
    } catch (error) {
        console.error('Error in respondToRequest:', error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Delete connection
exports.deleteConnection = async (req, res) => {
    try {
        const connection = await Connection.findById(req.params.connectionId);
        if (!connection) {
            return res.status(404).json({ msg: 'Connection not found' });
        }

        // Verify the user is part of the connection
        if (connection.mentor.toString() !== req.user._id.toString() && 
            connection.mentee.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: 'Not authorized to delete this connection' });
        }

        await connection.remove();
        res.json({ msg: 'Connection deleted' });
    } catch (error) {
        console.error('Error in deleteConnection:', error);
        res.status(500).json({ msg: 'Server error' });
    }
};