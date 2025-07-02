const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const logger = require('../services/Logger');
const ffmpegManager = require('../services/FFmpegManager');

const systemController = {
    // 録音フォルダをエクスプローラーで開く
    async openRecordingsFolder(req, res) {
        try {
            const recordingsPath = path.resolve(__dirname, '../../recordings');
            
            // フォルダが存在するか確認
            try {
                await fs.access(recordingsPath);
            } catch (error) {
                // フォルダが存在しない場合は作成
                await fs.mkdir(recordingsPath, { recursive: true });
                console.log(`Created recordings directory: ${recordingsPath}`);
            }
            
            // プラットフォームに応じてフォルダを開く
            let command, args;
            
            switch (process.platform) {
                case 'win32':
                    command = 'explorer';
                    args = [recordingsPath];
                    break;
                case 'darwin':
                    command = 'open';
                    args = [recordingsPath];
                    break;
                case 'linux':
                    command = 'xdg-open';
                    args = [recordingsPath];
                    break;
                default:
                    return res.status(500).json({
                        success: false,
                        error: 'Unsupported platform',
                        message: `Platform ${process.platform} is not supported`
                    });
            }
            
            // エクスプローラー/ファインダーを起動
            const childProcess = spawn(command, args, {
                detached: true,
                stdio: 'ignore'
            });
            
            childProcess.unref();
            
            res.json({
                success: true,
                message: 'Recordings folder opened successfully',
                data: {
                    path: recordingsPath,
                    platform: process.platform
                }
            });
            
        } catch (error) {
            console.error('Failed to open recordings folder:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to open recordings folder',
                message: error.message
            });
        }
    },

    // 指定したパスのフォルダを開く
    async openFolder(req, res) {
        try {
            const { folderPath } = req.body;
            
            if (!folderPath) {
                return res.status(400).json({
                    success: false,
                    error: 'Folder path is required',
                    message: 'folderPath parameter is required'
                });
            }
            
            // セキュリティ: 録音フォルダ以外は開けない
            const recordingsPath = path.resolve(__dirname, '../../recordings');
            const requestedPath = path.resolve(folderPath);
            
            if (!requestedPath.startsWith(recordingsPath)) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied',
                    message: 'Can only open folders within recordings directory'
                });
            }
            
            // フォルダが存在するか確認
            try {
                const stats = await fs.stat(requestedPath);
                if (!stats.isDirectory()) {
                    return res.status(400).json({
                        success: false,
                        error: 'Not a directory',
                        message: 'Specified path is not a directory'
                    });
                }
            } catch (error) {
                return res.status(404).json({
                    success: false,
                    error: 'Folder not found',
                    message: 'Specified folder does not exist'
                });
            }
            
            // プラットフォームに応じてフォルダを開く
            let command, args;
            
            switch (process.platform) {
                case 'win32':
                    command = 'explorer';
                    args = [requestedPath];
                    break;
                case 'darwin':
                    command = 'open';
                    args = [requestedPath];
                    break;
                case 'linux':
                    command = 'xdg-open';
                    args = [requestedPath];
                    break;
                default:
                    return res.status(500).json({
                        success: false,
                        error: 'Unsupported platform',
                        message: `Platform ${process.platform} is not supported`
                    });
            }
            
            // エクスプローラー/ファインダーを起動
            const childProcess = spawn(command, args, {
                detached: true,
                stdio: 'ignore'
            });
            
            childProcess.unref();
            
            res.json({
                success: true,
                message: 'Folder opened successfully',
                data: {
                    path: requestedPath,
                    platform: process.platform
                }
            });
            
        } catch (error) {
            console.error('Failed to open folder:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to open folder',
                message: error.message
            });
        }
    },

    // システム情報取得
    async getSystemInfo(req, res) {
        try {
            const recordingsPath = path.resolve(__dirname, '../../recordings');
            
            // 基本システム情報
            const systemInfo = {
                // 基本OS情報
                platform: process.platform,
                architecture: process.arch,
                nodeVersion: process.version,
                hostname: os.hostname(),
                uptime: os.uptime(),
                
                // メモリ情報
                memory: {
                    total: os.totalmem(),
                    free: os.freemem(),
                    used: os.totalmem() - os.freemem(),
                    processUsed: process.memoryUsage()
                },
                
                // CPU情報
                cpu: {
                    model: os.cpus()[0]?.model || 'Unknown',
                    cores: os.cpus().length,
                    loadAverage: os.loadavg()
                },
                
                // ディスク使用量（録音フォルダ）
                storage: await systemController.getStorageInfo(recordingsPath),
                
                // 録音関連情報
                recordings: {
                    path: recordingsPath,
                    canOpenFolder: ['win32', 'darwin', 'linux'].includes(process.platform)
                },
                
                // 依存関係チェック
                dependencies: await systemController.checkDependencies(),
                
                // 実行時間統計
                runtime: {
                    startTime: new Date(Date.now() - process.uptime() * 1000).toISOString(),
                    uptime: process.uptime(),
                    environment: process.env.NODE_ENV || 'development',
                    pid: process.pid
                }
            };
            
            await logger.system('info', 'System information requested', {
                requestedBy: req.ip,
                userAgent: req.get('User-Agent')
            });
            
            res.json({
                success: true,
                data: systemInfo
            });
            
        } catch (error) {
            console.error('Failed to get system info:', error);
            await logger.system('error', 'Failed to get system info', {
                error: error.message,
                stack: error.stack
            });
            
            res.status(500).json({
                success: false,
                error: 'Failed to get system info',
                message: error.message
            });
        }
    },

    // ストレージ情報取得
    async getStorageInfo(dirPath) {
        try {
            // ディレクトリが存在しない場合は作成
            try {
                await fs.access(dirPath);
            } catch (error) {
                await fs.mkdir(dirPath, { recursive: true });
            }

            // ディレクトリ内のファイル情報取得
            const files = await fs.readdir(dirPath);
            let totalSize = 0;
            let fileCount = 0;

            for (const file of files) {
                const filePath = path.join(dirPath, file);
                try {
                    const stats = await fs.stat(filePath);
                    if (stats.isFile()) {
                        totalSize += stats.size;
                        fileCount++;
                    }
                } catch (error) {
                    // ファイルアクセスエラーは無視
                }
            }

            // ディスク使用量取得（プラットフォーム別）
            let diskSpace = null;
            try {
                if (process.platform === 'linux' || process.platform === 'darwin') {
                    const { stdout } = await exec(`df -h "${dirPath}"`);
                    const lines = stdout.split('\n');
                    if (lines.length > 1) {
                        const parts = lines[1].split(/\s+/);
                        diskSpace = {
                            total: parts[1],
                            used: parts[2],
                            available: parts[3],
                            usePercentage: parts[4]
                        };
                    }
                } else if (process.platform === 'win32') {
                    // Windows用のディスク容量取得は複雑なため、Node.jsベースで実装
                    const stats = await fs.stat(dirPath);
                    diskSpace = {
                        message: 'Windows disk space detection not implemented',
                        available: 'Unknown'
                    };
                }
            } catch (error) {
                diskSpace = { error: 'Could not get disk space' };
            }

            return {
                recordingsPath: dirPath,
                fileCount,
                totalSize,
                totalSizeFormatted: systemController.formatBytes(totalSize),
                diskSpace
            };
        } catch (error) {
            return {
                error: error.message,
                recordingsPath: dirPath
            };
        }
    },

    // 依存関係チェック
    async checkDependencies() {
        const dependencies = {
            ffmpeg: { available: false, version: null },
            sqlite: { available: false, version: null },
            curl: { available: false, version: null }
        };

        // FFmpeg チェック（FFmpegManagerを使用）
        try {
            const isAvailable = await ffmpegManager.isAvailable();
            if (isAvailable) {
                const version = await ffmpegManager.getFFmpegVersion();
                const info = ffmpegManager.getInfo();
                dependencies.ffmpeg = {
                    available: true,
                    version: version,
                    path: info.path,
                    platform: info.platform
                };
            } else {
                dependencies.ffmpeg.error = 'FFmpeg not found or not initialized';
            }
        } catch (error) {
            dependencies.ffmpeg.error = error.message;
        }

        // SQLite チェック
        try {
            const { stdout } = await exec('sqlite3 --version');
            dependencies.sqlite = {
                available: true,
                version: stdout.trim().split(' ')[0]
            };
        } catch (error) {
            // Node.js sqlite3 パッケージが利用可能かチェック
            try {
                require('sqlite3');
                dependencies.sqlite = {
                    available: true,
                    version: 'Node.js sqlite3 package available'
                };
            } catch (requireError) {
                dependencies.sqlite.error = 'Not available';
            }
        }

        // curl チェック
        try {
            const { stdout } = await exec('curl --version');
            const match = stdout.match(/curl ([^\s]+)/);
            dependencies.curl = {
                available: true,
                version: match ? match[1] : 'Unknown'
            };
        } catch (error) {
            dependencies.curl.error = error.message;
        }

        return dependencies;
    },

    // バイト数を人間が読みやすい形式にフォーマット
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // 詳細システム統計取得
    async getDetailedStats(req, res) {
        try {
            const stats = {
                timestamp: new Date().toISOString(),
                
                // プロセス統計
                process: {
                    pid: process.pid,
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    cpu: process.cpuUsage(),
                    version: process.version,
                    platform: process.platform,
                    arch: process.arch
                },

                // システム統計
                system: {
                    hostname: os.hostname(),
                    uptime: os.uptime(),
                    loadavg: os.loadavg(),
                    totalmem: os.totalmem(),
                    freemem: os.freemem(),
                    cpus: os.cpus().length,
                    networkInterfaces: Object.keys(os.networkInterfaces()).length
                },

                // アプリケーション統計
                application: {
                    environment: process.env.NODE_ENV || 'development',
                    logLevel: logger.getConfig().logLevel,
                    recordingsPath: path.resolve(__dirname, '../../recordings')
                }
            };

            await logger.system('info', 'Detailed system stats requested');

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Failed to get detailed stats:', error);
            await logger.system('error', 'Failed to get detailed stats', {
                error: error.message
            });

            res.status(500).json({
                success: false,
                error: 'Failed to get detailed stats',
                message: error.message
            });
        }
    },

    // システムヘルスチェック
    async healthCheck(req, res) {
        try {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                checks: {
                    database: false,
                    recordings: false,
                    dependencies: false,
                    memory: false,
                    disk: false
                },
                details: {}
            };

            // データベースチェック
            try {
                const Database = require('../models/Database');
                const db = new Database();
                health.checks.database = true;
                health.details.database = 'Connected';
            } catch (error) {
                health.details.database = error.message;
            }

            // 録音フォルダチェック
            try {
                const recordingsPath = path.resolve(__dirname, '../../recordings');
                await fs.access(recordingsPath);
                health.checks.recordings = true;
                health.details.recordings = 'Accessible';
            } catch (error) {
                health.details.recordings = error.message;
            }

            // 依存関係チェック
            const deps = await systemController.checkDependencies();
            health.checks.dependencies = deps.ffmpeg.available;
            health.details.dependencies = deps;

            // メモリチェック (90%未満なら正常)
            const memUsage = (os.totalmem() - os.freemem()) / os.totalmem();
            health.checks.memory = memUsage < 0.9;
            health.details.memory = {
                usage: `${(memUsage * 100).toFixed(1)}%`,
                total: systemController.formatBytes(os.totalmem()),
                free: systemController.formatBytes(os.freemem())
            };

            // ディスクチェック
            const storage = await systemController.getStorageInfo(path.resolve(__dirname, '../../recordings'));
            health.checks.disk = !storage.error;
            health.details.disk = storage;

            // 全体的なヘルス状態
            const healthyChecks = Object.values(health.checks).filter(Boolean).length;
            const totalChecks = Object.keys(health.checks).length;
            
            if (healthyChecks === totalChecks) {
                health.status = 'healthy';
            } else if (healthyChecks >= totalChecks * 0.8) {
                health.status = 'warning';
            } else {
                health.status = 'critical';
            }

            health.score = `${healthyChecks}/${totalChecks}`;

            const statusCode = health.status === 'healthy' ? 200 : 
                             health.status === 'warning' ? 200 : 503;

            res.status(statusCode).json({
                success: true,
                data: health
            });

        } catch (error) {
            console.error('Health check failed:', error);
            
            res.status(503).json({
                success: false,
                status: 'error',
                error: 'Health check failed',
                message: error.message
            });
        }
    }
};

module.exports = systemController;