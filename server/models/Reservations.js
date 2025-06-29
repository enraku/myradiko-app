const { get: dbGet, run: dbRun, all: dbAll } = require('../utils/database');

class Reservations {

    async create(reservation) {
        const result = await dbRun(
                `INSERT INTO reservations 
                (title, station_id, station_name, start_time, end_time, repeat_type, repeat_days, is_active) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    reservation.title,
                    reservation.station_id,
                    reservation.station_name,
                    reservation.start_time,
                    reservation.end_time,
                    reservation.repeat_type || 'none',
                    reservation.repeat_days || null,
                    reservation.is_active !== false
                ]
            );
            return result;
    }

    async getById(id) {
        const result = await dbGet('SELECT * FROM reservations WHERE id = ?', [id]);
            return result;
    }

    async getAll() {
        const results = await dbAll('SELECT * FROM reservations ORDER BY start_time ASC');
            return results;
    }

    async getActive() {
        const results = await dbAll(
                'SELECT * FROM reservations WHERE is_active = true ORDER BY start_time ASC'
            );
            return results;
    }

    async update(id, reservation) {
        const result = await dbRun(
                `UPDATE reservations SET 
                title = ?, station_id = ?, station_name = ?, start_time = ?, end_time = ?, 
                repeat_type = ?, repeat_days = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?`,
                [
                    reservation.title,
                    reservation.station_id,
                    reservation.station_name,
                    reservation.start_time,
                    reservation.end_time,
                    reservation.repeat_type,
                    reservation.repeat_days,
                    reservation.is_active,
                    id
                ]
            );
            return result;
    }

    async delete(id) {
        const result = await dbRun('DELETE FROM reservations WHERE id = ?', [id]);
            return result;
    }

    async getUpcoming(limitHours = 24) {
        const results = await dbAll(
                `SELECT * FROM reservations 
                WHERE is_active = true 
                AND start_time BETWEEN datetime('now') AND datetime('now', '+${limitHours} hours')
                ORDER BY start_time ASC`
            );
            return results;
    }
}

module.exports = Reservations;