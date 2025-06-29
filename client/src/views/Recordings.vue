<template>
  <div class="recordings">
    <div class="recordings-header">
      <h2>🎵 録音ファイル管理</h2>
      
      <div class="header-actions">
        <button @click="openRecordingsFolder" class="btn-primary" :disabled="loading">
          📁 フォルダを開く
        </button>
        <button @click="refreshData" class="btn-secondary" :disabled="loading">
          {{ loading ? '更新中...' : '更新' }}
        </button>
        <button @click="cleanupFiles" class="btn-danger" :disabled="loading">
          🗑️ 古いファイル削除
        </button>
      </div>
    </div>

    <!-- 統計情報 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">📁</div>
        <div class="stat-content">
          <div class="stat-number">{{ recordings.length }}</div>
          <div class="stat-label">録音ファイル</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">💾</div>
        <div class="stat-content">
          <div class="stat-number">{{ formatFileSize(totalSize) }}</div>
          <div class="stat-label">合計サイズ</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-number">{{ completedCount }}</div>
          <div class="stat-label">完了</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">❌</div>
        <div class="stat-content">
          <div class="stat-number">{{ failedCount }}</div>
          <div class="stat-label">失敗</div>
        </div>
      </div>
    </div>

    <!-- フィルター・検索エリア -->
    <div class="filters">
      <div class="filter-group">
        <label>表示:</label>
        <select v-model="filterStatus" @change="applyFilters" class="filter-select">
          <option value="all">すべて</option>
          <option value="completed">完了</option>
          <option value="failed">失敗</option>
          <option value="recording">録音中</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>期間:</label>
        <select v-model="filterPeriod" @change="applyFilters" class="filter-select">
          <option value="all">すべて</option>
          <option value="today">今日</option>
          <option value="week">1週間</option>
          <option value="month">1ヶ月</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>検索:</label>
        <input 
          v-model="searchTerm" 
          @input="applyFilters"
          placeholder="番組名、放送局名で検索..."
          class="search-input"
        />
      </div>
      
      <div class="filter-group">
        <label>表示件数:</label>
        <select v-model="itemsPerPage" @change="applyFilters" class="filter-select">
          <option :value="20">20件</option>
          <option :value="50">50件</option>
          <option :value="100">100件</option>
        </select>
      </div>
    </div>

    <!-- エラー表示 -->
    <div v-if="error" class="error-message">
      {{ error }}
      <button @click="clearError" class="btn-close">×</button>
    </div>

    <!-- 録音ファイル一覧 -->
    <div class="recordings-content">
      <div v-if="loading && recordings.length === 0" class="loading-message">
        録音データを読み込み中...
      </div>
      
      <div v-else-if="filteredRecordings.length === 0" class="no-recordings">
        <div v-if="recordings.length === 0">
          まだ録音ファイルがありません。
        </div>
        <div v-else>
          検索条件に一致する録音ファイルがありません。
        </div>
      </div>
      
      <div v-else class="recordings-grid">
        <div 
          v-for="recording in paginatedRecordings" 
          :key="recording.id"
          class="recording-card"
          :class="{ 
            'status-completed': recording.status === 'completed',
            'status-failed': recording.status === 'failed',
            'status-recording': recording.status === 'recording'
          }"
        >
          <!-- カードヘッダー -->
          <div class="card-header">
            <div class="recording-status">
              <span 
                class="status-badge" 
                :class="'status-' + recording.status"
              >
                {{ getStatusLabel(recording.status) }}
              </span>
            </div>
            <div class="recording-actions">
              <div class="dropdown">
                <button @click="toggleDropdown(recording.id)" class="dropdown-toggle">
                  ⋮
                </button>
                <div 
                  v-if="activeDropdown === recording.id" 
                  class="dropdown-menu"
                  @click.stop
                >
                  <button 
                    v-if="recording.status === 'completed'" 
                    @click="playRecording(recording)"
                    class="dropdown-item"
                  >
                    🎵 再生
                  </button>
                  <button 
                    v-if="recording.status === 'completed'" 
                    @click="downloadRecording(recording)"
                    class="dropdown-item"
                  >
                    💾 ダウンロード
                  </button>
                  <button @click="viewDetails(recording)" class="dropdown-item">
                    📋 詳細
                  </button>
                  <button @click="deleteRecording(recording)" class="dropdown-item delete">
                    🗑️ 削除
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- カードコンテンツ -->
          <div class="card-content">
            <div class="recording-title">{{ recording.title }}</div>
            <div class="recording-station">{{ recording.station_name }}</div>
            <div class="recording-time">{{ formatDateTime(recording.start_time) }}</div>
            
            <div class="recording-meta">
              <div v-if="recording.file_size" class="meta-item">
                <span class="meta-label">サイズ:</span>
                <span class="meta-value">{{ formatFileSize(recording.file_size) }}</span>
              </div>
              
              <div v-if="recording.end_time" class="meta-item">
                <span class="meta-label">時間:</span>
                <span class="meta-value">{{ getDuration(recording.start_time, recording.end_time) }}</span>
              </div>
              
              <div v-if="recording.error_message" class="meta-item error">
                <span class="meta-label">エラー:</span>
                <span class="meta-value">{{ recording.error_message }}</span>
              </div>
            </div>
          </div>
          
          <!-- 再生プログレス（録音中の場合） -->
          <div v-if="recording.status === 'recording'" class="recording-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: getRecordingProgress(recording) + '%' }"></div>
            </div>
            <div class="progress-text">録音中...</div>
          </div>
        </div>
      </div>
      
      <!-- ページネーション -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="currentPage = Math.max(1, currentPage - 1)"
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          « 前
        </button>
        
        <span class="pagination-info">
          {{ currentPage }} / {{ totalPages }} ページ ({{ filteredRecordings.length }}件)
        </span>
        
        <button 
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="pagination-btn"
        >
          次 »
        </button>
      </div>
    </div>

    <!-- オーディオプレイヤー -->
    <div v-if="currentAudio" class="audio-player">
      <div class="player-header">
        <div class="player-title">{{ currentAudio.title }}</div>
        <button @click="stopAudio" class="btn-close">×</button>
      </div>
      <audio 
        ref="audioElement"
        :src="currentAudio.url" 
        controls 
        autoplay
        @ended="stopAudio"
        class="audio-controls"
      ></audio>
    </div>

    <!-- 詳細モーダル -->
    <div v-if="showDetailsModal" class="modal-overlay" @click="closeDetailsModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>録音詳細</h3>
          <button @click="closeDetailsModal" class="btn-close">×</button>
        </div>
        
        <div class="modal-body">
          <RecordingDetails :recording="selectedRecording" />
        </div>
      </div>
    </div>

    <!-- 削除確認モーダル -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content small" @click.stop>
        <div class="modal-header">
          <h3>録音削除</h3>
          <button @click="closeDeleteModal" class="btn-close">×</button>
        </div>
        
        <div class="modal-body">
          <p>「{{ deleteTarget?.title }}」を削除しますか？</p>
          <p class="warning-text">この操作は取り消せません。</p>
          
          <div class="modal-actions">
            <button @click="closeDeleteModal" class="btn-cancel">
              キャンセル
            </button>
            <button @click="confirmDelete" class="btn-danger">
              削除
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { appState, actions } from '../store/index.js'
import RecordingDetails from '../components/RecordingDetails.vue'
import axios from 'axios'

