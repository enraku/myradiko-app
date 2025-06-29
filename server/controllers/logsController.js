const Logs = require('../models/Logs');

const logs = new Logs();

const logsController = {
    // 全ログ取得
    async getAll(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 1000;
            
            const data = await logs.getAll(limit);
            
            res.json({
                success: true,
                data: data,
                count: data.length,
                limit: limit
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch logs',
                message: error.message
            });
        }
    },

    // レベル別ログ取得
    async getByLevel(req, res) {
        try {
            const { level } = req.params;
            const limit = parseInt(req.query.limit) || 1000;
            
            const data = await logs.getByLevel(level, limit);
            
            res.json({
                success: true,
                data: data,
                count: data.length,
                level: level,
                limit: limit
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch logs by level',
                message: error.message
            });
        }
    },

    // カテゴリ別ログ取得
    async getByCategory(req, res) {
        try {
            const { category } = req.params;
            const limit = parseInt(req.query.limit) || 1000;
            
            const data = await logs.getByCategory(category, limit);
            
            res.json({
                success: true,
                data: data,
                count: data.length,
                category: category,
                limit: limit
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch logs by category',
                message: error.message
            });
        }
    },

    // 最近のログ取得
    async getRecent(req, res) {
        try {
            const { days } = req.params;
            const limitDays = parseInt(days) || 7;
            
            const data = await logs.getRecent(limitDays);
            
            res.json({
                success: true,
                data: data,
                count: data.length,
                limitDays: limitDays
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch recent logs',
                message: error.message
            });
        }
    }
};

module.exports = logsController;