const RadikoRecorder = require('../services/RadikoRecorder');
const RecordingHistory = require('../models/RecordingHistory');

const downloadController = {
    // 過去番組の即時ダウンロード
    async downloadPastProgram(req, res) {
        try {
            const { stationId, startTime, endTime, title, stationName } = req.body;
            
            if (!stationId || !startTime || !endTime || !title) {
                return res.status(400).json({
                    success: false,
                    error: 'Required fields missing',
                    message: 'stationId, startTime, endTime, and title are required'
                });
            }
            
            const recorder = new RadikoRecorder();
            const recordingHistory = new RecordingHistory();
            
            // 録音履歴に記録
            const historyData = {
                title,
                station_id: stationId,
                station_name: stationName || stationId,
                start_time: startTime,
                end_time: endTime,
                status: 'downloading',
                type: 'download'
            };
            
            const historyId = await recordingHistory.create(historyData);
            
            // ダウンロード開始
            const download = await recorder.downloadPastProgram({
                stationId,
                startTime,
                endTime,
                title
            });
            
            res.json({
                success: true,
                message: 'Download started successfully',
                data: {
                    downloadId: download.id,
                    historyId: historyId.lastID,
                    filename: download.filename,
                    status: download.status
                }
            });
            
        } catch (error) {
            console.error('Failed to start download:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to start download',
                message: error.message
            });
        }
    },

    // ダウンロード状況確認
    async getDownloadStatus(req, res) {
        try {
            const { downloadId } = req.params;
            const recorder = new RadikoRecorder();
            
            const activeRecordings = recorder.getActiveRecordings();
            const download = activeRecordings.find(rec => rec.id === downloadId);
            
            if (!download) {
                return res.status(404).json({
                    success: false,
                    error: 'Download not found',
                    message: `Download ${downloadId} not found`
                });
            }
            
            res.json({
                success: true,
                data: download
            });
            
        } catch (error) {
            console.error('Failed to get download status:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to get download status',
                message: error.message
            });
        }
    },

    // アクティブなダウンロード一覧
    async getActiveDownloads(req, res) {
        try {
            const recorder = new RadikoRecorder();
            const activeRecordings = recorder.getActiveRecordings();
            
            // ダウンロードのみをフィルター
            const downloads = activeRecordings.filter(rec => 
                rec.id.startsWith('download_') || rec.status === 'downloading'
            );
            
            res.json({
                success: true,
                data: {
                    count: downloads.length,
                    downloads
                }
            });
            
        } catch (error) {
            console.error('Failed to get active downloads:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to get active downloads',
                message: error.message
            });
        }
    },

    // ダウンロード停止
    async stopDownload(req, res) {
        try {
            const { downloadId } = req.params;
            const recorder = new RadikoRecorder();
            
            const stopped = await recorder.stopRecordingById(downloadId);
            
            if (!stopped) {
                return res.status(404).json({
                    success: false,
                    error: 'Download not found',
                    message: `Download ${downloadId} not found or already stopped`
                });
            }
            
            res.json({
                success: true,
                message: `Download ${downloadId} stopped successfully`
            });
            
        } catch (error) {
            console.error('Failed to stop download:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to stop download',
                message: error.message
            });
        }
    }
};

module.exports = downloadController;