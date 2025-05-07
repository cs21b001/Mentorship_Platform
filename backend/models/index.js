const User = require('./User');
const Profile = require('./Profile');
const Connection = require('./Connection');

// Import associations
require('./associations');

module.exports = {
    User,
    Profile,
    Connection
}; 