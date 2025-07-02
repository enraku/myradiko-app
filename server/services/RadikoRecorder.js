const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const RadikoAPI = require('../utils/RadikoAPI');
const RadikoAuth = require('./RadikoAuth');
const RecordingHistory = require('../models/RecordingHistory');
const Database = require('../models/Database');
const logger = require('./Logger');
const ffmpegManager = require('./FFmpegManager');

class RadikoRecorder {
    constructor() {
        this.radikoAPI = new RadikoAPI();
        this.radikoAuth = new RadikoAuth();
        this.activeRecordings = new Map();
        this.recordingHistory = new RecordingHistory();
        this.database = new Database();
        
        // 録音ディレクトリをDatabaseクラスから取得
        this.recordingsDir = this.database.recordingsDir;
        
        // 録音ディレクトリの作成
        this.ensureRecordingsDirectory();
        
        // FFmpeg初期化
        this.initializeFFmpeg();
    }

    // 録音ディレクトリの確認・作成
    async ensureRecordingsDirectory() {
        try {
            await fs.access(this.recordingsDir);
        } catch (error) {
            if (error.code === 'ENOENT') {
                await fs.mkdir(this.recordingsDir, { recursive: true });
                console.log(`Created recordings directory: ${this.recordingsDir}`);
            } else {
                throw error;
            }
        }
    }

    // FFmpeg初期化
    async initializeFFmpeg() {
        try {
            await ffmpegManager.initialize();
            await logger.recording('info', 'FFmpeg initialized for recording', ffmpegManager.getInfo());
        } catch (error) {
            await logger.recording('error', 'FFmpeg initialization failed', {
                error: error.message,
                platform: process.platform
            });
            
            // Windows環境の場合は詳細ガイドをログに出力
            if (process.platform === 'win32') {
                const guide = ffmpegManager.getWindowsInstallGuide();
                await logger.recording('info', 'Windows FFmpeg installation guide', guide);
            }
        }
    }

    // 録音開始
    async startRecording({ stationId, duration, title, reservationId = null, stationName = null }) {
        let historyId = null;
        
        try {
            console.log(`🎙️ Starting recording: ${title} (Station: ${stationId}, Duration: ${duration}s)`);
            await logger.recording('info', 'Starting recording', {
                title,
                stationId,
                duration,
                reservationId
            });
            
            // ファイル名生成
            const now = new Date();
            const endTime = new Date(now.getTime() + duration * 1000);
            const dateStr = now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
            const filename = `${stationId}_${dateStr}_${this.sanitizeFilename(title)}.m4a`;
            const outputPath = path.join(this.recordingsDir, filename);
            
            // データベースに録音履歴を作成
            try {
                const historyResult = await this.recordingHistory.create({
                    reservation_id: reservationId,
                    title: title,
                    station_id: stationId,
                    station_name: stationName || stationId,
                    start_time: now.toISOString(),
                    end_time: endTime.toISOString(),
                    file_path: outputPath,
                    status: 'recording'
                });
                historyId = historyResult.lastID;
                console.log(`📝 Recording history created with ID: ${historyId}`);
            } catch (dbError) {
                console.error('⚠️ Failed to create recording history:', dbError.message);
                // データベースエラーでも録音は続行
            }
            
            // radiko録音コマンドの準備
            const recordingProcess = await this.startRadikoRecording(stationId, duration, outputPath);
            
            const recording = {
                id: `rec_${historyId || Date.now()}`,
                stationId,
                title,
                filename,
                outputPath,
                process: recordingProcess,
                startTime: now,
                endTime: endTime,
                duration,
                historyId,
                reservationId,
                status: 'recording'
            };
            
            this.activeRecordings.set(recording.id, recording);
            
            // プロセス終了時の処理
            recordingProcess.on('close', async (code) => {
                await this.handleRecordingComplete(recording, code);
            });
            
            recordingProcess.on('error', async (error) => {
                await this.handleRecordingError(recording, error);
            });
            
            console.log(`✅ Recording started successfully: ${recording.id}`);
            return recording;
            
        } catch (error) {
            console.error('❌ Failed to start recording:', error);
            
            // エラー時はデータベースの状態を更新
            if (historyId) {
                try {
                    await this.recordingHistory.updateStatus(historyId, 'failed', error.message);
                } catch (dbError) {
                    console.error('Failed to update recording history status:', dbError.message);
                }
            }
            
            throw error;
        }
    }