export default {
  name: 'Recordings',
  components: {
    RecordingDetails
  },
  setup() {
    // フィルター・検索
    const filterStatus = ref('all')
    const filterPeriod = ref('all')
    const searchTerm = ref('')
    const itemsPerPage = ref(20)
    
    // ページネーション
    const currentPage = ref(1)
    
    // UI状態
    const activeDropdown = ref(null)
    const showDetailsModal = ref(false)
    const showDeleteModal = ref(false)
    const selectedRecording = ref(null)
    const deleteTarget = ref(null)
    
    // オーディオプレイヤー
    const currentAudio = ref(null)
    const audioElement = ref(null)
    
    // ストアからの状態
    const recordings = computed(() => appState.recordings)
    const loading = computed(() => appState.loading)
    const error = computed(() => appState.error)
    
    // 統計計算
    const totalSize = computed(() => {
      return recordings.value.reduce((total, recording) => {
        return total + (recording.file_size || 0)
      }, 0)
    })
    
    const completedCount = computed(() => {
      return recordings.value.filter(r => r.status === 'completed').length
    })
    
    const failedCount = computed(() => {
      return recordings.value.filter(r => r.status === 'failed').length
    })
    
    // フィルタリングされた録音一覧
    const filteredRecordings = computed(() => {
      let filtered = [...recordings.value]
      
      // ステータスフィルター
      if (filterStatus.value !== 'all') {
        filtered = filtered.filter(r => r.status === filterStatus.value)
      }
      
      // 期間フィルター
      if (filterPeriod.value !== 'all') {
        const now = new Date()
        const cutoff = new Date()
        
        switch (filterPeriod.value) {
          case 'today':
            cutoff.setHours(0, 0, 0, 0)
            break
          case 'week':
            cutoff.setDate(now.getDate() - 7)
            break
          case 'month':
            cutoff.setMonth(now.getMonth() - 1)
            break
        }
        
        filtered = filtered.filter(r => {
          const recordingDate = new Date(r.created_at || r.start_time)
          return recordingDate >= cutoff
        })
      }
      
      // 検索フィルター
      if (searchTerm.value.trim()) {
        const term = searchTerm.value.toLowerCase()
        filtered = filtered.filter(r => 
          r.title.toLowerCase().includes(term) ||
          r.station_name.toLowerCase().includes(term)
        )
      }
      
      return filtered.sort((a, b) => new Date(b.created_at || b.start_time) - new Date(a.created_at || a.start_time))
    })
    
    // ページネーション計算
    const totalPages = computed(() => 
      Math.ceil(filteredRecordings.value.length / itemsPerPage.value)
    )
    
    const paginatedRecordings = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage.value
      const end = start + itemsPerPage.value
      return filteredRecordings.value.slice(start, end)
    })
    
    // ユーティリティ関数
    const formatFileSize = (bytes) => {
      if (!bytes) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
    
    const formatDateTime = (dateTimeString) => {
      try {
        if (dateTimeString.length === 14) {
          const year = dateTimeString.substring(0, 4)
          const month = dateTimeString.substring(4, 6)
          const day = dateTimeString.substring(6, 8)
          const hour = dateTimeString.substring(8, 10)
          const minute = dateTimeString.substring(10, 12)
          return `${year}-${month}-${day} ${hour}:${minute}`
        }
        
        const date = new Date(dateTimeString)
        return date.toLocaleString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch (error) {
        return dateTimeString
      }
    }
    
    const getDuration = (startTime, endTime) => {
      try {
        const start = new Date(startTime)
        const end = new Date(endTime)
        const diffMs = end - start
        const hours = Math.floor(diffMs / (1000 * 60 * 60))
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      } catch (error) {
        return '--:--'
      }
    }
    
    const getStatusLabel = (status) => {
      const labels = {
        'completed': '完了',
        'failed': '失敗',
        'recording': '録音中'
      }
      return labels[status] || status
    }
    
    const getRecordingProgress = (recording) => {
      try {
        const start = new Date(recording.start_time)
        const end = new Date(recording.end_time)
        const now = new Date()
        const total = end - start
        const elapsed = now - start
        return Math.min(100, Math.max(0, (elapsed / total) * 100))
      } catch (error) {
        return 0
      }
    }
    
    // フィルター適用
    const applyFilters = () => {
      currentPage.value = 1
    }
    
    // データ更新
    const refreshData = async () => {
      await actions.loadRecordings()
    }
    
    // エラークリア
    const clearError = () => {
      actions.clearError()
    }
    
    // ドロップダウン制御
    const toggleDropdown = (recordingId) => {
      activeDropdown.value = activeDropdown.value === recordingId ? null : recordingId
    }
    
    const closeDropdowns = () => {
      activeDropdown.value = null
    }
    
    // 録音操作
    const playRecording = (recording) => {
      currentAudio.value = {
        title: recording.title,
        url: `/api/recordings/${recording.id}/play`
      }
      closeDropdowns()
    }
    
    const stopAudio = () => {
      if (audioElement.value) {
        audioElement.value.pause()
        audioElement.value.currentTime = 0
      }
      currentAudio.value = null
    }
    
    const downloadRecording = (recording) => {
      const link = document.createElement('a')
      link.href = `/api/recordings/${recording.id}/download`
      link.download = `${recording.title}.m4a`
      link.click()
      closeDropdowns()
    }
    
    const viewDetails = (recording) => {
      selectedRecording.value = recording
      showDetailsModal.value = true
      closeDropdowns()
    }
    
    const deleteRecording = (recording) => {
      deleteTarget.value = recording
      showDeleteModal.value = true
      closeDropdowns()
    }
    
    const confirmDelete = async () => {
      if (deleteTarget.value) {
        try {
          await actions.deleteRecording(deleteTarget.value.id)
          closeDeleteModal()
        } catch (error) {
          console.error('Failed to delete recording:', error)
        }
      }
    }
    
    // モーダル制御
    const closeDetailsModal = () => {
      showDetailsModal.value = false
      selectedRecording.value = null
    }
    
    const closeDeleteModal = () => {
      showDeleteModal.value = false
      deleteTarget.value = null
    }
    
    // 古いファイル削除
    const cleanupFiles = async () => {
      if (confirm('30日以上古いファイルを削除しますか？')) {
        try {
          // TODO: クリーンアップAPIの実装
          console.log('Cleanup old files...')
        } catch (error) {
          console.error('Failed to cleanup files:', error)
        }
      }
    }
    
    // 録音フォルダを開く
    const openRecordingsFolder = async () => {
      try {
        const response = await axios.post('/api/system/open-recordings-folder')
        if (response.data.success) {
          console.log('Recordings folder opened:', response.data.data.path)
          // 成功時は何もしない（フォルダが開かれるはず）
        }
      } catch (error) {
        console.error('Failed to open recordings folder:', error)
        alert('フォルダを開けませんでした: ' + (error.response?.data?.message || error.message))
      }
    }
    
    // イベントリスナー
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown')) {
        closeDropdowns()
      }
    }
    
    // ライフサイクル
    onMounted(() => {
      refreshData()
      document.addEventListener('click', handleClickOutside)
    })
    
    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
      stopAudio()
    })
    
    return {
      // 状態
      recordings,
      loading,
      error,
      
      // 統計
      totalSize,
      completedCount,
      failedCount,
      
      // フィルター・検索
      filterStatus,
      filterPeriod,
      searchTerm,
      itemsPerPage,
      filteredRecordings,
      
      // ページネーション
      currentPage,
      totalPages,
      paginatedRecordings,
      
      // UI状態
      activeDropdown,
      showDetailsModal,
      showDeleteModal,
      selectedRecording,
      deleteTarget,
      
      // オーディオ
      currentAudio,
      audioElement,
      
      // メソッド
      formatFileSize,
      formatDateTime,
      getDuration,
      getStatusLabel,
      getRecordingProgress,
      applyFilters,
      refreshData,
      clearError,
      toggleDropdown,
      playRecording,
      stopAudio,
      downloadRecording,
      viewDetails,
      deleteRecording,
      confirmDelete,
      closeDetailsModal,
      closeDeleteModal,
      cleanupFiles,
      openRecordingsFolder
    }
  }
}
</script>

