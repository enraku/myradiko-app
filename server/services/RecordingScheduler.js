const cron = require('node-cron');
const Reservations = require('../models/Reservations');
const RecordingHistory = require('../models/RecordingHistory');
const RadikoRecorder = require('./RadikoRecorder');

class RecordingScheduler {
    constructor() {
        this.reservations = new Reservations();
        this.recordingHistory = new RecordingHistory();
        this.radikoRecorder = new RadikoRecorder();
        this.scheduledJobs = new Map();
        this.activeRecordings = new Map();
        this.isRunning = false;
    }

    // スケジューラー開始
    start() {
        if (this.isRunning) {
            console.log('Recording scheduler is already running');
            return;
        }

        console.log('Starting recording scheduler...');
        
        // 毎分チェック
        this.mainJob = cron.schedule('* * * * *', async () => {
            await this.checkScheduledRecordings();
        }, {
            scheduled: false
        });

        // 予約の更新チェック（5分ごと）
        this.updateJob = cron.schedule('*/5 * * * *', async () => {
            await this.updateSchedules();
        }, {
            scheduled: false
        });

        this.mainJob.start();
        this.updateJob.start();
        this.isRunning = true;
        
        console.log('Recording scheduler started successfully');
        
        // 初回の予約更新
        this.updateSchedules();
    }

    // スケジューラー停止
    stop() {
        if (!this.isRunning) {
            console.log('Recording scheduler is not running');
            return;
        }

        console.log('Stopping recording scheduler...');
        
        if (this.mainJob) {
            this.mainJob.stop();
        }
        
        if (this.updateJob) {
            this.updateJob.stop();
        }

        // 進行中の録音を停止
        for (const [recordingId, recording] of this.activeRecordings) {
            this.stopRecording(recordingId);
        }

        this.scheduledJobs.clear();
        this.activeRecordings.clear();
        this.isRunning = false;
        
        console.log('Recording scheduler stopped');
    }

    // 予約スケジュールの更新
    async updateSchedules() {
        try {
            console.log('Updating recording schedules...');
            
            // アクティブな予約を取得
            const activeReservations = await this.reservations.getActive();
            
            // 現在時刻から24時間以内の予約をスケジュール
            const now = new Date();
            const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            
            for (const reservation of activeReservations) {
                await this.scheduleReservation(reservation, now, next24Hours);
            }
            
            console.log(`Updated schedules for ${activeReservations.length} active reservations`);
        } catch (error) {
            console.error('Failed to update schedules:', error);
        }
    }

    // 個別予約のスケジューリング
    async scheduleReservation(reservation, fromTime, toTime) {
        try {
            const scheduleTimes = this.calculateScheduleTimes(reservation, fromTime, toTime);
            
            for (const scheduleTime of scheduleTimes) {
                const jobId = `${reservation.id}_${scheduleTime.getTime()}`;
                
                // 既にスケジュール済みの場合はスキップ
                if (this.scheduledJobs.has(jobId)) {
                    continue;
                }

                // スケジュール時間が過去の場合はスキップ
                if (scheduleTime <= new Date()) {
                    continue;
                }

                console.log(`Scheduling recording: ${reservation.title} at ${scheduleTime.toISOString()}`);
                
                // 録音開始をスケジュール
                const job = cron.schedule(this.toCronExpression(scheduleTime), async () => {
                    await this.startScheduledRecording(reservation, scheduleTime);
                    this.scheduledJobs.delete(jobId);
                }, {
                    scheduled: true,
                    timezone: 'Asia/Tokyo'
                });

                this.scheduledJobs.set(jobId, {
                    job,
                    reservation,
                    scheduleTime
                });
            }
        } catch (error) {
            console.error(`Failed to schedule reservation ${reservation.id}:`, error);
        }
    }

    // 予約時間の計算
    calculateScheduleTimes(reservation, fromTime, toTime) {
        const times = [];
        const startTime = new Date(reservation.start_time);
        
        switch (reservation.repeat_type) {
            case 'none':
                if (startTime >= fromTime && startTime <= toTime) {
                    times.push(startTime);
                }
                break;
                
            case 'daily':
                this.addDailySchedules(times, startTime, fromTime, toTime);
                break;
                
            case 'weekly':
                this.addWeeklySchedules(times, startTime, fromTime, toTime, reservation.repeat_days);
                break;
                
            case 'weekdays':
                this.addWeekdaySchedules(times, startTime, fromTime, toTime);
                break;
        }
        
        return times;
    }

