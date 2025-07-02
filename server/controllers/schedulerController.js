const schedulerController = {
    // スケジューラーステータス取得
    async getStatus(req, res) {
        try {
            const scheduler = req.app.locals.recordingScheduler;
            const status = scheduler.getStatus();
            
            res.json({
                success: true,
                data: status
            });
        } catch (error) {
            console.error('Failed to get scheduler status:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to get scheduler status',
                message: error.message
            });
        }
    },

    // スケジューラー開始
    async start(req, res) {
        try {
            const scheduler = req.app.locals.recordingScheduler;
            scheduler.start();
            
            res.json({
                success: true,
                message: 'Recording scheduler started'
            });
        } catch (error) {
            console.error('Failed to start scheduler:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to start scheduler',
                message: error.message
            });
        }
    },

    // スケジューラー停止
    async stop(req, res) {
        try {
            const scheduler = req.app.locals.recordingScheduler;
            scheduler.stop();
            
            res.json({
                success: true,
                message: 'Recording scheduler stopped'
            });
        } catch (error) {
            console.error('Failed to stop scheduler:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to stop scheduler',
                message: error.message
            });
        }
    },

    // 予約チェック実行
    async updateSchedules(req, res) {
        try {
            const scheduler = req.app.locals.recordingScheduler;
            await scheduler.checkReservations();
            
            res.json({
                success: true,
                message: 'Recording schedules checked and updated'
            });
        } catch (error) {
            console.error('Failed to check schedules:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to check schedules',
                message: error.message
            });
        }
    },

    // アクティブなダウンロード一覧取得
    async getActiveRecordings(req, res) {
        try {
            const scheduler = req.app.locals.recordingScheduler;
            const activeDownloads = scheduler.getActiveDownloads();
            
            res.json({
                success: true,
                data: {
                    count: activeDownloads.length,
                    downloads: activeDownloads
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
    async stopRecording(req, res) {
        try {
            const { recordingId } = req.params;
            const scheduler = req.app.locals.recordingScheduler;
            
            const result = await scheduler.stopDownload(parseInt(recordingId));
            
            if (result) {
                res.json({
                    success: true,
                    message: `Download for reservation ${recordingId} stopped successfully`
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Download not found',
                    message: `No active download found for reservation ${recordingId}`
                });
            }
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

module.exports = schedulerController;