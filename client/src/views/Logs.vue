<template>
  <div class="logs-container">
    <div class="logs-header">
      <h1 class="title">📋 ログ管理</h1>
      <div class="header-actions">
        <button @click="refreshLogs" :disabled="loading" class="btn btn-primary">
          <i class="fas fa-sync-alt"></i>
          {{ loading ? '更新中...' : '更新' }}
        </button>
        <button @click="clearAllLogs" class="btn btn-danger">
          <i class="fas fa-trash"></i>
          ログをクリア
        </button>
        <button @click="exportLogs" class="btn btn-secondary">
          <i class="fas fa-download"></i>
          エクスポート
        </button>
      </div>
    </div>

    <!-- フィルター -->
    <div class="filter-section">
      <div class="filter-controls">
        <div class="filter-group">
          <label for="log-level">ログレベル:</label>
          <select id="log-level" v-model="selectedLevel" @change="applyFilters" class="filter-select">
            <option value="">すべて</option>
            <option value="info">情報</option>
            <option value="warn">警告</option>
            <option value="error">エラー</option>
            <option value="debug">デバッグ</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="log-category">カテゴリ:</label>
          <select id="log-category" v-model="selectedCategory" @change="applyFilters" class="filter-select">
            <option value="">すべて</option>
            <option value="recording">録音</option>
            <option value="scheduler">スケジューラー</option>
            <option value="api">API</option>
            <option value="system">システム</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="date-range">期間:</label>
          <select id="date-range" v-model="selectedDateRange" @change="applyFilters" class="filter-select">
            <option value="today">今日</option>
            <option value="week">1週間</option>
            <option value="month">1ヶ月</option>
            <option value="all">すべて</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="search-logs">🔍 検索:</label>
          <input 
            id="search-logs"
            v-model="searchQuery" 
            type="text" 
            placeholder="メッセージを検索..."
            class="search-input"
            @input="applyFilters"
          >
        </div>
      </div>
      
      <div v-if="isFiltering" class="filter-results">
        {{ filteredLogs.length }}件のログが見つかりました
        <button @click="clearFilters" class="clear-filters-btn">フィルターをクリア</button>
      </div>
    </div>

    <!-- ログ統計 -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-icon info">
          <i class="fas fa-info-circle"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.info }}</h3>
          <p>情報ログ</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon warn">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.warn }}</h3>
          <p>警告ログ</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon error">
          <i class="fas fa-times-circle"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.error }}</h3>
          <p>エラーログ</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon total">
          <i class="fas fa-list"></i>
        </div>
        <div class="stat-content">
          <h3>{{ logs.length }}</h3>
          <p>総ログ数</p>
        </div>
      </div>
    </div>

    <!-- ログ一覧 -->
    <div class="logs-content">
      <div v-if="loading" class="loading-message">
        <i class="fas fa-spinner fa-spin"></i>
        ログを読み込み中...
      </div>
      
      <div v-else-if="!displayLogs.length" class="no-logs">
        <i class="fas fa-inbox"></i>
        <h3>ログがありません</h3>
        <p>表示するログエントリがありません</p>
      </div>
      
      <div v-else class="logs-list">
        <div 
          v-for="log in paginatedLogs" 
          :key="log.id"
          class="log-entry"
          :class="[`log-${log.level}`, { 'highlighted': isHighlighted(log) }]"
        >
          <div class="log-header">
            <div class="log-level">
              <i :class="getLevelIcon(log.level)"></i>
              {{ getLevelLabel(log.level) }}
            </div>
            <div class="log-category">{{ log.category || 'システム' }}</div>
            <div class="log-timestamp">{{ formatTimestamp(log.timestamp) }}</div>
          </div>
          
          <div class="log-message">
            <span v-html="highlightSearchTerm(log.message)"></span>
          </div>
          
          <div v-if="log.details" class="log-details">
            <button @click="toggleDetails(log.id)" class="details-toggle">
              <i :class="expandedLogs.includes(log.id) ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
              詳細
            </button>
            <div v-if="expandedLogs.includes(log.id)" class="details-content">
              <pre>{{ JSON.stringify(log.details, null, 2) }}</pre>
            </div>
          </div>
          
          <div v-if="log.stack_trace" class="log-stack">
            <button @click="toggleStack(log.id)" class="stack-toggle">
              <i :class="expandedStacks.includes(log.id) ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
              スタックトレース
            </button>
            <div v-if="expandedStacks.includes(log.id)" class="stack-content">
              <pre>{{ log.stack_trace }}</pre>
            </div>
          </div>
        </div>
      </div>
      
      <!-- ページネーション -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="currentPage = 1" 
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          <i class="fas fa-angle-double-left"></i>
        </button>
        <button 
          @click="currentPage--" 
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          <i class="fas fa-angle-left"></i>
        </button>
        
        <span class="pagination-info">
          {{ currentPage }} / {{ totalPages }} ページ
        </span>
        
        <button 
          @click="currentPage++" 
          :disabled="currentPage === totalPages"
          class="pagination-btn"
        >
          <i class="fas fa-angle-right"></i>
        </button>
        <button 
          @click="currentPage = totalPages" 
          :disabled="currentPage === totalPages"
          class="pagination-btn"
        >
          <i class="fas fa-angle-double-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { appState, actions } from '../store/index.js'

