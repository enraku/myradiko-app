<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1 class="page-title">
        <i class="fas fa-home"></i>
        ダッシュボード
      </h1>
      <div class="status-indicators">
        <div class="status-item" :class="{ active: schedulerActive }">
          <i class="fas fa-circle"></i>
          <span>{{ schedulerActive ? '録音サービス稼働中' : '録音サービス停止' }}</span>
        </div>
        <div class="status-item">
          <i class="fas fa-clock"></i>
          <span>{{ currentTime }}</span>
        </div>
      </div>
    </div>

    <!-- クイックアクション -->
    <div class="quick-actions">
      <h2 class="section-title">クイックアクション</h2>
      <div class="action-cards">
        <router-link to="/program-guide" class="action-card card fade-in">
          <div class="card-icon">
            <i class="fas fa-tv"></i>
          </div>
          <div class="card-content">
            <h3>番組表を見る</h3>
            <p>放送中・予定の番組を確認</p>
          </div>
        </router-link>

        <button @click="openQuickReservation" class="action-card clickable">
          <div class="card-icon">
            <i class="fas fa-plus-circle"></i>
          </div>
          <div class="card-content">
            <h3>手動予約</h3>
            <p>時間を指定して録音予約</p>
          </div>
        </button>

        <router-link to="/recordings" class="action-card">
          <div class="card-icon">
            <i class="fas fa-music"></i>
          </div>
          <div class="card-content">
            <h3>録音ファイル</h3>
            <p>録音済みファイルを管理</p>
          </div>
        </router-link>

        <router-link to="/settings" class="action-card">
          <div class="card-icon">
            <i class="fas fa-cog"></i>
          </div>
          <div class="card-content">
            <h3>設定</h3>
            <p>アプリの設定を変更</p>
          </div>
        </router-link>
      </div>
    </div>

    <!-- 統計情報 -->
    <div class="stats-section">
      <h2 class="section-title">統計情報</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-calendar-alt"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ totalReservations }}</div>
            <div class="stat-label">総予約数</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ completedRecordings }}</div>
            <div class="stat-label">録音完了</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-hdd"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ formatFileSize(totalFileSize) }}</div>
            <div class="stat-label">使用容量</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ formatDuration(totalDuration) }}</div>
            <div class="stat-label">総録音時間</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近の予約 -->
    <div class="recent-section">
      <h2 class="section-title">
        最近の予約
        <router-link to="/reservations" class="section-link">すべて見る</router-link>
      </h2>
      <div class="recent-items">
        <div v-if="recentReservations.length === 0" class="empty-state">
          <i class="fas fa-calendar-plus"></i>
          <p>予約がありません</p>
          <button @click="openQuickReservation" class="btn btn-primary">新しい予約を作成</button>
        </div>
        <div v-else>
          <div 
            v-for="reservation in recentReservations" 
            :key="reservation.id"
            class="reservation-item"
          >
            <div class="reservation-time">
              <div class="time">{{ formatTime(reservation.start_time) }}</div>
              <div class="date">{{ formatDate(reservation.date || getCurrentDate()) }}</div>
            </div>
            <div class="reservation-info">
              <h4>{{ reservation.title }}</h4>
              <p>{{ reservation.station_name }}</p>
            </div>
            <div class="reservation-status">
              <span class="status-badge" :class="reservation.status">
                {{ getStatusLabel(reservation.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 現在放送中 -->
    <div class="current-section" v-if="currentPrograms.length > 0">
      <h2 class="section-title">現在放送中</h2>
      <div class="current-programs">
        <div 
          v-for="program in currentPrograms" 
          :key="program.id"
          class="program-item"
        >
          <div class="program-station">{{ program.station_name }}</div>
          <div class="program-info">
            <h4>{{ program.title }}</h4>
            <p>{{ program.desc ? program.desc.substring(0, 100) + '...' : '' }}</p>
          </div>
          <div class="program-time">
            {{ formatTime(program.start_time) }} - {{ formatTime(program.end_time) }}
          </div>
          <button @click="reserveProgram(program)" class="btn btn-sm btn-primary">
            <i class="fas fa-plus"></i>
            予約
          </button>
        </div>
      </div>
    </div>

    <!-- クイック予約モーダル -->
    <div v-if="showQuickReservation" class="modal-overlay" @click="closeQuickReservation">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>手動予約</h3>
          <button @click="closeQuickReservation" class="modal-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>番組表から予約するか、詳細な予約管理画面をご利用ください。</p>
          <div class="modal-actions">
            <router-link to="/program-guide" class="btn btn-primary" @click="closeQuickReservation">
              番組表で予約
            </router-link>
            <router-link to="/reservations" class="btn btn-secondary" @click="closeQuickReservation">
              予約管理画面
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { appState, actions } from '../store/index.js'

export default {
  name: 'Dashboard',
  setup() {
    const currentTime = ref('')
    const showQuickReservation = ref(false)
    const schedulerActive = ref(false)
    const timeInterval = ref(null)

    // 現在時刻を更新
    const updateCurrentTime = () => {
      const now = new Date()
      currentTime.value = now.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    // 統計データ
    const totalReservations = computed(() => {
      return appState.reservations?.length || 0
    })

    const completedRecordings = computed(() => {
      return appState.recordings?.filter(r => r.status === 'completed')?.length || 0
    })

    const totalFileSize = computed(() => {
      return appState.recordings?.reduce((total, recording) => {
        return total + (recording.file_size || 0)
      }, 0) || 0
    })

    const totalDuration = computed(() => {
      return appState.recordings?.reduce((total, recording) => {
        return total + (recording.duration || 0)
      }, 0) || 0
    })

    // 最近の予約
    const recentReservations = computed(() => {
      return (appState.reservations || []).slice(0, 5)
    })

    // 現在放送中の番組（モックデータ）
    const currentPrograms = computed(() => {
      // 実際の実装では現在時刻と番組データを比較
      return []
    })

    // ユーティリティ関数
    const formatTime = (timeString) => {
      if (!timeString) return ''
      return timeString.substring(0, 5) // HH:MM
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('ja-JP', {
        month: '2-digit',
        day: '2-digit'
      })
    }

    const getCurrentDate = () => {
      return new Date().toISOString().split('T')[0]
    }

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    const formatDuration = (seconds) => {
      if (!seconds) return '0分'
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      
      if (hours > 0) {
        return `${hours}時間${minutes}分`
      }
      return `${minutes}分`
    }

    const getStatusLabel = (status) => {
      const labels = {
        active: 'アクティブ',
        completed: '完了',
        failed: '失敗',
        pending: '待機中'
      }
      return labels[status] || status
    }

    // アクション
    const openQuickReservation = () => {
      showQuickReservation.value = true
    }

    const closeQuickReservation = () => {
      showQuickReservation.value = false
    }

    const reserveProgram = async (program) => {
      try {
        const reservationData = {
          title: program.title,
          station_id: program.station_id,
          station_name: program.station_name,
          start_time: program.start_time,
          end_time: program.end_time,
          repeat_type: 'none'
        }
        
        await actions.createReservation(reservationData)
        // 成功通知は store で処理
      } catch (error) {
        console.error('予約作成エラー:', error)
      }
    }

    // ライフサイクル
    onMounted(async () => {
      updateCurrentTime()
      timeInterval.value = setInterval(updateCurrentTime, 1000)
      
      // データ読み込み
      try {
        await Promise.all([
          actions.loadReservations(),
          actions.loadRecordings()
        ])
      } catch (error) {
        console.error('ダッシュボードデータ読み込みエラー:', error)
      }
    })

    onUnmounted(() => {
      if (timeInterval.value) {
        clearInterval(timeInterval.value)
      }
    })

    return {
      currentTime,
      showQuickReservation,
      schedulerActive,
      totalReservations,
      completedRecordings,
      totalFileSize,
      totalDuration,
      recentReservations,
      currentPrograms,
      
      formatTime,
      formatDate,
      getCurrentDate,
      formatFileSize,
      formatDuration,
      getStatusLabel,
      openQuickReservation,
      closeQuickReservation,
      reserveProgram
    }
  }
}
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  margin: 0;
  color: #2c3e50;
  font-size: 2.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-indicators {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #6c757d;
}

.status-item.active {
  background: #d4edda;
  color: #155724;
}

.status-item.active .fas {
  color: #28a745;
}

.section-title {
  color: #2c3e50;
  font-size: 1.4rem;
  margin: 0 0 1.5rem 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-link {
  font-size: 0.9rem;
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.section-link:hover {
  text-decoration: underline;
}

/* クイックアクション */
.quick-actions {
  margin-bottom: 3rem;
}

.action-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.action-card {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
  width: 100%;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.action-card.clickable {
  cursor: pointer;
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
}

.card-icon i {
  font-size: 1.5rem;
  color: white;
}

.card-content h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.card-content p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

/* 統計情報 */
.stats-section {
  margin-bottom: 3rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
}

.stat-icon i {
  font-size: 1.2rem;
  color: #667eea;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.85rem;
  color: #6c757d;
}

/* 最近の予約 */
.recent-section {
  margin-bottom: 3rem;
}

.recent-items {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: #6c757d;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #dee2e6;
}

.reservation-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f8f9fa;
}

.reservation-item:last-child {
  border-bottom: none;
}

.reservation-time {
  flex-shrink: 0;
  margin-right: 1rem;
  text-align: center;
  min-width: 80px;
}

.reservation-time .time {
  font-weight: 600;
  color: #2c3e50;
}

.reservation-time .date {
  font-size: 0.85rem;
  color: #6c757d;
}

.reservation-info {
  flex: 1;
}

.reservation-info h4 {
  margin: 0 0 0.25rem 0;
  color: #2c3e50;
  font-size: 1rem;
}

.reservation-info p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.completed {
  background: #cce5ff;
  color: #004085;
}

.status-badge.failed {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

/* 現在放送中 */
.current-section {
  margin-bottom: 3rem;
}

.current-programs {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.program-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f8f9fa;
}

.program-item:last-child {
  border-bottom: none;
}

.program-station {
  flex-shrink: 0;
  background: #667eea;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-right: 1rem;
}

.program-info {
  flex: 1;
  margin-right: 1rem;
}

.program-info h4 {
  margin: 0 0 0.25rem 0;
  color: #2c3e50;
}

.program-info p {
  margin: 0;
  color: #6c757d;
  font-size: 0.85rem;
}

.program-time {
  flex-shrink: 0;
  margin-right: 1rem;
  font-size: 0.9rem;
  color: #6c757d;
}

/* モーダル */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #6c757d;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
}

.modal-close:hover {
  background: #f8f9fa;
}

.modal-body {
  padding: 1.5rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

/* ボタンスタイル */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
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
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: stretch;
  }

  .status-indicators {
    justify-content: center;
  }

  .action-cards {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .reservation-item,
  .program-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .modal-actions {
    flex-direction: column;
  }
}
</style>