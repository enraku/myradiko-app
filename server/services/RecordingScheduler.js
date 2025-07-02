const cron = require('node-cron');
const Reservations = require('../models/Reservations');
const RecordingHistory = require('../models/RecordingHistory');
const RadikoRecorder = require('./RadikoRecorder');
const logger = require('./Logger');

class RecordingScheduler {
    constructor() {
        this.reservations = new Reservations();
        this.recordingHistory = new RecordingHistory();
        this.radikoRecorder = new RadikoRecorder();
        this.activeDownloads = new Map();
        this.isRunning = false;
        this.mainCronJob = null;
    }

    /**
     * スケジューラー開始
     */
    async start() {
        if (this.isRunning) {
            console.log('⚠️ Scheduler is already running');
            return;
        }

        console.log('🚀 Starting Recording Scheduler...');
        await logger.scheduler('info', 'Recording Scheduler starting');
        
        // メインのcronジョブを設定（毎分実行）
        this.mainCronJob = cron.schedule('* * * * *', async () => {
            try {
                await this.checkReservations();
            } catch (error) {
                console.error('❌ Error in scheduler main loop:', error.message);
                await logger.scheduler('error', 'Scheduler main loop error', {
                    error: error.message,
                    stack: error.stack
                });
            }
        });

        this.isRunning = true;
        console.log('✅ Recording Scheduler started');
        
        // 初回実行
        this.checkReservations();
    }

    /**
     * スケジューラー停止
     */
    stop() {
        if (!this.isRunning) {
            console.log('⚠️ Scheduler is not running');
            return;
        }

        console.log('🛑 Stopping Recording Scheduler...');
        
        // メインcronジョブを停止
        if (this.mainCronJob) {
            this.mainCronJob.destroy();
            this.mainCronJob = null;
        }

        // アクティブなダウンロードを停止
        this.stopAllDownloads();

        this.isRunning = false;
        console.log('✅ Recording Scheduler stopped');
    }

    /**
     * 予約チェック（メインループ）
     */
    async checkReservations() {
        try {
            console.log('🔍 Checking reservations...');
            
            // アクティブな予約を取得
            const activeReservations = await this.reservations.getActive();
            
            if (activeReservations.length === 0) {
                console.log('📝 No active reservations found');
                return;
            }

            console.log(`📋 Found ${activeReservations.length} active reservations`);
            
            const now = new Date();
            let processedCount = 0;

            for (const reservation of activeReservations) {
                try {
                    const endTime = new Date(reservation.end_time);
                    
                    // 番組終了時刻を過ぎているかチェック
                    if (endTime <= now) {
                        await this.processCompletedReservation(reservation);
                        processedCount++;
                    } else {
                        // まだ終了していない番組はログ出力のみ
                        const remainingMinutes = Math.ceil((endTime.getTime() - now.getTime()) / (1000 * 60));
                        console.log(`⏳ Waiting for "${reservation.title}" (${remainingMinutes} minutes remaining)`);
                    }
                } catch (error) {
                    console.error(`❌ Error processing reservation ${reservation.id}:`, error.message);
                }
            }

            if (processedCount > 0) {
                console.log(`✅ Processed ${processedCount} completed reservations`);
            }
            
        } catch (error) {
            console.error('❌ Error in checkReservations:', error.message);
        }
    }

    /**
     * 完了した予約の処理
     */
    async processCompletedReservation(reservation) {
        try {
            console.log(`📻 Processing completed reservation: "${reservation.title}"`);
            
            const startTime = new Date(reservation.start_time);
            const endTime = new Date(reservation.end_time);
            const now = new Date();
            
            // 1週間以内の番組のみダウンロード可能
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (startTime < oneWeekAgo) {
                console.warn(`⚠️ Reservation "${reservation.title}" is too old for download (>1 week)`);
                await this.recordingHistory.create({
                    reservation_id: reservation.id,
                    title: reservation.title,
                    station_id: reservation.station_id,
                    station_name: reservation.station_name,
                    start_time: reservation.start_time,
                    end_time: reservation.end_time,
                    file_path: '',
                    status: 'failed'
                });
                
                // 予約を無効化
                await this.reservations.update(reservation.id, { is_active: false });
                return;
            }

            // 既に録音済みかチェック
            const existingRecordings = await this.recordingHistory.getByStatus('completed');
            const alreadyRecorded = existingRecordings.find(rec => 
                rec.reservation_id === reservation.id
            );
            
            if (alreadyRecorded) {
                console.log(`✅ Reservation "${reservation.title}" already completed`);
                return;
            }

            // ダウンロード実行
            await this.startDownload(reservation);
            
        } catch (error) {
            console.error(`❌ Error processing completed reservation:`, error.message);
        }
    }

