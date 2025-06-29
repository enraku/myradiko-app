<template>
  <div class="reservations">
    <div class="reservations-header">
      <h2>📅 録音予約管理</h2>
      
      <div class="header-actions">
        <button @click="openNewReservationModal" class="btn-primary">
          + 新規予約
        </button>
        <button @click="refreshData" class="btn-secondary" :disabled="loading">
          {{ loading ? '更新中...' : '更新' }}
        </button>
      </div>
    </div>

    <!-- フィルター・検索エリア -->
    <div class="filters">
      <div class="filter-group">
        <label>表示:</label>
        <select v-model="filterStatus" @change="applyFilters" class="filter-select">
          <option value="all">すべて</option>
          <option value="active">有効</option>
          <option value="inactive">無効</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>繰り返し:</label>
        <select v-model="filterRepeat" @change="applyFilters" class="filter-select">
          <option value="all">すべて</option>
          <option value="none">単発</option>
          <option value="daily">毎日</option>
          <option value="weekly">毎週</option>
          <option value="weekdays">平日</option>
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
    </div>

    <!-- 近日予約アラート -->
    <div v-if="upcomingReservations.length > 0" class="upcoming-alert">
      <h3>📍 24時間以内の予約 ({{ upcomingReservations.length }}件)</h3>
      <div class="upcoming-list">
        <div 
          v-for="reservation in upcomingReservations" 
          :key="'upcoming-' + reservation.id"
          class="upcoming-item"
        >
          <div class="upcoming-time">{{ formatDateTime(reservation.start_time) }}</div>
          <div class="upcoming-title">{{ reservation.title }}</div>
          <div class="upcoming-station">{{ reservation.station_name }}</div>
        </div>
      </div>
    </div>

    <!-- エラー表示 -->
    <div v-if="error" class="error-message">
      {{ error }}
      <button @click="clearError" class="btn-close">×</button>
    </div>

    <!-- 予約一覧 -->
    <div class="reservations-content">
      <div v-if="loading && reservations.length === 0" class="loading-message">
        予約データを読み込み中...
      </div>
      
      <div v-else-if="filteredReservations.length === 0" class="no-reservations">
        <div v-if="reservations.length === 0">
          まだ予約がありません。番組表から録音予約を作成してください。
        </div>
        <div v-else>
          検索条件に一致する予約がありません。
        </div>
      </div>
      
      <div v-else class="reservations-table-container">
        <table class="reservations-table">
          <thead>
            <tr>
              <th>番組名</th>
              <th>放送局</th>
              <th>開始時間</th>
              <th>終了時間</th>
              <th>繰り返し</th>
              <th>状態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="reservation in paginatedReservations" 
              :key="reservation.id"
              :class="{ 'inactive': !reservation.is_active }"
            >
              <td class="title-cell">
                <div class="reservation-title">{{ reservation.title }}</div>
              </td>
              <td class="station-cell">{{ reservation.station_name }}</td>
              <td class="time-cell">{{ formatDateTime(reservation.start_time) }}</td>
              <td class="time-cell">{{ formatDateTime(reservation.end_time) }}</td>
              <td class="repeat-cell">
                <span class="repeat-badge" :class="'repeat-' + reservation.repeat_type">
                  {{ getRepeatTypeLabel(reservation.repeat_type) }}
                </span>
              </td>
              <td class="status-cell">
                <span 
                  class="status-badge" 
                  :class="reservation.is_active ? 'status-active' : 'status-inactive'"
                >
                  {{ reservation.is_active ? '有効' : '無効' }}
                </span>
              </td>
              <td class="actions-cell">
                <div class="action-buttons">
                  <button @click="editReservation(reservation)" class="btn-edit" title="編集">
                    ✏️
                  </button>
                  <button 
                    @click="toggleReservationStatus(reservation)" 
                    class="btn-toggle"
                    :title="reservation.is_active ? '無効化' : '有効化'"
                  >
                    {{ reservation.is_active ? '⏸️' : '▶️' }}
                  </button>
                  <button @click="deleteReservation(reservation)" class="btn-delete" title="削除">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
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
            {{ currentPage }} / {{ totalPages }} ページ ({{ filteredReservations.length }}件)
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
    </div>

    <!-- 新規予約モーダル -->
    <div v-if="showNewReservationModal" class="modal-overlay" @click="closeNewReservationModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>新規録音予約</h3>
          <button @click="closeNewReservationModal" class="btn-close">×</button>
        </div>
        
        <div class="modal-body">
          <ReservationForm 
            :stations="stations"
            @submit="handleNewReservation"
            @cancel="closeNewReservationModal"
          />
        </div>
      </div>
    </div>

    <!-- 編集モーダル -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>予約編集</h3>
          <button @click="closeEditModal" class="btn-close">×</button>
        </div>
        
        <div class="modal-body">
          <ReservationForm 
            :stations="stations"
            :initial-data="editingReservation"
            @submit="handleEditReservation"
            @cancel="closeEditModal"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { appState, actions } from '../store/index.js'
