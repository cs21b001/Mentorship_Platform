const User = require('./User');
const Profile = require('./Profile');
const Connection = require('./Connection');

// User-Profile associations
User.hasOne(Profile, {
  foreignKey: {
    name: 'userId',
    allowNull: false
  },
  onDelete: 'CASCADE'
});

Profile.belongsTo(User, {
  foreignKey: 'userId'
});

// Connection associations for User model
User.hasMany(Connection, {
  as: 'MentorConnections',
  foreignKey: 'mentorId',
  onDelete: 'CASCADE'
});

User.hasMany(Connection, {
  as: 'MenteeConnections',
  foreignKey: 'menteeId',
  onDelete: 'CASCADE'
});

User.hasMany(Connection, {
  as: 'InitiatedConnections',
  foreignKey: 'initiatorId',
  onDelete: 'CASCADE'
});

// Connection associations for Connection model
Connection.belongsTo(User, {
  as: 'mentorUser',
  foreignKey: 'mentorId',
  onDelete: 'CASCADE'
});

Connection.belongsTo(User, {
  as: 'menteeUser',
  foreignKey: 'menteeId',
  onDelete: 'CASCADE'
});

Connection.belongsTo(User, {
  as: 'initiatorUser',
  foreignKey: 'initiatorId',
  onDelete: 'CASCADE'
});

module.exports = {
  User,
  Profile,
  Connection
}; 