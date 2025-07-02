const Logs = require('../models/Logs');
const logger = require('../services/Logger');

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
    },

    // ログ設定取得
    async getConfig(req, res) {
        try {
            const config = logger.getConfig();
            
            res.json({
                success: true,
                data: config
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to get log config',
                message: error.message
            });
        }
    },

    // ログレベル設定
    async setLogLevel(req, res) {
        try {
            const { level } = req.body;
            
            if (!level) {
                return res.status(400).json({
                    success: false,
                    error: 'Log level is required'
                });
            }
            
            logger.setLogLevel(level);
            
            res.json({
                success: true,
                message: `Log level set to: ${level}`,
                data: { logLevel: level }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to set log level',
                message: error.message
            });
        }
    },

    // ログクリーンアップ実行
    async cleanup(req, res) {
        try {
            const retentionDays = parseInt(req.body.retentionDays) || 30;
            
            const result = await logger.cleanup(retentionDays);
            
            res.json({
                success: true,
                message: `Log cleanup completed. Retained logs for ${retentionDays} days`,
                data: {
                    retentionDays,
                    deletedRows: result.changes
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to cleanup logs',
                message: error.message
            });
        }
    },

    // テストログ作成
    async createTestLog(req, res) {
        try {
            const { level = 'info', category = 'test', message = 'Test log entry' } = req.body;
            
            await logger._log(level, category, message, { 
                timestamp: new Date().toISOString(),
                testEntry: true 
            });
            
            res.json({
                success: true,
                message: 'Test log created successfully',
                data: { level, category, message }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to create test log',
                message: error.message
            });
        }
    }
};

module.exports = logsController;