export default {
  name: 'Logs',
  setup() {
    const loading = ref(false)
    const logs = ref([])
    const selectedLevel = ref('')
    const selectedCategory = ref('')
    const selectedDateRange = ref('week')
    const searchQuery = ref('')
    const expandedLogs = ref([])
    const expandedStacks = ref([])
    const currentPage = ref(1)
    const logsPerPage = 50

    // 計算プロパティ
    const filteredLogs = computed(() => {
      let filtered = logs.value

      // レベルフィルター
      if (selectedLevel.value) {
        filtered = filtered.filter(log => log.level === selectedLevel.value)
      }

      // カテゴリフィルター
      if (selectedCategory.value) {
        filtered = filtered.filter(log => log.category === selectedCategory.value)
      }

      // 期間フィルター
      if (selectedDateRange.value !== 'all') {
        const now = new Date()
        let startDate = new Date()
        
        switch (selectedDateRange.value) {
          case 'today':
            startDate.setHours(0, 0, 0, 0)
            break
          case 'week':
            startDate.setDate(now.getDate() - 7)
            break
          case 'month':
            startDate.setMonth(now.getMonth() - 1)
            break
        }
        
        filtered = filtered.filter(log => {
          const logDate = new Date(log.timestamp)
          return logDate >= startDate
        })
      }

      // 検索フィルター
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(log => 
          log.message.toLowerCase().includes(query) ||
          (log.category && log.category.toLowerCase().includes(query))
        )
      }

      // 新しい順にソート
      return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    })

    const displayLogs = computed(() => filteredLogs.value)
    
    const totalPages = computed(() => 
      Math.ceil(displayLogs.value.length / logsPerPage)
    )
    
    const paginatedLogs = computed(() => {
      const start = (currentPage.value - 1) * logsPerPage
      const end = start + logsPerPage
      return displayLogs.value.slice(start, end)
    })

    const isFiltering = computed(() => {
      return !!(selectedLevel.value || selectedCategory.value || 
               selectedDateRange.value !== 'week' || searchQuery.value.trim())
    })

    const stats = computed(() => {
      return {
        info: logs.value.filter(log => log.level === 'info').length,
        warn: logs.value.filter(log => log.level === 'warn').length,
        error: logs.value.filter(log => log.level === 'error').length
      }
    })

    // メソッド
    const loadLogs = async () => {
      try {
        loading.value = true
        
        // ダミーログデータ（実際の実装では API から取得）
        logs.value = [
          {
            id: 1,
            level: 'info',
            category: 'recording',
            message: '録音を開始しました: TBSラジオ - テスト番組',
            timestamp: new Date().toISOString(),
            details: { station_id: 'TBS', duration: 3600 }
          },
          {
            id: 2,
            level: 'info',
            category: 'recording',
            message: '録音が正常に完了しました: TBSラジオ - テスト番組',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            details: { file_path: '/recordings/test.mp3', file_size: 52428800 }
          },
          {
            id: 3,
            level: 'error',
            category: 'api',
            message: 'radiko APIへの接続に失敗しました',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            details: { endpoint: '/v3/station/list', status_code: 503 },
            stack_trace: 'Error: Connection timeout\n    at fetch.js:45\n    at async getStations'
          },
          {
            id: 4,
            level: 'warn',
            category: 'scheduler',
            message: '予約された録音の開始時刻を過ぎています',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            details: { reservation_id: 5, scheduled_time: '2025-06-27 14:00:00' }
          },
          {
            id: 5,
            level: 'info',
            category: 'system',
            message: 'アプリケーションが起動しました',
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            details: { version: '1.0.0', environment: 'development' }
          }
        ]
        
      } catch (error) {
        console.error('ログの読み込みに失敗:', error)
      } finally {
        loading.value = false
      }
    }

    const refreshLogs = () => {
      loadLogs()
    }

    const clearAllLogs = () => {
      if (confirm('すべてのログを削除してもよろしいですか？\nこの操作は取り消せません。')) {
        logs.value = []
      }
    }

    const exportLogs = () => {
      try {
        const exportData = {
          logs: displayLogs.value,
          exported_at: new Date().toISOString(),
          filters: {
            level: selectedLevel.value,
            category: selectedCategory.value,
            dateRange: selectedDateRange.value,
            search: searchQuery.value
          }
        }
        
        const dataStr = JSON.stringify(exportData, null, 2)
        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        
        const link = document.createElement('a')
        link.href = url
        link.download = `myradiko-logs-${new Date().toISOString().split('T')[0]}.json`
        link.click()
        
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('ログのエクスポートに失敗:', error)
      }
    }

    const applyFilters = () => {
      currentPage.value = 1
    }

    const clearFilters = () => {
      selectedLevel.value = ''
      selectedCategory.value = ''
      selectedDateRange.value = 'week'
      searchQuery.value = ''
      currentPage.value = 1
    }

    const toggleDetails = (logId) => {
      const index = expandedLogs.value.indexOf(logId)
      if (index > -1) {
        expandedLogs.value.splice(index, 1)
      } else {
        expandedLogs.value.push(logId)
      }
    }

    const toggleStack = (logId) => {
      const index = expandedStacks.value.indexOf(logId)
      if (index > -1) {
        expandedStacks.value.splice(index, 1)
      } else {
        expandedStacks.value.push(logId)
      }
    }

    const getLevelIcon = (level) => {
      const icons = {
        info: 'fas fa-info-circle',
        warn: 'fas fa-exclamation-triangle',
        error: 'fas fa-times-circle',
        debug: 'fas fa-bug'
      }
      return icons[level] || 'fas fa-circle'
    }

    const getLevelLabel = (level) => {
      const labels = {
        info: '情報',
        warn: '警告',
        error: 'エラー',
        debug: 'デバッグ'
      }
      return labels[level] || level
    }

    const formatTimestamp = (timestamp) => {
      const date = new Date(timestamp)
      return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    const highlightSearchTerm = (text) => {
      if (!searchQuery.value.trim()) return text
      const query = searchQuery.value.trim()
      const regex = new RegExp(`(${query})`, 'gi')
      return text.replace(regex, '<mark>$1</mark>')
    }

    const isHighlighted = (log) => {
      if (!searchQuery.value.trim()) return false
      const query = searchQuery.value.toLowerCase()
      return log.message.toLowerCase().includes(query) ||
             (log.category && log.category.toLowerCase().includes(query))
    }

    // ライフサイクル
    onMounted(() => {
      loadLogs()
    })

    // ページ変更時にスクロール位置をリセット
    watch(currentPage, () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })

    return {
      loading,
      logs,
      selectedLevel,
      selectedCategory,
      selectedDateRange,
      searchQuery,
      expandedLogs,
      expandedStacks,
      currentPage,
      filteredLogs,
      displayLogs,
      totalPages,
      paginatedLogs,
      isFiltering,
      stats,
      
      refreshLogs,
      clearAllLogs,
      exportLogs,
      applyFilters,
      clearFilters,
      toggleDetails,
      toggleStack,
      getLevelIcon,
      getLevelLabel,
      formatTimestamp,
      highlightSearchTerm,
      isHighlighted
    }
  }
}
</script>

