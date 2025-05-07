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
  foreignKey: 'mentorId'
});

User.hasMany(Connection, {
  as: 'MenteeConnections',
  foreignKey: 'menteeId'
});

User.hasMany(Connection, {
  as: 'InitiatedConnections',
  foreignKey: 'initiatorId'
});

// Connection associations for Connection model
Connection.belongsTo(User, {
  as: 'mentorUser',
  foreignKey: 'mentorId'
});

Connection.belongsTo(User, {
  as: 'menteeUser',
  foreignKey: 'menteeId'
});

Connection.belongsTo(User, {
  as: 'initiatorUser',
  foreignKey: 'initiatorId'
});

module.exports = {
  User,
  Profile,
  Connection
}; 