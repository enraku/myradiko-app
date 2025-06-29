<template>
  <div class="recording-details">
    <div v-if="recording" class="details-content">
      <!-- 基本情報 -->
      <div class="detail-section">
        <h4>基本情報</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <label>番組名:</label>
            <span>{{ recording.title }}</span>
          </div>
          
          <div class="detail-item">
            <label>放送局:</label>
            <span>{{ recording.station_name }}</span>
          </div>
          
          <div class="detail-item">
            <label>放送局ID:</label>
            <span>{{ recording.station_id }}</span>
          </div>
          
          <div class="detail-item">
            <label>ステータス:</label>
            <span 
              class="status-badge" 
              :class="'status-' + recording.status"
            >
              {{ getStatusLabel(recording.status) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 時間情報 -->
      <div class="detail-section">
        <h4>時間情報</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <label>開始時間:</label>
            <span>{{ formatDateTime(recording.start_time) }}</span>
          </div>
          
          <div class="detail-item">
            <label>終了時間:</label>
            <span>{{ formatDateTime(recording.end_time) }}</span>
          </div>
          
          <div class="detail-item">
            <label>録音時間:</label>
            <span>{{ getDuration(recording.start_time, recording.end_time) }}</span>
          </div>
          
          <div class="detail-item">
            <label>作成日時:</label>
            <span>{{ formatDateTime(recording.created_at) }}</span>
          </div>
          
          <div v-if="recording.updated_at" class="detail-item">
            <label>更新日時:</label>
            <span>{{ formatDateTime(recording.updated_at) }}</span>
          </div>
        </div>
      </div>

      <!-- ファイル情報 -->
      <div class="detail-section">
        <h4>ファイル情報</h4>
        <div class="detail-grid">
          <div v-if="recording.file_path" class="detail-item">
            <label>ファイルパス:</label>
            <span class="file-path">{{ recording.file_path }}</span>
          </div>
          
          <div v-if="recording.file_size" class="detail-item">
            <label>ファイルサイズ:</label>
            <span>{{ formatFileSize(recording.file_size) }}</span>
          </div>
          
          <div v-if="recording.file_size" class="detail-item">
            <label>ビットレート:</label>
            <span>{{ estimateBitrate(recording.file_size, recording.start_time, recording.end_time) }}</span>
          </div>
        </div>
      </div>

      <!-- 予約情報 -->
      <div v-if="recording.reservation_id" class="detail-section">
        <h4>予約情報</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <label>予約ID:</label>
            <span>{{ recording.reservation_id }}</span>
          </div>
        </div>
      </div>

      <!-- エラー情報 -->
      <div v-if="recording.error_message" class="detail-section error-section">
        <h4>エラー情報</h4>
        <div class="error-content">
          <div class="error-message">
            <span class="error-icon">⚠️</span>
            {{ recording.error_message }}
          </div>
        </div>
      </div>

      <!-- 技術情報 -->
      <div class="detail-section">
        <h4>技術情報</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <label>録音ID:</label>
            <span>{{ recording.id }}</span>
          </div>
          
          <div class="detail-item">
            <label>データベースID:</label>
            <span>{{ recording.id }}</span>
          </div>
          
          <div v-if="recording.process_id" class="detail-item">
            <label>プロセスID:</label>
            <span>{{ recording.process_id }}</span>
          </div>
        </div>
      </div>

      <!-- JSON詳細 (開発用) -->
      <div class="detail-section">
        <details class="json-details">
          <summary>JSON詳細 (開発用)</summary>
          <pre class="json-content">{{ JSON.stringify(recording, null, 2) }}</pre>
        </details>
      </div>
    </div>
    
    <div v-else class="no-data">
      録音詳細データがありません。
    </div>
  </div>
</template>

<script>
export default {
  name: 'RecordingDetails',
  props: {
    recording: {
      type: Object,
      default: null
    }
  },
  setup() {
    // ファイルサイズフォーマット
    const formatFileSize = (bytes) => {
      if (!bytes) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
    
    // 日時フォーマット
    const formatDateTime = (dateTimeString) => {
      if (!dateTimeString) return '--'
      
      try {
        // YYYYMMDDHHMMSS形式の場合
        if (dateTimeString.length === 14) {
          const year = dateTimeString.substring(0, 4)
          const month = dateTimeString.substring(4, 6)
          const day = dateTimeString.substring(6, 8)
          const hour = dateTimeString.substring(8, 10)
          const minute = dateTimeString.substring(10, 12)
          const second = dateTimeString.substring(12, 14)
          return `${year}-${month}-${day} ${hour}:${minute}:${second}`
        }
        
        // ISO形式の場合
        const date = new Date(dateTimeString)
        return date.toLocaleString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      } catch (error) {
        return dateTimeString
      }
    }
    
    // 録音時間計算
    const getDuration = (startTime, endTime) => {
      if (!startTime || !endTime) return '--:--'
      
      try {
        const start = new Date(startTime)
        const end = new Date(endTime)
        const diffMs = end - start
        
        if (diffMs <= 0) return '--:--'
        
        const hours = Math.floor(diffMs / (1000 * 60 * 60))
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)
        
        if (hours > 0) {
          return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        } else {
          return `${minutes}:${seconds.toString().padStart(2, '0')}`
        }
      } catch (error) {
        return '--:--'
      }
    }
    
    // ステータスラベル
    const getStatusLabel = (status) => {
      const labels = {
        'completed': '完了',
        'failed': '失敗',
        'recording': '録音中',
        'scheduled': '予約済み',
        'cancelled': 'キャンセル'
      }
      return labels[status] || status
    }
    
    // ビットレート推定
    const estimateBitrate = (fileSize, startTime, endTime) => {
      if (!fileSize || !startTime || !endTime) return '--'
      
      try {
        const start = new Date(startTime)
        const end = new Date(endTime)
        const durationSeconds = (end - start) / 1000
        
        if (durationSeconds <= 0) return '--'
        
        // ビットレート = (ファイルサイズ * 8) / 録音時間(秒)
        const bitsPerSecond = (fileSize * 8) / durationSeconds
        const kbps = Math.round(bitsPerSecond / 1000)
        
        return `${kbps} kbps`
      } catch (error) {
        return '--'
      }
    }
    
    return {
      formatFileSize,
      formatDateTime,
      getDuration,
      getStatusLabel,
      estimateBitrate
    }
  }
}
</script>

<style scoped>
.recording-details {
  max-width: 100%;
}

.details-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
}

.detail-section h4 {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 1.1rem;
  font-weight: 600;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e9ecef;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  border-left: 3px solid #e9ecef;
}

.detail-item label {
  font-weight: 500;
  color: #495057;
  min-width: 120px;
  margin-right: 1rem;
}

.detail-item span {
  color: #2c3e50;
  flex: 1;
  word-break: break-word;
}

.file-path {
  font-family: monospace;
  font-size: 0.9rem;
  background: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-completed { background: #d4edda; color: #155724; }
.status-failed { background: #f8d7da; color: #721c24; }
.status-recording { background: #fff3cd; color: #856404; }
.status-scheduled { background: #d1ecf1; color: #0c5460; }
.status-cancelled { background: #e2e3e5; color: #6c757d; }

.error-section {
  background: #fff5f5;
  border: 1px solid #f8d7da;
}

.error-section h4 {
  color: #721c24;
  border-bottom-color: #f8d7da;
}

.error-content {
  background: white;
  border-radius: 6px;
  padding: 1rem;
  border-left: 3px solid #dc3545;
}

.error-message {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  color: #721c24;
  line-height: 1.5;
}

.error-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.json-details {
  margin-top: 0.5rem;
}

.json-details summary {
  cursor: pointer;
  padding: 0.5rem;
  background: #e9ecef;
  border-radius: 4px;
  font-weight: 500;
  color: #495057;
}

.json-details summary:hover {
  background: #dee2e6;
}

.json-content {
  margin: 1rem 0 0 0;
  padding: 1rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.85rem;
  color: #495057;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.no-data {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-style: italic;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .detail-section {
    padding: 1rem;
  }
  
  .detail-item {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .detail-item label {
    min-width: auto;
    margin-right: 0;
    font-size: 0.9rem;
  }
  
  .json-content {
    font-size: 0.8rem;
  }
}

@media (min-width: 769px) {
  .detail-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}
</style>