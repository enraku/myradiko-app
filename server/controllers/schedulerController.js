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

    // スケジュール更新
    async updateSchedules(req, res) {
        try {
            const scheduler = req.app.locals.recordingScheduler;
            await scheduler.updateSchedules();
            
            res.json({
                success: true,
                message: 'Recording schedules updated'
            });
        } catch (error) {
            console.error('Failed to update schedules:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to update schedules',
                message: error.message
            });
        }
    },

    // アクティブな録音一覧取得
    async getActiveRecordings(req, res) {
        try {
            const scheduler = req.app.locals.recordingScheduler;
            const status = scheduler.getStatus();
            
            res.json({
                success: true,
                data: {
                    count: status.activeRecordings,
                    recordings: status.activeRecordingsList
                }
            });
        } catch (error) {
            console.error('Failed to get active recordings:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to get active recordings',
                message: error.message
            });
        }
    },

    // 録音停止
    async stopRecording(req, res) {
        try {
            const { recordingId } = req.params;
            const scheduler = req.app.locals.recordingScheduler;
            
            await scheduler.stopRecording(recordingId);
            
            res.json({
                success: true,
                message: `Recording ${recordingId} stopped successfully`
            });
        } catch (error) {
            console.error('Failed to stop recording:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to stop recording',
                message: error.message
            });
        }
    }
};

module.exports = schedulerController;