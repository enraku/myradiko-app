const Logs = require('../models/Logs');

const logs = new Logs();

const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    
    // レスポンス完了時にログを記録
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logLevel = res.statusCode >= 400 ? 'warning' : 'info';
        
        const logData = {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userAgent: req.get('User-Agent'),
            ip: req.ip
        };

        logs[logLevel]('api', `${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`, JSON.stringify(logData))
            .catch(error => {
                console.error('Failed to log request:', error);
            });
    });

    next();
};

module.exports = requestLogger;