    // radiko録音プロセス開始
    async startRadikoRecording(stationId, duration, outputPath) {
        try {
            console.log(`🚀 Starting FFmpeg recording for ${stationId}...`);
            
            // radiko認証
            const authResult = await this.radikoAuth.authenticate();
            if (!authResult.success) {
                throw new Error(`Authentication failed: ${authResult.error}`);
            }
            
            // ストリーミングURL取得
            const streamURL = await this.radikoAuth.getStreamURL(stationId);
            
            // FFmpegコマンド構築
            const args = this.buildFFmpegArgs(streamURL, duration, outputPath);
            
            console.log('🎬 Starting FFmpeg process...');
            console.log(`📁 Output: ${outputPath}`);
            
            // FFmpegプロセス実行
            const process = ffmpegManager.spawn(args, {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            // プロセス監視
            this.setupProcessMonitoring(process, stationId);
            
            return process;
            
        } catch (error) {
            console.error(`❌ Failed to start radiko recording for ${stationId}:`, error.message);
            throw error;
        }
    }

    /**
     * FFmpegコマンド引数の構築
     */
    buildFFmpegArgs(streamURL, duration, outputPath) {
        return [
            '-y', // 既存ファイルを上書き
            '-headers', `X-Radiko-AuthToken: ${this.radikoAuth.authToken}`,
            '-headers', 'Origin: https://radiko.jp',
            '-headers', 'Accept-Encoding: gzip, deflate',
            '-headers', 'Accept-Language: ja,en-US;q=0.8,en;q=0.6',
            '-user_agent', this.radikoAuth.userAgent,
            '-headers', 'Accept: */*',
            '-headers', 'Referer: https://radiko.jp/',
            '-headers', 'Connection: keep-alive',
            '-i', streamURL,
            '-vn', // 映像なし
            '-acodec', 'copy', // 音声コーデックをコピー
            '-t', duration.toString(), // 録音時間
            '-f', 'mp4', // 出力フォーマット
            outputPath
        ];
    }

    /**
     * プロセス監視の設定
     */
    setupProcessMonitoring(process, stationId) {
        process.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(`📹 FFmpeg [${stationId}]: ${output.trim()}`);
        });
        
        process.stderr.on('data', (data) => {
            const output = data.toString();
            // FFmpegの進行状況は stderrに出力される
            if (output.includes('time=') || output.includes('size=')) {
                console.log(`⏱️ Progress [${stationId}]: ${output.trim()}`);
            } else if (output.includes('error') || output.includes('failed')) {
                console.error(`❌ FFmpeg Error [${stationId}]: ${output.trim()}`);
            }
        });
        
        process.on('error', (error) => {
            console.error(`❌ FFmpeg Process Error [${stationId}]:`, error.message);
        });
    }

    // 録音停止
    async stopRecording(recording) {
        try {
            if (!recording || !recording.process) {
                console.log('No recording process to stop');
                return;
            }
            
            console.log(`Stopping recording: ${recording.title}`);
            
            // プロセス終了
            if (!recording.process.killed) {
                recording.process.kill('SIGTERM');
                
                // 強制終了のタイムアウト
                setTimeout(() => {
                    if (!recording.process.killed) {
                        recording.process.kill('SIGKILL');
                    }
                }, 5000);
            }
            
            this.activeRecordings.delete(recording.id);
            
        } catch (error) {
            console.error('Failed to stop recording:', error);
            throw error;
        }
    }

    // 録音完了処理
    async handleRecordingComplete(recording, exitCode) {
        try {
            console.log(`🏁 Recording completed: ${recording.title} (Exit code: ${exitCode})`);
            
            const isSuccess = exitCode === 0;
            recording.status = isSuccess ? 'completed' : 'failed';
            recording.actualEndTime = new Date();
            
            // ファイル存在確認とサイズ取得
            let fileSize = 0;
            try {
                const stats = await fs.stat(recording.outputPath);
                fileSize = stats.size;
                recording.fileSize = fileSize;
                
                if (fileSize > 0) {
                    console.log(`📁 Recording file saved: ${recording.outputPath} (${this.formatFileSize(fileSize)})`);
                } else {
                    console.warn(`⚠️ Recording file is empty: ${recording.outputPath}`);
                    recording.status = 'failed';
                }
            } catch (error) {
                console.error(`❌ Recording file not found: ${recording.outputPath}`);
                recording.status = 'failed';
                fileSize = 0;
            }
            
            // データベース更新
            if (recording.historyId) {
                try {
                    await this.recordingHistory.updateStatus(
                        recording.historyId, 
                        recording.status,
                        recording.status === 'failed' ? 'Recording failed with exit code: ' + exitCode : null
                    );
                    
                    if (fileSize > 0) {
                        await this.recordingHistory.updateFileInfo(
                            recording.historyId,
                            recording.outputPath,
                            fileSize
                        );
                    }
                    
                    console.log(`📝 Database updated for recording: ${recording.historyId}`);
                } catch (dbError) {
                    console.error('⚠️ Failed to update database:', dbError.message);
                }
            }
            
            this.activeRecordings.delete(recording.id);
            console.log(`✅ Recording process completed: ${recording.id}`);
            
        } catch (error) {
            console.error('❌ Failed to handle recording completion:', error);
        }
    }

