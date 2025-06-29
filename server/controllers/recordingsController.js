const RecordingHistory = require('../models/RecordingHistory');

const recordingHistory = new RecordingHistory();

const recordingsController = {
    // 全録音履歴取得
    async getAll(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 100;
            
            console.log(`Fetching all recordings (limit: ${limit})`);
            const data = await recordingHistory.getAll(limit);
            
            res.json({
                success: true,
                data: data,
                count: data.length,
                limit: limit
            });
        } catch (error) {
            console.error('Failed to fetch recordings:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch recordings',
                message: error.message
            });
        }
    },

    // 録音履歴詳細取得
    async getById(req, res) {
        try {
            const { id } = req.params;
            
            console.log(`Fetching recording: ${id}`);
            const recording = await recordingHistory.getById(id);
            
            if (!recording) {
                return res.status(404).json({
                    success: false,
                    error: 'Recording not found',
                    message: `Recording with ID ${id} does not exist`
                });
            }
            
            res.json({
                success: true,
                data: recording
            });
        } catch (error) {
            console.error('Failed to fetch recording:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch recording',
                message: error.message
            });
        }
    },

    // 最近の録音履歴取得
    async getRecent(req, res) {
        try {
            const { days } = req.params;
            const limitDays = parseInt(days) || 7;
            
            console.log(`Fetching recent recordings (${limitDays} days)`);
            const data = await recordingHistory.getRecent(limitDays);
            
            res.json({
                success: true,
                data: data,
                count: data.length,
                limitDays: limitDays
            });
        } catch (error) {
            console.error('Failed to fetch recent recordings:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch recent recordings',
                message: error.message
            });
        }
    },

    // 録音履歴削除
    async delete(req, res) {
        try {
            const { id } = req.params;
            
            console.log(`Deleting recording: ${id}`);
            const result = await recordingHistory.delete(id);
            
            if (result.changes === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Recording not found',
                    message: `Recording with ID ${id} does not exist`
                });
            }
            
            res.json({
                success: true,
                message: 'Recording deleted successfully'
            });
        } catch (error) {
            console.error('Failed to delete recording:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to delete recording',
                message: error.message
            });
        }
    },

    // 録音開始（将来の実装用）
    async startRecording(req, res) {
        try {
            const { id } = req.params;
            
            console.log(`Manual recording start requested: ${id}`);
            
            // TODO: 実際の録音開始処理を実装
            
            res.json({
                success: true,
                message: 'Recording start requested',
                note: 'This feature will be implemented in the recording system phase'
            });
        } catch (error) {
            console.error('Failed to start recording:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to start recording',
                message: error.message
            });
        }
    },

    // 録音停止（将来の実装用）
    async stopRecording(req, res) {
        try {
            const { id } = req.params;
            
            console.log(`Manual recording stop requested: ${id}`);
            
            // TODO: 実際の録音停止処理を実装
            
            res.json({
                success: true,
                message: 'Recording stop requested',
                note: 'This feature will be implemented in the recording system phase'
            });
        } catch (error) {
            console.error('Failed to stop recording:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to stop recording',
                message: error.message
            });
        }
    },

    // 録音ファイル再生
    async playRecording(req, res) {
        try {
            const { id } = req.params;
            
            console.log(`Playing recording: ${id}`);
            const recording = await recordingHistory.getById(id);
            
            if (!recording) {
                return res.status(404).json({
                    success: false,
                    error: 'Recording not found',
                    message: `Recording with ID ${id} does not exist`
                });
            }
            
            if (recording.status !== 'completed' || !recording.file_path) {
                return res.status(400).json({
                    success: false,
                    error: 'Recording file not available',
                    message: 'This recording cannot be played'
                });
            }
            
            // ファイル存在確認
            const fs = require('fs');
            const path = require('path');
            const filePath = path.resolve(recording.file_path);
            
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    error: 'File not found',
                    message: 'Recording file does not exist on disk'
                });
            }
            
            // ファイルストリーミング
            const stat = fs.statSync(filePath);
            const range = req.headers.range;
            
            if (range) {
                // Range request対応（シーク機能）
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
                const chunksize = (end - start) + 1;
                
                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${stat.size}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': 'audio/mp4'
                });
                
                const stream = fs.createReadStream(filePath, { start, end });
                stream.pipe(res);
            } else {
                // 通常のストリーミング
                res.writeHead(200, {
                    'Content-Length': stat.size,
                    'Content-Type': 'audio/mp4',
                    'Accept-Ranges': 'bytes'
                });
                
                const stream = fs.createReadStream(filePath);
                stream.pipe(res);
            }
            
        } catch (error) {
            console.error('Failed to play recording:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to play recording',
                message: error.message
            });
        }
    },

    // 録音ファイルダウンロード
    async downloadRecording(req, res) {
        try {
            const { id } = req.params;
            
            console.log(`Downloading recording: ${id}`);
            const recording = await recordingHistory.getById(id);
            
            if (!recording) {
                return res.status(404).json({
                    success: false,
                    error: 'Recording not found',
                    message: `Recording with ID ${id} does not exist`
                });
            }
            
            if (recording.status !== 'completed' || !recording.file_path) {
                return res.status(400).json({
                    success: false,
                    error: 'Recording file not available',
                    message: 'This recording cannot be downloaded'
                });
            }
            
            // ファイル存在確認
            const fs = require('fs');
            const path = require('path');
            const filePath = path.resolve(recording.file_path);
            
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    error: 'File not found',
                    message: 'Recording file does not exist on disk'
                });
            }
            
            // ダウンロード用ファイル名生成
            const sanitizedTitle = recording.title.replace(/[<>:"/\\|?*]/g, '_');
            const filename = `${sanitizedTitle}_${recording.station_name}.m4a`;
            
            // ダウンロードヘッダー設定
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
            res.setHeader('Content-Type', 'audio/mp4');
            
            // ファイルストリーミング
            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
            
        } catch (error) {
            console.error('Failed to download recording:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to download recording',
                message: error.message
            });
        }
    }
};

module.exports = recordingsController;