<style scoped>
.recordings {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
}

.recordings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.recordings-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 2rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-secondary, .btn-danger {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
}

.btn-secondary:hover {
  background: #e9ecef;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-secondary:disabled, .btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 統計カード */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2rem;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 50%;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

/* フィルター */
.filters {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 500;
  color: #555;
  white-space: nowrap;
}

.filter-select, .search-input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-input {
  min-width: 250px;
}

/* エラーメッセージ */
.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}

/* 録音カードグリッド */
.recordings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.recording-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.recording-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.recording-card.status-completed {
  border-left: 4px solid #28a745;
}

.recording-card.status-failed {
  border-left: 4px solid #dc3545;
}

.recording-card.status-recording {
  border-left: 4px solid #ffc107;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1rem 0.5rem 1rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-completed { background: #d4edda; color: #155724; }
.status-failed { background: #f8d7da; color: #721c24; }
.status-recording { background: #fff3cd; color: #856404; }

.dropdown {
  position: relative;
}

.dropdown-toggle {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.dropdown-toggle:hover {
  background: #f8f9fa;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 150px;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 0.9rem;
}

.dropdown-item:hover {
  background: #f8f9fa;
}

.dropdown-item.delete:hover {
  background: #f8d7da;
  color: #721c24;
}

.card-content {
  padding: 0.5rem 1rem 1rem 1rem;
}

.recording-title {
  font-weight: 600;
  font-size: 1.1rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.recording-station {
  color: #667eea;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.recording-time {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}

.recording-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
}

.meta-label {
  color: #666;
}

.meta-value {
  color: #2c3e50;
  font-weight: 500;
}

.meta-item.error .meta-value {
  color: #dc3545;
}

.recording-progress {
  padding: 0 1rem 1rem 1rem;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: #ffc107;
  transition: width 0.3s;
}

.progress-text {
  text-align: center;
  font-size: 0.8rem;
  color: #856404;
}

/* ページネーション */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 2rem 0;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  background: white;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #e9ecef;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  color: #666;
  font-size: 0.9rem;
}

/* オーディオプレイヤー */
.audio-player {
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  right: 1rem;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-width: 500px;
  margin: 0 auto;
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.player-title {
  font-weight: 600;
  color: #2c3e50;
}

.audio-controls {
  width: 100%;
  padding: 1rem;
}

/* メッセージ */
.loading-message, .no-recordings {
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 1.1rem;
}

/* モーダル */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content.small {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #dee2e6;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.modal-body {
  padding: 1.5rem;
}

.warning-text {
  color: #856404;
  font-style: italic;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-cancel:hover {
  background: #e9ecef;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .recordings-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .stats-cards {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .filters {
    flex-direction: column;
    gap: 1rem;
  }
  
  .filter-group {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    min-width: auto;
  }
  
  .recordings-grid {
    grid-template-columns: 1fr;
  }
  
  .audio-player {
    left: 0.5rem;
    right: 0.5rem;
    bottom: 0.5rem;
  }
  
  .modal-content {
    width: 95%;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>