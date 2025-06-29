const Reservations = require('../models/Reservations');

const reservations = new Reservations();

const reservationsController = {
    // 全予約一覧取得
    async getAll(req, res) {
        try {
            console.log('Fetching all reservations');
            const data = await reservations.getAll();
            
            res.json({
                success: true,
                data: data,
                count: data.length
            });
        } catch (error) {
            console.error('Failed to fetch reservations:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch reservations',
                message: error.message
            });
        }
    },

    // 予約詳細取得
    async getById(req, res) {
        try {
            const { id } = req.params;
            
            console.log(`Fetching reservation: ${id}`);
            const reservation = await reservations.getById(id);
            
            if (!reservation) {
                return res.status(404).json({
                    success: false,
                    error: 'Reservation not found',
                    message: `Reservation with ID ${id} does not exist`
                });
            }
            
            res.json({
                success: true,
                data: reservation
            });
        } catch (error) {
            console.error('Failed to fetch reservation:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch reservation',
                message: error.message
            });
        }
    },

    // 予約作成
    async create(req, res) {
        try {
            const reservationData = req.body;
            
            // バリデーション
            if (!reservationData.title || !reservationData.station_id || 
                !reservationData.start_time || !reservationData.end_time) {
                return res.status(400).json({
                    success: false,
                    error: 'Required fields missing',
                    message: 'title, station_id, start_time, end_time are required'
                });
            }
            
            console.log(`Creating reservation: ${reservationData.title}`);
            const result = await reservations.create(reservationData);
            
            res.status(201).json({
                success: true,
                data: { id: result.id },
                message: 'Reservation created successfully'
            });
        } catch (error) {
            console.error('Failed to create reservation:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to create reservation',
                message: error.message
            });
        }
    },

    // 予約更新
    async update(req, res) {
        try {
            const { id } = req.params;
            const reservationData = req.body;
            
            console.log(`Updating reservation: ${id}`);
            const result = await reservations.update(id, reservationData);
            
            if (result.changes === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Reservation not found',
                    message: `Reservation with ID ${id} does not exist`
                });
            }
            
            res.json({
                success: true,
                message: 'Reservation updated successfully'
            });
        } catch (error) {
            console.error('Failed to update reservation:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to update reservation',
                message: error.message
            });
        }
    },

    // 予約削除
    async delete(req, res) {
        try {
            const { id } = req.params;
            
            console.log(`Deleting reservation: ${id}`);
            const result = await reservations.delete(id);
            
            if (result.changes === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Reservation not found',
                    message: `Reservation with ID ${id} does not exist`
                });
            }
            
            res.json({
                success: true,
                message: 'Reservation deleted successfully'
            });
        } catch (error) {
            console.error('Failed to delete reservation:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to delete reservation',
                message: error.message
            });
        }
    },

    // 近日中の予約取得
    async getUpcoming(req, res) {
        try {
            const { hours } = req.params;
            const limitHours = parseInt(hours) || 24;
            
            console.log(`Fetching upcoming reservations (${limitHours} hours)`);
            const data = await reservations.getUpcoming(limitHours);
            
            res.json({
                success: true,
                data: data,
                count: data.length,
                limitHours: limitHours
            });
        } catch (error) {
            console.error('Failed to fetch upcoming reservations:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch upcoming reservations',
                message: error.message
            });
        }
    }
};

module.exports = reservationsController;