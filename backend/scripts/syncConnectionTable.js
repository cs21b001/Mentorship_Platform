require('dotenv').config();
const { syncConnectionTable } = require('../config/db');

async function runMigration() {
    try {
        console.log('Starting Connection table migration...');
        await syncConnectionTable();
        console.log('Connection table migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();