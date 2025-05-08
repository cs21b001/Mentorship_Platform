const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connectionController');
const auth = require('../middleware/auth');

// @route   POST /api/connections/request
// @desc    Send a connection request
// @access  Private
router.post('/request', auth, connectionController.createConnectionRequest);

// @route   GET /api/connections
// @desc    Get user's connections
// @access  Private
router.get('/', auth, connectionController.getConnections);

// Accept connection request
// POST /api/connections/accept/:requestId
router.post('/accept/:requestId', auth, connectionController.acceptRequest);

// Reject connection request
// POST /api/connections/reject/:requestId
router.post('/reject/:requestId', auth, connectionController.rejectRequest);

// Cancel connection request
// POST /api/connections/cancel/:requestId
router.post('/cancel/:requestId', auth, connectionController.cancelRequest);

// Remove active connection
// DELETE /api/connections/:connectionId
router.delete('/:connectionId', auth, connectionController.removeConnection);

module.exports = router;