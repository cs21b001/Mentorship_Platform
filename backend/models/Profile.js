const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Profile = sequelize.define('Profile', {
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  skills: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    get() {
      const rawValue = this.getDataValue('skills');
      return rawValue ? (Array.isArray(rawValue) ? rawValue : JSON.parse(rawValue)) : [];
    },
    set(value) {
      if (typeof value === 'string') {
        value = JSON.parse(value);
      }
      this.setDataValue('skills', Array.isArray(value) ? value : []);
    }
  },
  interests: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    get() {
      const rawValue = this.getDataValue('interests');
      return rawValue ? (Array.isArray(rawValue) ? rawValue : JSON.parse(rawValue)) : [];
    },
    set(value) {
      if (typeof value === 'string') {
        value = JSON.parse(value);
      }
      this.setDataValue('interests', Array.isArray(value) ? value : []);
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  }
}, {
  timestamps: true
});

// Note: We'll set up associations after User model is loaded to avoid circular dependencies
module.exports = Profile;