import { formatTime } from '../utils/dateUtils.js'
import ReservationForm from '../components/ReservationForm.vue'

export default {
  name: 'Reservations',
  components: {
    ReservationForm
  },
  setup() {
    // フィルター・検索
    const filterStatus = ref('all')
    const filterRepeat = ref('all')
    const searchTerm = ref('')
    
    // ページネーション
    const currentPage = ref(1)
    const itemsPerPage = 20
    
    // モーダル状態
    const showNewReservationModal = ref(false)
    const showEditModal = ref(false)
    const editingReservation = ref(null)
    
    // ストアからの状態
    const reservations = computed(() => appState.reservations)
    const upcomingReservations = computed(() => appState.upcomingReservations)
    const stations = computed(() => appState.stations)
    const loading = computed(() => appState.loading)
    const error = computed(() => appState.error)
    
    // フィルタリングされた予約一覧
    const filteredReservations = computed(() => {
      let filtered = [...reservations.value]
      
      // ステータスフィルター
      if (filterStatus.value !== 'all') {
        const isActive = filterStatus.value === 'active'
        filtered = filtered.filter(r => r.is_active === isActive)
      }
      
      // 繰り返しフィルター
      if (filterRepeat.value !== 'all') {
        filtered = filtered.filter(r => r.repeat_type === filterRepeat.value)
      }
      
      // 検索フィルター
      if (searchTerm.value.trim()) {
        const term = searchTerm.value.toLowerCase()
        filtered = filtered.filter(r => 
          r.title.toLowerCase().includes(term) ||
          r.station_name.toLowerCase().includes(term)
        )
      }
      
      return filtered.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    })
    
    // ページネーション計算
    const totalPages = computed(() => 
      Math.ceil(filteredReservations.value.length / itemsPerPage)
    )
    
    const paginatedReservations = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage
      const end = start + itemsPerPage
      return filteredReservations.value.slice(start, end)
    })
    
    // 日時フォーマット
    const formatDateTime = (dateTimeString) => {
      try {
        // YYYYMMDDHHMMSS -> YYYY-MM-DD HH:MM
        if (dateTimeString.length === 14) {
          const year = dateTimeString.substring(0, 4)
          const month = dateTimeString.substring(4, 6)
          const day = dateTimeString.substring(6, 8)
          const hour = dateTimeString.substring(8, 10)
          const minute = dateTimeString.substring(10, 12)
          return `${year}-${month}-${day} ${hour}:${minute}`
        }
        
        // ISO形式の場合
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
    
    // 繰り返しタイプのラベル
    const getRepeatTypeLabel = (type) => {
      const labels = {
        'none': '単発',
        'daily': '毎日',
        'weekly': '毎週',
        'weekdays': '平日'
      }
      return labels[type] || type
    }
    
    // フィルター適用
    const applyFilters = () => {
      currentPage.value = 1
    }
    
    // データ更新
    const refreshData = async () => {
      await Promise.all([
        actions.loadReservations(),
        actions.loadUpcomingReservations(),
        actions.loadStations()
      ])
    }
    
    // エラークリア
    const clearError = () => {
      actions.clearError()
    }
    
    // 新規予約モーダル
    const openNewReservationModal = () => {
      showNewReservationModal.value = true
    }
    
    const closeNewReservationModal = () => {
      showNewReservationModal.value = false
    }
    
    const handleNewReservation = async (reservationData) => {
      try {
        await actions.createReservation(reservationData)
        closeNewReservationModal()
        await actions.loadUpcomingReservations() // 近日予約も更新
      } catch (error) {
        console.error('Failed to create reservation:', error)
      }
    }
    
    // 編集モーダル
    const editReservation = (reservation) => {
      editingReservation.value = { ...reservation }
      showEditModal.value = true
    }
    
    const closeEditModal = () => {
      showEditModal.value = false
      editingReservation.value = null
    }
    
    const handleEditReservation = async (reservationData) => {
      try {
        await actions.updateReservation(editingReservation.value.id, reservationData)
        closeEditModal()
        await actions.loadUpcomingReservations() // 近日予約も更新
      } catch (error) {
        console.error('Failed to update reservation:', error)
      }
    }
    
    // 予約状態切り替え
    const toggleReservationStatus = async (reservation) => {
      const updatedData = {
        ...reservation,
        is_active: !reservation.is_active
      }
      
      try {
        await actions.updateReservation(reservation.id, updatedData)
        await actions.loadUpcomingReservations() // 近日予約も更新
      } catch (error) {
        console.error('Failed to toggle reservation status:', error)
      }
    }
    
    // 予約削除
    const deleteReservation = async (reservation) => {
      if (confirm(`「${reservation.title}」の予約を削除しますか？`)) {
        try {
          await actions.deleteReservation(reservation.id)
          await actions.loadUpcomingReservations() // 近日予約も更新
        } catch (error) {
          console.error('Failed to delete reservation:', error)
        }
      }
    }
    
    // 初期化
    onMounted(() => {
      refreshData()
    })
    
    return {
      // 状態
      reservations,
      upcomingReservations,
      stations,
      loading,
      error,
      
      // フィルター・検索
      filterStatus,
      filterRepeat,
      searchTerm,
      filteredReservations,
      
      // ページネーション
      currentPage,
      totalPages,
      paginatedReservations,
      
      // モーダル
      showNewReservationModal,
      showEditModal,
      editingReservation,
      
      // メソッド
      formatDateTime,
      getRepeatTypeLabel,
      applyFilters,
      refreshData,
      clearError,
      openNewReservationModal,
      closeNewReservationModal,
      handleNewReservation,
      editReservation,
      closeEditModal,
      handleEditReservation,
      toggleReservationStatus,
      deleteReservation
    }
  }
}
</script>

