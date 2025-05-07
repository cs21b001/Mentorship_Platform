const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connectionController');
const auth = require('../middleware/auth');

// @route   POST /api/connections/request
// @desc    Send a connection request
// @access  Private
router.post('/request', auth, connectionController.sendConnectionRequest);

// @route   GET /api/connections
// @desc    Get user's connections
// @access  Private
router.get('/', auth, connectionController.getUserConnections);

// Accept or reject connection request
// PUT /api/connections/respond
router.put('/respond', auth, connectionController.respondToRequest);

// Delete connection
// DELETE /api/connections/:connectionId
router.delete('/:connectionId', auth, connectionController.deleteConnection);

module.exports = router;