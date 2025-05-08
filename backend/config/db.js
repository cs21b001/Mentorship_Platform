const { Sequelize } = require('sequelize');
require('dotenv').config();

// Load environment variables
const dbConfig = {
    database: process.env.DB_NAME || 'mentorship_platform',
    username: process.env.DB_USER || 'your_username_here',
    password: process.env.DB_PASSWORD || 'your_password_here',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    define: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        timestamps: true
    }
};

console.log('Using database config:', {
    ...dbConfig,
    password: '[HIDDEN]'
});

const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: dbConfig.logging,
        pool: dbConfig.pool,
        define: dbConfig.define11284
    }
);

// Function to sync only the Connection table
async function syncConnectionTable() {
    try {
        // Drop and recreate only the Connection table
        await sequelize.query('DROP TABLE IF EXISTS `Connections`;');
        console.log('Connection table dropped successfully');
        
        // Import the Connection model
        const Connection = require('../models/Connection');
        
        // Sync only the Connection model
        await Connection.sync({ force: true });
        console.log('Connection table recreated successfully');
    } catch (error) {
        console.error('Error syncing Connection table:', error);
        throw error;
    }
}

// Test the connection and sync database
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
        
        // Sync all models with the database
        // force: false to prevent dropping tables
        // alter: true to make necessary changes to match the model
        await sequelize.sync({ alter: true });
        console.log('Database synchronized successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

module.exports = {
    sequelize,
    testConnection,
    syncConnectionTable
}; 