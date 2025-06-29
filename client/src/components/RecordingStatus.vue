<template>
  <div class="recording-status" v-if="activeRecordings.length > 0">
    <div class="recording-header">
      <span class="recording-icon">🔴</span>
      <h3>録音中 ({{ activeRecordings.length }}件)</h3>
      <button @click="refreshStatus" class="refresh-btn" :disabled="loading">
        🔄
      </button>
    </div>
    
    <div class="recording-list">
      <div 
        v-for="recording in activeRecordings" 
        :key="recording.id"
        class="recording-item"
      >
        <div class="recording-info">
          <div class="recording-title">{{ recording.title }}</div>
          <div class="recording-station">{{ recording.stationName }}</div>
          <div class="recording-time">
            {{ formatTime(recording.startTime) }} - {{ formatTime(recording.endTime) }}
          </div>
          <div class="recording-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: getProgress(recording) + '%' }"
              ></div>
            </div>
            <span class="progress-text">{{ getProgress(recording).toFixed(1) }}%</span>
          </div>
        </div>
        
        <button 
          @click="stopRecording(recording.id)" 
          class="stop-btn"
          :disabled="stopping.includes(recording.id)"
        >
          {{ stopping.includes(recording.id) ? '停止中...' : '停止' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'

export default {
  name: 'RecordingStatus',
  setup() {
    const activeRecordings = ref([])
    const loading = ref(false)
    const stopping = ref([])
    const refreshInterval = ref(null)

    const refreshStatus = async () => {
      if (loading.value) return
      
      loading.value = true
      try {
        const response = await axios.get('/api/scheduler/active')
        if (response.data.success) {
          activeRecordings.value = response.data.data.recordings
        }
      } catch (error) {
        console.error('Failed to fetch active recordings:', error)
      } finally {
        loading.value = false
      }
    }

    const stopRecording = async (recordingId) => {
      if (stopping.value.includes(recordingId)) return
      
      stopping.value.push(recordingId)
      try {
        const response = await axios.post(`/api/scheduler/recordings/${recordingId}/stop`)
        if (response.data.success) {
          // 録音リストから削除
          activeRecordings.value = activeRecordings.value.filter(
            recording => recording.id !== recordingId
          )
          
          // 成功通知
          alert('録音を停止しました')
        }
      } catch (error) {
        console.error('Failed to stop recording:', error)
        alert('録音の停止に失敗しました: ' + error.message)
      } finally {
        stopping.value = stopping.value.filter(id => id !== recordingId)
      }
    }

    const formatTime = (timeString) => {
      const date = new Date(timeString)
      return date.toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit'
      })
    }

    const getProgress = (recording) => {
      const now = new Date()
      const start = new Date(recording.startTime)
      const end = new Date(recording.endTime)
      
      if (now < start) return 0
      if (now > end) return 100
      
      const total = end - start
      const elapsed = now - start
      return Math.min(100, Math.max(0, (elapsed / total) * 100))
    }

    // 定期的な状態更新
    const startPolling = () => {
      refreshStatus()
      refreshInterval.value = setInterval(refreshStatus, 5000) // 5秒ごと
    }

    const stopPolling = () => {
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value)
        refreshInterval.value = null
      }
    }

    onMounted(() => {
      startPolling()
    })

    onUnmounted(() => {
      stopPolling()
    })

    return {
      activeRecordings,
      loading,
      stopping,
      refreshStatus,
      stopRecording,
      formatTime,
      getProgress
    }
  }
}
</script>

<style scoped>
.recording-status {
  background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
  color: white;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 12px rgba(238, 90, 111, 0.3);
}

.recording-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.recording-icon {
  font-size: 1.2rem;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.recording-header h3 {
  margin: 0;
  flex: 1;
  font-size: 1.1rem;
}

.refresh-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.recording-list {
  space-y: 0.75rem;
}

.recording-item {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.recording-info {
  flex: 1;
}

.recording-title {
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
}

.recording-station {
  font-size: 0.85rem;
  opacity: 0.9;
  margin-bottom: 0.25rem;
}

.recording-time {
  font-size: 0.8rem;
  opacity: 0.8;
  margin-bottom: 0.5rem;
}

.recording-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: white;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  opacity: 0.9;
  min-width: 3rem;
  text-align: right;
}

.stop-btn {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  color: #ee5a6f;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}

.stop-btn:hover:not(:disabled) {
  background: white;
  transform: translateY(-1px);
}

.stop-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
</style>