    // 録音エラー処理
    async handleRecordingError(recording, error) {
        try {
            console.error(`❌ Recording error: ${recording.title}`, error);
            
            recording.status = 'failed';
            recording.error = error.message;
            recording.actualEndTime = new Date();
            
            // データベース更新
            if (recording.historyId) {
                try {
                    await this.recordingHistory.updateStatus(
                        recording.historyId, 
                        'failed',
                        error.message
                    );
                    console.log(`📝 Database updated with error for recording: ${recording.historyId}`);
                } catch (dbError) {
                    console.error('⚠️ Failed to update database with error:', dbError.message);
                }
            }
            
            this.activeRecordings.delete(recording.id);
            
        } catch (handleError) {
            console.error('❌ Failed to handle recording error:', handleError);
        }
    }

    // ファイル名のサニタイズ
    sanitizeFilename(filename) {
        return filename
            .replace(/[<>:"/\\|?*]/g, '_')
            .replace(/\s+/g, '_')
            .substring(0, 100);
    }

    // ファイルサイズのフォーマット
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // アクティブな録音一覧取得
    getActiveRecordings() {
        return Array.from(this.activeRecordings.values()).map(recording => ({
            id: recording.id,
            stationId: recording.stationId,
            title: recording.title,
            filename: recording.filename,
            startTime: recording.startTime,
            duration: recording.duration,
            status: recording.status
        }));
    }

    // 録音停止（ID指定）
    async stopRecordingById(recordingId) {
        const recording = this.activeRecordings.get(recordingId);
        if (recording) {
            await this.stopRecording(recording);
            return true;
        }
        return false;
    }

    // 全録音停止
    async stopAllRecordings() {
        const recordings = Array.from(this.activeRecordings.values());
        
        for (const recording of recordings) {
            await this.stopRecording(recording);
        }
        
        console.log(`Stopped ${recordings.length} active recordings`);
    }

    // 過去番組の即時ダウンロード
    async downloadPastProgram({ stationId, startTime, endTime, title }) {
        try {
            console.log(`Starting download: ${title} (Station: ${stationId})`);
            
            // 時刻の検証
            const start = new Date(startTime);
            const end = new Date(endTime);
            const now = new Date();
            
            if (end >= now) {
                throw new Error('この番組はまだ終了していません');
            }
            
            // radikoの仕様上、1週間以内の番組のみダウンロード可能
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (start < oneWeekAgo) {
                throw new Error('この番組は配信期間を過ぎています（1週間以内の番組のみダウンロード可能）');
            }
            
            // ファイル名生成
            const dateStr = start.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
            const filename = `${stationId}_${dateStr}_${this.sanitizeFilename(title)}.m4a`;
            const outputPath = path.join(this.recordingsDir, filename);
            
            // タイムシフト録音コマンドの準備
            const downloadProcess = await this.startRadikoTimeshiftDownload(stationId, start, end, outputPath);
            
            const download = {
                id: `download_${Date.now()}`,
                stationId,
                title,
                filename,
                outputPath,
                process: downloadProcess,
                startTime: start,
                endTime: end,
                status: 'downloading'
            };
            
            this.activeRecordings.set(download.id, download);
            
            return download;
            
        } catch (error) {
            console.error('Failed to start download:', error);
            throw error;
        }
    }

    // radikoタイムシフトダウンロード開始
    async startRadikoTimeshiftDownload(stationId, startTime, endTime, outputPath) {
        try {
            console.log(`📻 Starting timeshift download for ${stationId}...`);
            console.log(`⏰ Time: ${startTime.toISOString()} - ${endTime.toISOString()}`);
            
            // radiko認証
            const authResult = await this.radikoAuth.authenticate();
            if (!authResult.success) {
                throw new Error(`Authentication failed: ${authResult.error}`);
            }
            
            // タイムシフトストリーミングURL取得
            const streamURL = await this.radikoAuth.getTimeshiftStreamURL(stationId, startTime, endTime);
            
            // 録音時間を計算
            const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
            
            // FFmpegコマンド構築
            const args = this.buildFFmpegArgs(streamURL, duration, outputPath);
            
            console.log('🎬 Starting FFmpeg timeshift process...');
            console.log(`📁 Output: ${outputPath}`);
            
            // FFmpegプロセス実行
            const process = ffmpegManager.spawn(args, {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            // プロセス監視
            this.setupProcessMonitoring(process, `${stationId}-timeshift`);
            
            return process;
            
        } catch (error) {
            console.error(`❌ Failed to start timeshift download for ${stationId}:`, error.message);
            throw error;
        }
    }
}

module.exports = RadikoRecorder;