    // 毎日繰り返しのスケジュール追加
    addDailySchedules(times, originalTime, fromTime, toTime) {
        const current = new Date(fromTime);
        current.setHours(originalTime.getHours(), originalTime.getMinutes(), 0, 0);
        
        while (current <= toTime) {
            if (current >= fromTime) {
                times.push(new Date(current));
            }
            current.setDate(current.getDate() + 1);
        }
    }

    // 週単位繰り返しのスケジュール追加
    addWeeklySchedules(times, originalTime, fromTime, toTime, repeatDays) {
        if (!repeatDays) return;
        
        const days = JSON.parse(repeatDays);
        const current = new Date(fromTime);
        
        while (current <= toTime) {
            if (days.includes(current.getDay())) {
                const scheduleTime = new Date(current);
                scheduleTime.setHours(originalTime.getHours(), originalTime.getMinutes(), 0, 0);
                
                if (scheduleTime >= fromTime && scheduleTime <= toTime) {
                    times.push(scheduleTime);
                }
            }
            current.setDate(current.getDate() + 1);
        }
    }

    // 平日繰り返しのスケジュール追加
    addWeekdaySchedules(times, originalTime, fromTime, toTime) {
        const current = new Date(fromTime);
        
        while (current <= toTime) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) { // 月-金
                const scheduleTime = new Date(current);
                scheduleTime.setHours(originalTime.getHours(), originalTime.getMinutes(), 0, 0);
                
                if (scheduleTime >= fromTime && scheduleTime <= toTime) {
                    times.push(scheduleTime);
                }
            }
            current.setDate(current.getDate() + 1);
        }
    }

    // スケジュールされた録音チェック
    async checkScheduledRecordings() {
        const now = new Date();
        
        // 進行中の録音の終了チェック
        for (const [recordingId, recording] of this.activeRecordings) {
            const endTime = new Date(recording.endTime);
            if (now >= endTime) {
                await this.stopRecording(recordingId);
            }
        }
    }

    // スケジュールされた録音開始
    async startScheduledRecording(reservation, scheduleTime) {
        try {
            console.log(`Starting scheduled recording: ${reservation.title}`);
            
            const recordingId = `recording_${reservation.id}_${scheduleTime.getTime()}`;
            const endTime = new Date(reservation.end_time);
            
            // 録音履歴に記録
            const historyData = {
                title: reservation.title,
                station_id: reservation.station_id,
                station_name: reservation.station_name,
                start_time: scheduleTime.toISOString(),
                end_time: endTime.toISOString(),
                status: 'recording',
                reservation_id: reservation.id
            };
            
            const historyId = await this.recordingHistory.create(historyData);
            
            // 録音開始
            const recording = await this.radikoRecorder.startRecording({
                stationId: reservation.station_id,
                duration: Math.floor((endTime - scheduleTime) / 1000),
                title: reservation.title,
                historyId: historyId.lastID
            });
            
            this.activeRecordings.set(recordingId, {
                reservation,
                recording,
                startTime: scheduleTime,
                endTime,
                historyId: historyId.lastID
            });
            
            console.log(`Recording started: ${reservation.title} (ID: ${recordingId})`);
            
        } catch (error) {
            console.error(`Failed to start scheduled recording:`, error);
            
            // エラー時は録音履歴を更新
            try {
                await this.recordingHistory.updateStatus(historyId.lastID, 'failed', error.message);
            } catch (updateError) {
                console.error('Failed to update recording history:', updateError);
            }
        }
    }

    // 録音停止
    async stopRecording(recordingId) {
        try {
            const recording = this.activeRecordings.get(recordingId);
            if (!recording) {
                console.log(`Recording ${recordingId} not found in active recordings`);
                return;
            }
            
            console.log(`Stopping recording: ${recording.reservation.title}`);
            
            // 録音プロセス停止
            await this.radikoRecorder.stopRecording(recording.recording);
            
            // 録音履歴更新
            await this.recordingHistory.updateStatus(recording.historyId, 'completed');
            
            this.activeRecordings.delete(recordingId);
            
            console.log(`Recording stopped: ${recording.reservation.title}`);
            
        } catch (error) {
            console.error(`Failed to stop recording ${recordingId}:`, error);
        }
    }

    // 日時をcron式に変換
    toCronExpression(date) {
        return `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;
    }

    // ステータス取得
    getStatus() {
        return {
            isRunning: this.isRunning,
            scheduledJobs: this.scheduledJobs.size,
            activeRecordings: this.activeRecordings.size,
            activeRecordingsList: Array.from(this.activeRecordings.entries()).map(([id, recording]) => ({
                id,
                title: recording.reservation.title,
                stationName: recording.reservation.station_name,
                startTime: recording.startTime,
                endTime: recording.endTime
            }))
        };
    }
}

module.exports = RecordingScheduler;