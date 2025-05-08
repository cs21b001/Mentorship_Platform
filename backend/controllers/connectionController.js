const { Connection, User, Profile } = require('../models');
const { Op } = require('sequelize');

// Create connection request
exports.createConnectionRequest = async (req, res) => {
    try {
        const { receiverId } = req.body;
        const initiatorId = req.user.id;

        // Prevent self-connection
        if (receiverId === initiatorId) {
            return res.status(400).json({
                status: 'error',
                message: 'You cannot send a connection request to yourself'
            });
        }

        // Get both users to check their roles
        const [initiator, target] = await Promise.all([
            User.findByPk(initiatorId),
            User.findByPk(receiverId)
        ]);

        if (!target) {
            return res.status(404).json({
                status: 'error',
                message: 'Target user not found'
            });
        }

        if (!initiator) {
            return res.status(404).json({
                status: 'error',
                message: 'Initiator user not found'
            });
        }

        // Check if users have different roles
        if (initiator.role === target.role) {
            return res.status(400).json({
                status: 'error',
                message: 'Mentor and mentee must have different roles'
            });
        }

        // Determine mentor and mentee based on roles
        const mentorId = initiator.role === 'mentor' ? initiatorId : receiverId;
        const menteeId = initiator.role === 'mentee' ? initiatorId : receiverId;

        // Check for existing active or pending connection
        const existingConnection = await Connection.findOne({
            where: {
                [Op.or]: [
                    { mentorId, menteeId },
                    { mentorId: menteeId, menteeId: mentorId }
                ],
                status: {
                    [Op.in]: ['pending', 'accepted']
                }
            }
        });

        if (existingConnection) {
            const status = existingConnection.status;
            return res.status(409).json({
                status: 'error',
                message: status === 'pending' 
                    ? 'A pending connection request already exists with this user'
                    : 'You are already connected with this user'
            });
        }

        // Create new connection request
        const connection = await Connection.create({
            mentorId,
            menteeId,
            initiatorId,
            status: 'pending'
        });

        res.status(201).json({
            status: 'success',
            data: connection
        });

    } catch (error) {
        // Check for specific error types
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                status: 'error',
                message: 'A connection request already exists between these users'
            });
        }

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid connection request data',
                errors: error.errors.map(e => e.message)
            });
        }

        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid user reference'
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Failed to create connection request'
        });
    }
};

// Get user's connections
exports.getConnections = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get active connections
        const activeConnections = await Connection.findAll({
            where: {
                [Op.or]: [
                    { mentorId: userId },
                    { menteeId: userId }
                ],
                status: 'accepted'
            },
            include: [{
                model: User,
                as: 'mentorUser',
                attributes: ['firstName', 'lastName', 'email', 'role']
            }, {
                model: User,
                as: 'menteeUser',
                attributes: ['firstName', 'lastName', 'email', 'role']
            }, {
                model: User,
                as: 'initiatorUser',
                attributes: ['firstName', 'lastName', 'email', 'role']
            }]
        });

        // Get pending requests
        const pendingRequests = await Connection.findAll({
            where: {
                [Op.or]: [
                    { mentorId: userId },
                    { menteeId: userId }
                ],
                status: 'pending'
            },
            include: [{
                model: User,
                as: 'mentorUser',
                attributes: ['firstName', 'lastName', 'email', 'role']
            }, {
                model: User,
                as: 'menteeUser',
                attributes: ['firstName', 'lastName', 'email', 'role']
            }, {
                model: User,
                as: 'initiatorUser',
                attributes: ['firstName', 'lastName', 'email', 'role']
            }]
        });

        // Transform the data to include the request type
        const transformedPending = pendingRequests.map(req => {
            const reqJson = req.toJSON();
            return {
                ...reqJson,
                type: req.initiatorId === userId ? 'sent' : 'received'
            };
        });

        res.json({
            status: 'success',
            data: {
                active: activeConnections,
                pending: transformedPending
            }
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch connections'
        });
    }
};

// Accept connection request
exports.acceptRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user.id;

        const request = await Connection.findOne({
            where: {
                id: requestId,
                [Op.or]: [
                    { mentorId: userId },
                    { menteeId: userId }
                ],
                initiatorId: { [Op.ne]: userId }, // Must not be the initiator
                status: 'pending'
            }
        });

        if (!request) {
            return res.status(404).json({
                status: 'error',
                message: 'Connection request not found'
            });
        }

        await request.update({ status: 'accepted' });

        res.json({
            status: 'success',
            message: 'Connection request accepted'
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to accept connection request'
        });
    }
};

// Reject connection request
exports.rejectRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user.id;

        const request = await Connection.findOne({
            where: {
                id: requestId,
                [Op.or]: [
                    { mentorId: userId },
                    { menteeId: userId }
                ],
                initiatorId: { [Op.ne]: userId }, // Must not be the initiator
                status: 'pending'
            }
        });

        if (!request) {
            return res.status(404).json({
                status: 'error',
                message: 'Connection request not found'
            });
        }

        await request.destroy();

        res.json({
            status: 'success',
            message: 'Connection request rejected'
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to reject connection request'
        });
    }
};

// Cancel connection request
exports.cancelRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user.id;

        const request = await Connection.findOne({
            where: {
                id: requestId,
                initiatorId: userId,
                status: 'pending'
            }
        });

        if (!request) {
            return res.status(404).json({
                status: 'error',
                message: 'Connection request not found'
            });
        }

        await request.destroy();

        res.json({
            status: 'success',
            message: 'Connection request cancelled'
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to cancel connection request'
        });
    }
};