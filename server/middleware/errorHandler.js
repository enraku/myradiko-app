const Logs = require('../models/Logs');

const logs = new Logs();

const errorHandler = (error, req, res, next) => {
    // ログにエラーを記録
    logs.error('system', 'Unhandled error occurred', JSON.stringify({
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        error: error.message,
        stack: error.stack
    })).catch(logError => {
        console.error('Failed to log error:', logError);
    });

    // 本番環境では詳細なエラー情報を隠す
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const errorResponse = {
        success: false,
        error: 'Internal server error',
        message: isDevelopment ? error.message : 'An unexpected error occurred',
        timestamp: new Date().toISOString()
    };

    if (isDevelopment) {
        errorResponse.stack = error.stack;
    }

    res.status(500).json(errorResponse);
};

module.exports = errorHandler;