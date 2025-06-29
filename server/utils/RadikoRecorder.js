const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');

// FFmpegのパスを設定
ffmpeg.setFfmpegPath(ffmpegStatic);

class RadikoRecorder {
  constructor() {
    this.outputDir = path.join(__dirname, '../../recordings');
    this.tempDir = path.join(__dirname, '../../temp');
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * radikoの認証トークンを取得
   */
  async getAuthToken() {
    try {
      // 1. auth1 - 基本認証
      const auth1Response = await axios.post('https://radiko.jp/v2/api/auth1', '', {
        headers: {
          'User-Agent': 'curl/7.64.1',
          'Accept': '*/*',
          'X-Radiko-App': 'pc_html5',
          'X-Radiko-App-Version': '0.0.1',
          'X-Radiko-User': 'dummy_user',
          'X-Radiko-Device': 'pc'
        }
      });

      const authToken = auth1Response.headers['x-radiko-authtoken'];
      const keyLength = auth1Response.headers['x-radiko-keylength'];
      const keyOffset = auth1Response.headers['x-radiko-keyoffset'];

      if (!authToken) {
        throw new Error('認証トークンの取得に失敗しました');
      }

      // 2. auth2 - 部分キー生成（簡略化版）
      const auth2Response = await axios.post('https://radiko.jp/v2/api/auth2', '', {
        headers: {
          'User-Agent': 'curl/7.64.1',
          'Accept': '*/*',
          'X-Radiko-App': 'pc_html5',
          'X-Radiko-App-Version': '0.0.1',
          'X-Radiko-User': 'dummy_user',
          'X-Radiko-Device': 'pc',
          'X-Radiko-Authtoken': authToken,
          'X-Radiko-Partialkey': 'bcd151073c03b352e1ef2fd66c32209da9628369'
        }
      });

      return authToken;
    } catch (error) {
      console.error('認証エラー:', error.message);
      throw new Error('radiko認証に失敗しました');
    }
  }

  /**
   * 番組の録音用ストリームURLを取得
   */
  async getStreamUrl(stationId, startTime, duration, authToken) {
    try {
      const response = await axios.get(`https://radiko.jp/v2/api/ts/playlist.m3u8`, {
        params: {
          station_id: stationId,
          l: '15',
          lsid: 'xxx',
          type: 'b'
        },
        headers: {
          'User-Agent': 'curl/7.64.1',
          'Accept': '*/*',
          'X-Radiko-App': 'pc_html5',
          'X-Radiko-App-Version': '0.0.1',
          'X-Radiko-User': 'dummy_user',
          'X-Radiko-Device': 'pc',
          'X-Radiko-Authtoken': authToken
        }
      });

      // プレイリストからストリームURLを解析
      const playlist = response.data;
      const lines = playlist.split('\n');
      const streamUrl = lines.find(line => line.startsWith('https://'));

      if (!streamUrl) {
        throw new Error('ストリームURLの取得に失敗しました');
      }

      return streamUrl.trim();
    } catch (error) {
      console.error('ストリームURL取得エラー:', error.message);
      throw new Error('ストリームURLの取得に失敗しました');
    }
  }

  /**
   * タイムフリー録音用のストリームURLを取得
   */
  async getTimefreeStreamUrl(stationId, startTime, duration, authToken) {
    try {
      // タイムフリー用のAPIエンドポイント
      const response = await axios.get(`https://radiko.jp/v2/api/ts/chunklist_pc.m3u8`, {
        params: {
          station_id: stationId,
          start_at: startTime,
          dur: duration,
          l: '15',
          lsid: 'xxx',
          type: 'b'
        },
        headers: {
          'User-Agent': 'curl/7.64.1',
          'Accept': '*/*',
          'X-Radiko-App': 'pc_html5',
          'X-Radiko-App-Version': '0.0.1',
          'X-Radiko-User': 'dummy_user',
          'X-Radiko-Device': 'pc',
          'X-Radiko-Authtoken': authToken
        }
      });

      return response.data;
    } catch (error) {
      console.error('タイムフリーストリームURL取得エラー:', error.message);
      throw new Error('タイムフリーストリームURLの取得に失敗しました');
    }
  }

  /**
   * 番組を録音してMP3ファイルとして保存
   */
  async recordProgram(programInfo, options = {}) {
    const {
      station_id,
      title,
      start_time,
      end_time,
      duration = 1800 // デフォルト30分
    } = programInfo;

    const outputFileName = this.generateFileName(title, station_id, start_time);
    const outputPath = path.join(this.outputDir, outputFileName);
    const tempPath = path.join(this.tempDir, `temp_${Date.now()}.aac`);

    try {
      console.log(`録音開始: ${title} (${station_id})`);
      
      // 認証トークン取得
      const authToken = await this.getAuthToken();
      
      // ストリームURL取得（タイムフリー）
      const streamUrl = await this.getTimefreeStreamUrl(
        station_id,
        start_time,
        Math.ceil(duration / 60), // 分単位に変換
        authToken
      );

      // FFmpegで録音・変換
      await this.downloadAndConvert(streamUrl, tempPath, outputPath, duration, authToken);

      // 一時ファイル削除
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }

      console.log(`録音完了: ${outputPath}`);
      return {
        success: true,
        filePath: outputPath,
        fileName: outputFileName,
        fileSize: fs.statSync(outputPath).size
      };

    } catch (error) {
      console.error(`録音エラー (${title}):`, error.message);
      
      // エラー時の清掃
      [tempPath, outputPath].forEach(filePath => {
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (cleanupError) {
            console.error('ファイル削除エラー:', cleanupError.message);
          }
        }
      });

      throw error;
    }
  }

  /**
   * FFmpegを使用してダウンロード・変換
   */
  async downloadAndConvert(streamUrl, tempPath, outputPath, duration, authToken) {
    return new Promise((resolve, reject) => {
      const command = ffmpeg()
        .input(streamUrl)
        .inputOptions([
          '-headers', `X-Radiko-Authtoken: ${authToken}`,
          '-user_agent', 'curl/7.64.1'
        ])
        .duration(duration)
        .audioCodec('libmp3lame')
        .audioBitrate('128k')
        .audioFrequency(44100)
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg開始:', commandLine);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`変換進行: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          console.log('FFmpeg変換完了');
          resolve();
        })
        .on('error', (err, stdout, stderr) => {
          console.error('FFmpegエラー:', err.message);
          console.error('stderr:', stderr);
          reject(new Error(`録音・変換に失敗しました: ${err.message}`));
        });

      command.run();
    });
  }

  /**
   * ファイル名生成
   */
  generateFileName(title, stationId, startTime) {
    // 安全なファイル名に変換
    const safeTitle = title
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    const dateStr = startTime.substring(0, 8); // YYYYMMDD
    const timeStr = startTime.substring(8, 12); // HHMM

    return `${dateStr}_${timeStr}_${stationId}_${safeTitle}.mp3`;
  }

  /**
   * 録音ディレクトリの情報取得
   */
  getRecordingInfo() {
    const files = fs.readdirSync(this.outputDir);
    const recordings = files
      .filter(file => file.endsWith('.mp3'))
      .map(file => {
        const filePath = path.join(this.outputDir, file);
        const stats = fs.statSync(filePath);
        return {
          fileName: file,
          filePath: filePath,
          fileSize: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    return {
      outputDir: this.outputDir,
      totalFiles: recordings.length,
      totalSize: recordings.reduce((sum, file) => sum + file.fileSize, 0),
      recordings: recordings
    };
  }

  /**
   * 録音ファイルの削除
   */
  deleteRecording(fileName) {
    const filePath = path.join(this.outputDir, fileName);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('ファイルが見つかりません');
    }

    fs.unlinkSync(filePath);
    console.log(`録音ファイル削除: ${fileName}`);
    
    return { success: true, message: 'ファイルを削除しました' };
  }
}

module.exports = RadikoRecorder;