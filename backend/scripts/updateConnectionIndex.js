const { sequelize } = require('../config/db');

async function updateConnectionIndex() {
    const transaction = await sequelize.transaction();
    
    try {
        // Get foreign key constraints
        const [fkConstraints] = await sequelize.query(`
            SELECT CONSTRAINT_NAME
            FROM information_schema.TABLE_CONSTRAINTS
            WHERE TABLE_NAME = 'Connections'
            AND CONSTRAINT_TYPE = 'FOREIGN KEY'
            AND TABLE_SCHEMA = DATABASE();
        `);

        // Drop foreign key constraints
        for (const constraint of fkConstraints) {
            await sequelize.query(`
                ALTER TABLE Connections
                DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME};
            `, { transaction });
        }

        // Drop the old index
        await sequelize.query(`
            ALTER TABLE Connections
            DROP INDEX unique_mentor_mentee;
        `, { transaction });

        // Create the new index
        await sequelize.query(`
            ALTER TABLE Connections
            ADD UNIQUE INDEX unique_mentor_mentee_status (mentorId, menteeId, status);
        `, { transaction });

        // Recreate foreign key constraints
        await sequelize.query(`
            ALTER TABLE Connections
            ADD CONSTRAINT fk_mentor
            FOREIGN KEY (mentorId) REFERENCES Users(id)
            ON DELETE CASCADE;
        `, { transaction });

        await sequelize.query(`
            ALTER TABLE Connections
            ADD CONSTRAINT fk_mentee
            FOREIGN KEY (menteeId) REFERENCES Users(id)
            ON DELETE CASCADE;
        `, { transaction });

        await sequelize.query(`
            ALTER TABLE Connections
            ADD CONSTRAINT fk_initiator
            FOREIGN KEY (initiatorId) REFERENCES Users(id)
            ON DELETE CASCADE;
        `, { transaction });

        await transaction.commit();
        console.log('Successfully updated connection index');
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating connection index:', error);
    } finally {
        await sequelize.close();
    }
}

updateConnectionIndex(); 