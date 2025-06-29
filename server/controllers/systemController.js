const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

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
            
            res.json({
                success: true,
                data: {
                    platform: process.platform,
                    recordingsPath,
                    canOpenFolder: ['win32', 'darwin', 'linux'].includes(process.platform)
                }
            });
            
        } catch (error) {
            console.error('Failed to get system info:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to get system info',
                message: error.message
            });
        }
    }
};

module.exports = systemController;