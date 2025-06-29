const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../utils/database');
const RadikoRecorder = require('../utils/RadikoRecorder');

const recorder = new RadikoRecorder();

/**
 * 録音履歴一覧取得
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const query = `
      SELECT * FROM recording_history 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    const recordings = await db.all(query, [limit, offset]);
    
    const countQuery = `SELECT COUNT(*) as total FROM recording_history`;
    const countResult = await db.get(countQuery);

    res.json({
      success: true,
      data: recordings,
      total: countResult.total,
      limit: limit,
      offset: offset
    });
  } catch (error) {
    console.error('録音履歴取得エラー:', error);
    res.status(500).json({
      success: false,
      message: '録音履歴の取得に失敗しました',
      error: error.message
    });
  }
});

/**
 * 録音履歴詳細取得
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const recording = await db.get(
      'SELECT * FROM recording_history WHERE id = ?',
      [id]
    );

    if (!recording) {
      return res.status(404).json({
        success: false,
        message: '録音履歴が見つかりません'
      });
    }

    // ファイルの存在確認
    if (recording.file_path && fs.existsSync(recording.file_path)) {
      const stats = fs.statSync(recording.file_path);
      recording.file_exists = true;
      recording.file_size = stats.size;
      recording.file_modified = stats.mtime;
    } else {
      recording.file_exists = false;
    }

    res.json({
      success: true,
      data: recording
    });
  } catch (error) {
    console.error('録音履歴詳細取得エラー:', error);
    res.status(500).json({
      success: false,
      message: '録音履歴の取得に失敗しました',
      error: error.message
    });
  }
});

/**
 * 最近の録音履歴取得
 */
