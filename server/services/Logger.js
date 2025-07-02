const Logs = require('../models/Logs');

class Logger {
    constructor() {
        this.logs = new Logs();
        this.logLevel = process.env.LOG_LEVEL || 'info';
        this.enableConsole = process.env.LOG_CONSOLE !== 'false';
        this.enableDatabase = process.env.LOG_DATABASE !== 'false';
        
        // ログレベルの優先度
        this.levelPriority = {
            error: 0,
            warning: 1,
            info: 2,
            debug: 3
        };
    }

    /**
     * ログを出力する内部メソッド
     */
    async _log(level, category, message, details = null) {
        // ログレベルによるフィルタリング
        if (this.levelPriority[level] > this.levelPriority[this.logLevel]) {
            return;
        }

        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            category,
            message,
            details
        };

        // コンソール出力
        if (this.enableConsole) {
            this._outputToConsole(logEntry);
        }

        // データベース出力
        if (this.enableDatabase) {
            try {
                await this.logs.create(level, category, message, 
                    details ? JSON.stringify(details) : null);
            } catch (error) {
                console.error('❌ Failed to save log to database:', error.message);
            }
        }
    }

    /**
     * コンソール出力フォーマット
     */
    _outputToConsole(logEntry) {
        const { timestamp, level, category, message, details } = logEntry;
        const time = new Date(timestamp).toLocaleTimeString('ja-JP');
        
        // ログレベル別のアイコンと色
        const levelFormats = {
            error: '❌',
            warning: '⚠️',
            info: '📝',
            debug: '🔍'
        };

        const icon = levelFormats[level] || '📝';
        const logMessage = `${icon} [${time}] [${category.toUpperCase()}] ${message}`;
        
        // レベル別のコンソール出力
        switch (level) {
            case 'error':
                console.error(logMessage);
                break;
            case 'warning':
                console.warn(logMessage);
                break;
            case 'debug':
                console.debug(logMessage);
                break;
            default:
                console.log(logMessage);
        }

        // 詳細情報がある場合は出力
        if (details) {
            console.log('   📋 Details:', details);
        }
    }

    /**
     * エラーログ
     */
    async error(category, message, details = null) {
        await this._log('error', category, message, details);
    }

    /**
     * 警告ログ
     */
    async warning(category, message, details = null) {
        await this._log('warning', category, message, details);
    }

    /**
     * 情報ログ
     */
    async info(category, message, details = null) {
        await this._log('info', category, message, details);
    }

    /**
     * デバッグログ
     */
    async debug(category, message, details = null) {
        await this._log('debug', category, message, details);
    }

    /**
     * 録音関連ログ
     */
    async recording(level, message, details = null) {
        await this._log(level, 'recording', message, details);
    }

    /**
     * API関連ログ
     */
    async api(level, message, details = null) {
        await this._log(level, 'api', message, details);
    }

    /**
     * システム関連ログ
     */
    async system(level, message, details = null) {
        await this._log(level, 'system', message, details);
    }

    /**
     * 認証関連ログ
     */
    async auth(level, message, details = null) {
        await this._log(level, 'auth', message, details);
    }

    /**
     * スケジューラー関連ログ
     */
    async scheduler(level, message, details = null) {
        await this._log(level, 'scheduler', message, details);
    }

    /**
     * ログレベル設定
     */
    setLogLevel(level) {
        if (this.levelPriority.hasOwnProperty(level)) {
            this.logLevel = level;
            this.info('system', `Log level changed to: ${level}`);
        } else {
            this.warning('system', `Invalid log level: ${level}`);
        }
    }

    /**
     * ログ設定情報取得
     */
    getConfig() {
        return {
            logLevel: this.logLevel,
            enableConsole: this.enableConsole,
            enableDatabase: this.enableDatabase,
            availableLevels: Object.keys(this.levelPriority)
        };
    }

    /**
     * ログクリーンアップ実行
     */
    async cleanup(retentionDays = 30) {
        try {
            const result = await this.logs.cleanup(retentionDays);
            this.info('system', `Log cleanup completed. Retained logs for ${retentionDays} days`, {
                deletedRows: result.changes
            });
            return result;
        } catch (error) {
            this.error('system', 'Log cleanup failed', { error: error.message });
            throw error;
        }
    }
}

// シングルトンインスタンス
const logger = new Logger();

module.exports = logger;