<style scoped>
.logs-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #eee;
}

.title {
  margin: 0;
  color: #333;
  font-size: 2em;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
}

.filter-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
}

.filter-controls {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 150px;
}

.filter-group label {
  font-weight: 500;
  color: #555;
  font-size: 14px;
}

.filter-select, .search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-input {
  min-width: 250px;
}

.filter-results {
  margin-top: 15px;
  padding: 10px;
  background: #e3f2fd;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  color: #1976d2;
}

.clear-filters-btn {
  padding: 5px 10px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.info { background-color: #17a2b8; }
.stat-icon.warn { background-color: #ffc107; color: #333; }
.stat-icon.error { background-color: #dc3545; }
.stat-icon.total { background-color: #28a745; }

.stat-content h3 {
  margin: 0;
  font-size: 2em;
  color: #333;
}

.stat-content p {
  margin: 5px 0 0 0;
  color: #666;
}

.logs-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

.loading-message, .no-logs {
  padding: 60px 20px;
  text-align: center;
  color: #666;
}

.loading-message i {
  font-size: 2em;
  margin-bottom: 20px;
  color: #007bff;
}

.no-logs i {
  font-size: 3em;
  margin-bottom: 20px;
  color: #ccc;
}

.logs-list {
  padding: 20px;
}

.log-entry {
  border: 1px solid #eee;
  border-radius: 6px;
  margin-bottom: 15px;
  padding: 15px;
  transition: all 0.2s;
}

.log-entry:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.log-entry.highlighted {
  border-color: #ff9800;
  background: #fff3e0;
}

.log-entry.log-info { border-left: 4px solid #17a2b8; }
.log-entry.log-warn { border-left: 4px solid #ffc107; }
.log-entry.log-error { border-left: 4px solid #dc3545; }
.log-entry.log-debug { border-left: 4px solid #6c757d; }

.log-header {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.log-level {
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  text-transform: uppercase;
}

.log-entry.log-info .log-level { background: #e1f5fe; color: #0277bd; }
.log-entry.log-warn .log-level { background: #fff8e1; color: #f57c00; }
.log-entry.log-error .log-level { background: #ffebee; color: #c62828; }
.log-entry.log-debug .log-level { background: #f3e5f5; color: #7b1fa2; }

.log-category {
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #495057;
  font-weight: 500;
}

.log-timestamp {
  color: #666;
  font-size: 13px;
  margin-left: auto;
}

.log-message {
  color: #333;
  line-height: 1.5;
  margin-bottom: 10px;
}

.log-details, .log-stack {
  margin-top: 10px;
}

.details-toggle, .stack-toggle {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.details-content, .stack-content {
  margin-top: 10px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 10px;
  overflow-x: auto;
}

.details-content pre, .stack-content pre {
  margin: 0;
  font-size: 12px;
  color: #495057;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #eee;
}

.pagination-btn {
  padding: 8px 12px;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 4px;
  cursor: pointer;
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
  padding: 0 20px;
  font-weight: 500;
  color: #495057;
}

:global(mark) {
  background-color: #ffeb3b;
  padding: 0 2px;
  border-radius: 2px;
}

@media (max-width: 768px) {
  .logs-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .header-actions {
    justify-content: center;
  }

  .filter-controls {
    flex-direction: column;
  }

  .filter-group {
    min-width: auto;
  }

  .search-input {
    min-width: auto;
  }

  .stats-section {
    grid-template-columns: 1fr;
  }

  .log-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .log-timestamp {
    margin-left: 0;
  }
}
</style>