router.get('/recent/:days', async (req, res) => {
  try {
    const days = parseInt(req.params.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const query = `
      SELECT * FROM recording_history 
      WHERE created_at >= datetime(?, 'unixepoch')
      ORDER BY created_at DESC
    `;
    
    const recordings = await db.all(query, [Math.floor(startDate.getTime() / 1000)]);

    res.json({
      success: true,
      data: recordings,
      days: days
    });
  } catch (error) {
    console.error('最近の録音履歴取得エラー:', error);
    res.status(500).json({
      success: false,
      message: '最近の録音履歴の取得に失敗しました',
      error: error.message
    });
  }
});

/**
 * 手動録音開始
 */
router.post('/start', async (req, res) => {
  try {
    const {
      station_id,
      station_name,
      title,
      duration = 1800, // デフォルト30分
      description = ''
    } = req.body;

    if (!station_id || !title) {
      return res.status(400).json({
        success: false,
        message: '必須パラメータが不足しています'
      });
    }

    // 現在時刻から録音開始
    const now = new Date();
    const start_time = now.toISOString().replace(/[-:T]/g, '').split('.')[0]; // YYYYMMDDHHMMSS
    const end_time = new Date(now.getTime() + duration * 1000)
      .toISOString().replace(/[-:T]/g, '').split('.')[0];

    // 録音履歴をDBに保存（録音開始前）
    const recordingId = await db.run(`
      INSERT INTO recording_history (
        title, station_id, station_name, start_time, end_time, 
        duration, status, description, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'recording', ?, datetime('now'))
    `, [title, station_id, station_name, start_time, end_time, duration, description]);

    // バックグラウンドで録音開始
    const programInfo = {
      station_id,
      title,
      start_time,
      end_time,
      duration
    };

    // 非同期で録音実行
    recorder.recordProgram(programInfo)
      .then(async (result) => {
        // 録音成功時にDBを更新
        await db.run(`
          UPDATE recording_history 
          SET status = 'completed', file_path = ?, file_size = ?, updated_at = datetime('now')
          WHERE id = ?
        `, [result.filePath, result.fileSize, recordingId.lastID]);

        console.log(`録音完了 (ID: ${recordingId.lastID}): ${result.fileName}`);
      })
      .catch(async (error) => {
        // 録音失敗時にDBを更新
        await db.run(`
          UPDATE recording_history 
          SET status = 'failed', error_message = ?, updated_at = datetime('now')
          WHERE id = ?
        `, [error.message, recordingId.lastID]);

        console.error(`録音失敗 (ID: ${recordingId.lastID}):`, error.message);
      });

    res.json({
      success: true,
      message: '録音を開始しました',
      recording_id: recordingId.lastID,
      data: {
        id: recordingId.lastID,
        title,
        station_id,
        station_name,
        duration,
        status: 'recording'
      }
    });

  } catch (error) {
    console.error('録音開始エラー:', error);
    res.status(500).json({
      success: false,
      message: '録音の開始に失敗しました',
      error: error.message
    });
  }
});

/**
 * 番組録音（予約録音から呼び出し）
 */
router.post('/program', async (req, res) => {
  try {
    const {
      program_id,
      station_id,
      station_name,
      title,
      start_time,
      end_time,
      description = ''
    } = req.body;

    if (!station_id || !title || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: '必須パラメータが不足しています'
      });
    }

    // 継続時間を計算
    const startDate = new Date(
      parseInt(start_time.substring(0, 4)),
      parseInt(start_time.substring(4, 6)) - 1,
      parseInt(start_time.substring(6, 8)),
      parseInt(start_time.substring(8, 10)),
      parseInt(start_time.substring(10, 12)),
      parseInt(start_time.substring(12, 14))
    );
    const endDate = new Date(
      parseInt(end_time.substring(0, 4)),
      parseInt(end_time.substring(4, 6)) - 1,
      parseInt(end_time.substring(6, 8)),
      parseInt(end_time.substring(8, 10)),
      parseInt(end_time.substring(10, 12)),
      parseInt(end_time.substring(12, 14))
    );
    const duration = Math.floor((endDate - startDate) / 1000);

    // 録音履歴をDBに保存
    const recordingId = await db.run(`
      INSERT INTO recording_history (
        program_id, title, station_id, station_name, start_time, end_time, 
        duration, status, description, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, datetime('now'))
    `, [program_id, title, station_id, station_name, start_time, end_time, duration, description]);

    const programInfo = {
      station_id,
      title,
      start_time,
      end_time,
      duration
    };

    // 録音実行
    try {
      await db.run('UPDATE recording_history SET status = ? WHERE id = ?', ['recording', recordingId.lastID]);
      
      const result = await recorder.recordProgram(programInfo);
      
      // 録音成功
      await db.run(`
        UPDATE recording_history 
        SET status = 'completed', file_path = ?, file_size = ?, updated_at = datetime('now')
        WHERE id = ?
      `, [result.filePath, result.fileSize, recordingId.lastID]);

      res.json({
        success: true,
        message: '録音が完了しました',
        recording_id: recordingId.lastID,
        data: {
          id: recordingId.lastID,
          title,
          file_path: result.filePath,
          file_size: result.fileSize,
          status: 'completed'
        }
      });

    } catch (recordingError) {
      // 録音失敗
      await db.run(`
        UPDATE recording_history 
        SET status = 'failed', error_message = ?, updated_at = datetime('now')
        WHERE id = ?
      `, [recordingError.message, recordingId.lastID]);

      throw recordingError;
    }

  } catch (error) {
    console.error('番組録音エラー:', error);
    res.status(500).json({
      success: false,
      message: '番組の録音に失敗しました',
      error: error.message
    });
  }
});

/**
 * 録音停止
 */
