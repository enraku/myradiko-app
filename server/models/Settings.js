const { get: dbGet, run: dbRun, all: dbAll } = require('../utils/database');

class Settings {
    async get(key) {
        const result = await dbGet('SELECT value FROM settings WHERE key = ?', [key]);
        return result ? result.value : null;
    }

    async set(key, value) {
        const result = await dbRun(
            'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
            [key, value]
        );
        return result;
    }

    async getAll() {
        const results = await dbAll('SELECT * FROM settings ORDER BY key');
        return results;
    }

    async delete(key) {
        const result = await dbRun('DELETE FROM settings WHERE key = ?', [key]);
        return result;
    }
}

module.exports = Settings;