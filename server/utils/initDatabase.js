const Database = require('../models/Database');

async function initDatabase() {
    const db = new Database();
    
    try {
        console.log('Initializing database...');
        await db.connect();
        await db.initialize();
        console.log('Database initialization completed successfully');
    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
    } finally {
        await db.close();
    }
}

// スクリプトとして直接実行された場合
if (require.main === module) {
    initDatabase()
        .then(() => {
            console.log('Database setup completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error during database setup:', error);
            process.exit(1);
        });
}

module.exports = initDatabase;