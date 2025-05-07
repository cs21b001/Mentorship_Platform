const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Connection = sequelize.define('Connection', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  mentorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  menteeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  initiatorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    defaultValue: 'pending'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['mentorId', 'menteeId', 'status'],
      name: 'unique_mentor_mentee_status'
    }
  ]
});

// Define associations
Connection.belongsTo(User, { 
  as: 'mentor', 
  foreignKey: 'mentorId',
  onDelete: 'CASCADE'
});

Connection.belongsTo(User, { 
  as: 'mentee', 
  foreignKey: 'menteeId',
  onDelete: 'CASCADE'
});

Connection.belongsTo(User, { 
  as: 'initiator', 
  foreignKey: 'initiatorId',
  onDelete: 'CASCADE'
});

module.exports = Connection;