    /**
     * ダウンロード開始
     */
    async startDownload(reservation) {
        try {
            console.log(`⬇️ Starting download: "${reservation.title}"`);
            
            // 既にダウンロード中かチェック
            if (this.activeDownloads.has(reservation.id)) {
                console.log(`⚠️ Download already in progress for reservation ${reservation.id}`);
                return;
            }

            const downloadParams = {
                stationId: reservation.station_id,
                startTime: new Date(reservation.start_time),
                endTime: new Date(reservation.end_time),
                title: reservation.title
            };

            // RadikoRecorderでダウンロード開始
            const download = await this.radikoRecorder.downloadPastProgram(downloadParams);
            
            // アクティブダウンロードリストに追加
            this.activeDownloads.set(reservation.id, {
                reservationId: reservation.id,
                download: download,
                reservation: reservation
            });

            console.log(`✅ Download started for "${reservation.title}" (Download ID: ${download.id})`);

            // ダウンロード完了/エラー時の処理
            download.process.on('close', async (code) => {
                await this.handleDownloadComplete(reservation.id, code);
            });

            download.process.on('error', async (error) => {
                await this.handleDownloadError(reservation.id, error);
            });

        } catch (error) {
            console.error(`❌ Failed to start download for "${reservation.title}":`, error.message);
            
            // エラーを録音履歴に記録
            await this.recordingHistory.create({
                reservation_id: reservation.id,
                title: reservation.title,
                station_id: reservation.station_id,
                station_name: reservation.station_name,
                start_time: reservation.start_time,
                end_time: reservation.end_time,
                file_path: '',
                status: 'failed'
            });
        }
    }

    /**
     * ダウンロード完了処理
     */
    async handleDownloadComplete(reservationId, exitCode) {
        try {
            const activeDownload = this.activeDownloads.get(reservationId);
            if (!activeDownload) {
                console.warn(`⚠️ No active download found for reservation ${reservationId}`);
                return;
            }

            const { reservation, download } = activeDownload;
            const isSuccess = exitCode === 0;

            console.log(`🏁 Download completed for "${reservation.title}" (Exit code: ${exitCode})`);

            if (isSuccess) {
                console.log(`✅ Successfully downloaded: "${reservation.title}"`);
                
                // 繰り返し予約でない場合は予約を無効化
                if (reservation.repeat_type === 'none') {
                    await this.reservations.update(reservationId, { is_active: false });
                    console.log(`📝 Reservation ${reservationId} marked as inactive`);
                }
            } else {
                console.error(`❌ Download failed for "${reservation.title}"`);
            }

            // アクティブダウンロードリストから削除
            this.activeDownloads.delete(reservationId);

        } catch (error) {
            console.error(`❌ Error handling download completion:`, error.message);
        }
    }

    /**
     * ダウンロードエラー処理
     */
    async handleDownloadError(reservationId, error) {
        try {
            const activeDownload = this.activeDownloads.get(reservationId);
            if (!activeDownload) {
                console.warn(`⚠️ No active download found for reservation ${reservationId}`);
                return;
            }

            const { reservation } = activeDownload;
            console.error(`❌ Download error for "${reservation.title}":`, error.message);

            // アクティブダウンロードリストから削除
            this.activeDownloads.delete(reservationId);

        } catch (handleError) {
            console.error(`❌ Error handling download error:`, handleError.message);
        }
    }

    /**
     * 即座に録音/ダウンロードを実行
     */
    async executeImmediateRecording(reservation) {
        try {
            const now = new Date();
            const endTime = new Date(reservation.end_time);

            if (endTime <= now) {
                // 過去番組 → ダウンロード
                console.log(`📻 Executing immediate download for past program: "${reservation.title}"`);
                await this.startDownload(reservation);
            } else {
                // 未来番組 → 予約として追加
                console.log(`📅 Program "${reservation.title}" scheduled for future download`);
                console.log(`⏰ Will be downloaded after: ${endTime.toISOString()}`);
            }
        } catch (error) {
            console.error(`❌ Error in immediate recording execution:`, error.message);
            throw error;
        }
    }

    /**
     * 全ダウンロード停止
     */
    stopAllDownloads() {
        console.log('🛑 Stopping all active downloads...');
        
        for (const [reservationId, activeDownload] of this.activeDownloads) {
            try {
                if (activeDownload.download && activeDownload.download.process) {
                    activeDownload.download.process.kill('SIGTERM');
                }
            } catch (error) {
                console.error(`❌ Error stopping download for reservation ${reservationId}:`, error.message);
            }
        }
        
        this.activeDownloads.clear();
        console.log('✅ All downloads stopped');
    }

    /**
     * 状態取得
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            activeDownloads: this.activeDownloads.size,
            downloadList: Array.from(this.activeDownloads.values()).map(item => ({
                reservationId: item.reservationId,
                title: item.reservation.title,
                stationId: item.reservation.station_id,
                startTime: item.reservation.start_time,
                endTime: item.reservation.end_time
            }))
        };
    }

    /**
     * 特定のダウンロードを停止
     */
    async stopDownload(reservationId) {
        const activeDownload = this.activeDownloads.get(reservationId);
        if (!activeDownload) {
            return false;
        }

        try {
            if (activeDownload.download && activeDownload.download.process) {
                activeDownload.download.process.kill('SIGTERM');
            }
            this.activeDownloads.delete(reservationId);
            console.log(`🛑 Download stopped for reservation: ${reservationId}`);
            return true;
        } catch (error) {
            console.error(`❌ Error stopping download:`, error.message);
            return false;
        }
    }

    /**
     * アクティブダウンロード一覧取得
     */
    getActiveDownloads() {
        return Array.from(this.activeDownloads.values()).map(item => ({
            reservationId: item.reservationId,
            downloadId: item.download.id,
            title: item.reservation.title,
            stationId: item.reservation.station_id,
            stationName: item.reservation.station_name,
            startTime: item.reservation.start_time,
            endTime: item.reservation.end_time,
            status: item.download.status
        }));
    }
}

module.exports = RecordingScheduler;