<style scoped>
.reservations {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
}

.reservations-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.reservations-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 2rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a6fd8;
}

.btn-secondary {
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
}

.btn-secondary:hover {
  background: #e9ecef;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

/* 近日予約アラート */
.upcoming-alert {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.upcoming-alert h3 {
  margin: 0 0 1rem 0;
  color: #856404;
  font-size: 1.1rem;
}

.upcoming-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 0.75rem;
}

.upcoming-item {
  background: white;
  padding: 0.75rem;
  border-radius: 6px;
  border-left: 4px solid #ffc107;
}

.upcoming-time {
  font-size: 0.9rem;
  color: #856404;
  font-weight: 500;
}

.upcoming-title {
  font-weight: 600;
  margin: 0.25rem 0;
}

.upcoming-station {
  font-size: 0.9rem;
  color: #666;
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
  color: #721c24;
}

/* テーブル */
.reservations-table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.reservations-table {
  width: 100%;
  border-collapse: collapse;
}

.reservations-table th {
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #dee2e6;
  color: #495057;
}

.reservations-table td {
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
  vertical-align: middle;
}

.reservations-table tr.inactive {
  opacity: 0.6;
}

.reservations-table tr:hover {
  background: #f8f9fa;
}

.title-cell {
  min-width: 200px;
}

.reservation-title {
  font-weight: 500;
  color: #2c3e50;
}

.time-cell {
  font-family: monospace;
  font-size: 0.9rem;
  white-space: nowrap;
}

.repeat-badge, .status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.repeat-none { background: #e9ecef; color: #495057; }
.repeat-daily { background: #d4edda; color: #155724; }
.repeat-weekly { background: #d1ecf1; color: #0c5460; }
.repeat-weekdays { background: #fff3cd; color: #856404; }

.status-active { background: #d4edda; color: #155724; }
.status-inactive { background: #f8d7da; color: #721c24; }

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-edit, .btn-toggle, .btn-delete {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
  font-size: 1rem;
}

.btn-edit:hover { background: #e3f2fd; }
.btn-toggle:hover { background: #fff3cd; }
.btn-delete:hover { background: #f8d7da; }

/* ページネーション */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
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

/* メッセージ */
.loading-message, .no-reservations {
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

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .reservations-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
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
  
  .upcoming-list {
    grid-template-columns: 1fr;
  }
  
  .reservations-table-container {
    overflow-x: auto;
  }
  
  .reservations-table {
    min-width: 800px;
  }
  
  .modal-content {
    width: 95%;
  }
}
</style>