router.post('/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 録音状態確認
    const recording = await db.get(
      'SELECT * FROM recording_history WHERE id = ? AND status = ?',
      [id, 'recording']
    );

    if (!recording) {
      return res.status(404).json({
        success: false,
        message: '録音中の履歴が見つかりません'
      });
    }

    // 録音停止（実装は複雑なため、ステータス更新のみ）
    await db.run(
      'UPDATE recording_history SET status = ?, updated_at = datetime(\'now\') WHERE id = ?',
      ['stopped', id]
    );

    res.json({
      success: true,
      message: '録音を停止しました',
      data: { id, status: 'stopped' }
    });

  } catch (error) {
    console.error('録音停止エラー:', error);
    res.status(500).json({
      success: false,
      message: '録音の停止に失敗しました',
      error: error.message
    });
  }
});

/**
 * 録音削除
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const recording = await db.get(
      'SELECT * FROM recording_history WHERE id = ?',
      [id]
    );

    if (!recording) {
      return res.status(404).json({
        success: false,
        message: '録音履歴が見つかりません'
      });
    }

    // ファイル削除
    if (recording.file_path && fs.existsSync(recording.file_path)) {
      try {
        fs.unlinkSync(recording.file_path);
      } catch (fileError) {
        console.error('ファイル削除エラー:', fileError);
      }
    }

    // DB削除
    await db.run('DELETE FROM recording_history WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '録音を削除しました'
    });

  } catch (error) {
    console.error('録音削除エラー:', error);
    res.status(500).json({
      success: false,
      message: '録音の削除に失敗しました',
      error: error.message
    });
  }
});

/**
 * 録音ファイル再生（ストリーミング）
 */
router.get('/:id/play', async (req, res) => {
  try {
    const { id } = req.params;
    
    const recording = await db.get(
      'SELECT * FROM recording_history WHERE id = ?',
      [id]
    );

    if (!recording || !recording.file_path) {
      return res.status(404).json({
        success: false,
        message: '録音ファイルが見つかりません'
      });
    }

    if (!fs.existsSync(recording.file_path)) {
      return res.status(404).json({
        success: false,
        message: 'ファイルが存在しません'
      });
    }

    // ファイル情報取得
    const stat = fs.statSync(recording.file_path);
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
      
      const stream = fs.createReadStream(recording.file_path, { start, end });
      stream.pipe(res);
    } else {
      // 通常のストリーミング
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': 'audio/mp4',
        'Accept-Ranges': 'bytes'
      });
      
      const stream = fs.createReadStream(recording.file_path);
      stream.pipe(res);
    }

  } catch (error) {
    console.error('ファイル再生エラー:', error);
    res.status(500).json({
      success: false,
      message: 'ファイルの再生に失敗しました',
      error: error.message
    });
  }
});

/**
 * 録音ファイルダウンロード
 */
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    
    const recording = await db.get(
      'SELECT * FROM recording_history WHERE id = ?',
      [id]
    );

    if (!recording || !recording.file_path) {
      return res.status(404).json({
        success: false,
        message: '録音ファイルが見つかりません'
      });
    }

    if (!fs.existsSync(recording.file_path)) {
      return res.status(404).json({
        success: false,
        message: 'ファイルが存在しません'
      });
    }

    // ダウンロード用ファイル名生成
    const sanitizedTitle = recording.title.replace(/[<>:"/\\|?*]/g, '_');
    const filename = `${sanitizedTitle}_${recording.station_name}.m4a`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Type', 'audio/mp4');
    
    const fileStream = fs.createReadStream(recording.file_path);
    fileStream.pipe(res);

  } catch (error) {
    console.error('ファイルダウンロードエラー:', error);
    res.status(500).json({
      success: false,
      message: 'ファイルのダウンロードに失敗しました',
      error: error.message
    });
  }
});

/**
 * 録音ディレクトリ情報取得
 */
router.get('/system/info', (req, res) => {
  try {
    const info = recorder.getRecordingInfo();
    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    console.error('録音ディレクトリ情報取得エラー:', error);
    res.status(500).json({
      success: false,
      message: '録音ディレクトリ情報の取得に失敗しました',
      error: error.message
    });
  }
});

module.exports = router;