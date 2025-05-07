const mongoose = require('mongoose');

const ConnectionSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  initiator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate connection requests
ConnectionSchema.index({ mentor: 1, mentee: 1 }, { unique: true });

// Update the updatedAt field on save
ConnectionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Connection = mongoose.model('Connection', ConnectionSchema);
module.exports = Connection;