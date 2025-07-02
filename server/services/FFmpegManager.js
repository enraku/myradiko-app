const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const logger = require('./Logger');

class FFmpegManager {
    constructor() {
        this.ffmpegPath = null;
        this.isInitialized = false;
        this.platform = process.platform;
    }

    /**
     * FFmpeg初期化（起動時に実行）
     */
    async initialize() {
        if (this.isInitialized) return this.ffmpegPath;

        try {
            await logger.system('info', 'Initializing FFmpeg...');
            
            // プラットフォーム別の検索
            switch (this.platform) {
                case 'win32':
                    this.ffmpegPath = await this.findWindowsFFmpeg();
                    break;
                case 'darwin':
                    this.ffmpegPath = await this.findMacFFmpeg();
                    break;
                case 'linux':
                    this.ffmpegPath = await this.findLinuxFFmpeg();
                    break;
                default:
                    throw new Error(`Unsupported platform: ${this.platform}`);
            }

            // バージョン確認
            const version = await this.getFFmpegVersion();
            await logger.system('info', `FFmpeg initialized successfully`, {
                path: this.ffmpegPath,
                version: version,
                platform: this.platform
            });

            this.isInitialized = true;
            return this.ffmpegPath;

        } catch (error) {
            await logger.system('error', 'FFmpeg initialization failed', {
                error: error.message,
                platform: this.platform
            });
            throw error;
        }
    }

    /**
     * Windows環境でのFFmpeg検索
     */
    async findWindowsFFmpeg() {
        const searchPaths = [
            // 1. アプリ内蔵（Electron）
            path.join(process.resourcesPath || '.', 'ffmpeg', 'ffmpeg.exe'),
            path.join(__dirname, '../../ffmpeg/ffmpeg.exe'),
            
            // 2. ローカルディレクトリ
            path.join(process.cwd(), 'ffmpeg', 'ffmpeg.exe'),
            path.join(process.cwd(), 'bin', 'ffmpeg.exe'),
            
            // 3. 一般的なインストール先
            'C:\\ffmpeg\\bin\\ffmpeg.exe',
            'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
            'C:\\Program Files (x86)\\ffmpeg\\bin\\ffmpeg.exe',
            
            // 4. システムPATH
            'ffmpeg.exe',
            'ffmpeg'
        ];

        for (const ffmpegPath of searchPaths) {
            try {
                if (path.isAbsolute(ffmpegPath)) {
                    // 絶対パスの場合はファイル存在確認
                    await fs.access(ffmpegPath);
                    await logger.system('debug', `Found FFmpeg at: ${ffmpegPath}`);
                    return ffmpegPath;
                } else {
                    // 相対パス/コマンド名の場合は実行テスト
                    await execAsync(`"${ffmpegPath}" -version`);
                    await logger.system('debug', `Found FFmpeg in PATH: ${ffmpegPath}`);
                    return ffmpegPath;
                }
            } catch (error) {
                // このパスでは見つからない、次を試す
                continue;
            }
        }

        // 見つからない場合はダウンロード提案
        throw new Error(
            'FFmpeg not found. Please install FFmpeg or place ffmpeg.exe in the application directory.\n' +
            'Download from: https://ffmpeg.org/download.html#build-windows'
        );
    }

    /**
     * macOS環境でのFFmpeg検索
     */
    async findMacFFmpeg() {
        const searchPaths = [
            // Homebrew
            '/opt/homebrew/bin/ffmpeg',
            '/usr/local/bin/ffmpeg',
            
            // MacPorts
            '/opt/local/bin/ffmpeg',
            
            // アプリ内蔵
            path.join(process.resourcesPath || '.', 'ffmpeg'),
            
            // システムPATH
            'ffmpeg'
        ];

        for (const ffmpegPath of searchPaths) {
            try {
                if (path.isAbsolute(ffmpegPath)) {
                    await fs.access(ffmpegPath);
                } else {
                    await execAsync(`${ffmpegPath} -version`);
                }
                return ffmpegPath;
            } catch (error) {
                continue;
            }
        }

        throw new Error(
            'FFmpeg not found. Please install FFmpeg via Homebrew:\n' +
            'brew install ffmpeg'
        );
    }

    /**
     * Linux環境でのFFmpeg検索
     */
    async findLinuxFFmpeg() {
        const searchPaths = [
            // 標準的なインストール先
            '/usr/bin/ffmpeg',
            '/usr/local/bin/ffmpeg',
            '/snap/bin/ffmpeg',
            
            // アプリ内蔵
            path.join(__dirname, '../../ffmpeg/ffmpeg'),
            
            // システムPATH
            'ffmpeg'
        ];

        for (const ffmpegPath of searchPaths) {
            try {
                if (path.isAbsolute(ffmpegPath)) {
                    await fs.access(ffmpegPath);
                } else {
                    await execAsync(`${ffmpegPath} -version`);
                }
                return ffmpegPath;
            } catch (error) {
                continue;
            }
        }

        throw new Error(
            'FFmpeg not found. Please install FFmpeg:\n' +
            'Ubuntu/Debian: sudo apt install ffmpeg\n' +
            'CentOS/RHEL: sudo yum install ffmpeg\n' +
            'Arch: sudo pacman -S ffmpeg'
        );
    }

    /**
     * FFmpegバージョン取得
     */
    async getFFmpegVersion() {
        try {
            const { stdout } = await execAsync(`"${this.ffmpegPath}" -version`);
            const match = stdout.match(/ffmpeg version ([^\s]+)/);
            return match ? match[1] : 'Unknown';
        } catch (error) {
            return 'Unknown';
        }
    }

    /**
     * FFmpegプロセス生成
     */
    spawn(args, options = {}) {
        if (!this.isInitialized) {
            throw new Error('FFmpeg not initialized. Call initialize() first.');
        }

        return spawn(this.ffmpegPath, args, options);
    }

    /**
     * FFmpeg利用可能性チェック
     */
    async isAvailable() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * FFmpeg設定情報取得
     */
    getInfo() {
        return {
            path: this.ffmpegPath,
            isInitialized: this.isInitialized,
            platform: this.platform,
            available: this.ffmpegPath !== null
        };
    }

    /**
     * Windows用：FFmpegダウンロードガイド表示
     */
    getWindowsInstallGuide() {
        return {
            title: 'FFmpeg Required',
            message: 'MyRadiko requires FFmpeg for recording functionality.',
            instructions: [
                '1. Download FFmpeg from: https://ffmpeg.org/download.html#build-windows',
                '2. Extract to C:\\ffmpeg\\ or application directory',
                '3. Add to Windows PATH environment variable',
                '4. Restart MyRadiko'
            ],
            alternativeOptions: [
                'Place ffmpeg.exe in the same directory as MyRadiko.exe',
                'Use portable FFmpeg distribution',
                'Install via package manager (Chocolatey, Scoop)'
            ]
        };
    }
}

// シングルトンインスタンス
const ffmpegManager = new FFmpegManager();

module.exports = ffmpegManager;