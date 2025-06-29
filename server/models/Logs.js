const { get: dbGet, run: dbRun, all: dbAll } = require('../utils/database');

class Logs {
    

    async create(level, category, message, details = null) {
        const result = await dbRun(
                'INSERT INTO logs (level, category, message, details) VALUES (?, ?, ?, ?)',
                [level, category, message, details]
            );
            return result;
    }

    async info(category, message, details = null) {
        return this.create('info', category, message, details);
    }

    async warning(category, message, details = null) {
        return this.create('warning', category, message, details);
    }

    async error(category, message, details = null) {
        return this.create('error', category, message, details);
    }

    async getAll(limit = 1000) {
        const results = await dbAll(
                'SELECT * FROM logs ORDER BY created_at DESC LIMIT ?',
                [limit]
            );
            return results;
    }

    async getByLevel(level, limit = 1000) {
        const results = await dbAll(
                'SELECT * FROM logs WHERE level = ? ORDER BY created_at DESC LIMIT ?',
                [level, limit]
            );
            return results;
    }

    async getByCategory(category, limit = 1000) {
        const results = await dbAll(
                'SELECT * FROM logs WHERE category = ? ORDER BY created_at DESC LIMIT ?',
                [category, limit]
            );
            return results;
    }

    async getRecent(days = 7) {
        const results = await dbAll(
                `SELECT * FROM logs 
                WHERE created_at >= datetime('now', '-${days} days')
                ORDER BY created_at DESC`
            );
            return results;
    }

    async cleanup(retentionDays = 30) {
        const result = await dbRun(
                `DELETE FROM logs WHERE created_at < datetime('now', '-${retentionDays} days')`
            );
            return result;
    }
}

module.exports = Logs;