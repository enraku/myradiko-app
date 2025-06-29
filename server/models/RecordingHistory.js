const { get: dbGet, run: dbRun, all: dbAll } = require('../utils/database');

class RecordingHistory {
    

    async create(recording) {
        const result = await dbRun(
                `INSERT INTO recording_history 
                (reservation_id, title, station_id, station_name, start_time, end_time, file_path, file_size, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    recording.reservation_id || null,
                    recording.title,
                    recording.station_id,
                    recording.station_name,
                    recording.start_time,
                    recording.end_time,
                    recording.file_path,
                    recording.file_size || null,
                    recording.status || 'recording'
                ]
            );
            return result;
    }

    async getById(id) {
        const result = await dbGet('SELECT * FROM recording_history WHERE id = ?', [id]);
            return result;
    }

    async getAll(limit = 100) {
        const results = await dbAll(
                'SELECT * FROM recording_history ORDER BY created_at DESC LIMIT ?',
                [limit]
            );
            return results;
    }

    async getByStatus(status) {
        const results = await dbAll(
                'SELECT * FROM recording_history WHERE status = ? ORDER BY created_at DESC',
                [status]
            );
            return results;
    }

    async updateStatus(id, status, errorMessage = null) {
        const result = await dbRun(
                'UPDATE recording_history SET status = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [status, errorMessage, id]
            );
            return result;
    }

    async updateFileInfo(id, filePath, fileSize) {
        const result = await dbRun(
                'UPDATE recording_history SET file_path = ?, file_size = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [filePath, fileSize, id]
            );
            return result;
    }

    async delete(id) {
        const result = await dbRun('DELETE FROM recording_history WHERE id = ?', [id]);
            return result;
    }

    async getRecent(days = 7) {
        const results = await dbAll(
                `SELECT * FROM recording_history 
                WHERE created_at >= datetime('now', '-${days} days')
                ORDER BY created_at DESC`
            );
            return results;
    }
}

module.exports = RecordingHistory;