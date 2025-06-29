<template>
  <div class="program-guide">
    <div class="guide-header">
      <h2>📻 番組表</h2>
      
      <div class="guide-controls">
        <!-- 放送局選択 -->
        <div class="control-group">
          <label for="station-select">放送局:</label>
          <select 
            id="station-select" 
            v-model="selectedStationId" 
            @change="handleStationChange"
            @input="handleStationChange"
            class="select-input"
          >
            <option value="">放送局を選択...</option>
            <option 
              v-for="station in stations" 
              :key="station.id" 
              :value="station.id"
            >
              {{ station.name }}
            </option>
          </select>
        </div>
        
        <!-- 日付選択 -->
        <div class="control-group">
          <label for="date-select">日付:</label>
          <input 
            id="date-select"
            type="date" 
            v-model="selectedDateInput"
            @change="handleDateChange"
            class="date-input"
          />
        </div>
        
        <!-- 表示形式切り替え -->
        <div class="control-group">
          <label>表示:</label>
          <div class="toggle-buttons">
            <button 
              @click="setViewMode('timetable')"
              :class="{ active: viewMode === 'timetable' }"
              class="toggle-btn"
            >
              タイムテーブル
            </button>
            <button 
              @click="setViewMode('list')"
              :class="{ active: viewMode === 'list' }"
              class="toggle-btn"
            >
              リスト
            </button>
          </div>
        </div>
      </div>
      
      <!-- 検索・フィルターエリア -->
      <div class="search-filter-section">
        <div class="search-controls">
          <!-- 検索バー -->
          <div class="search-group">
            <label for="search-input">🔍 番組検索:</label>
            <input 
              id="search-input"
              v-model="searchQuery"
              type="text"
              placeholder="番組名、出演者、キーワードで検索..."
              class="search-input"
              @input="onSearchInput"
            >
            <button 
              v-if="searchQuery"
              @click="clearSearch"
              class="clear-search-btn"
              title="検索をクリア"
            >
              ×
            </button>
          </div>
          
          <!-- フィルター -->
          <div class="filter-controls">
            <div class="filter-group">
              <label for="genre-filter">ジャンル:</label>
              <select 
                id="genre-filter"
                v-model="selectedGenre"
                class="filter-select"
                @change="applyFilters"
              >
                <option value="">すべて</option>
                <option value="music">音楽</option>
                <option value="news">ニュース</option>
                <option value="talk">トーク</option>
                <option value="entertainment">バラエティ</option>
                <option value="sports">スポーツ</option>
                <option value="education">教育</option>
                <option value="drama">ドラマ</option>
                <option value="other">その他</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="time-filter">時間帯:</label>
              <select 
                id="time-filter"
                v-model="selectedTimeRange"
                class="filter-select"
                @change="applyFilters"
              >
                <option value="">すべて</option>
                <option value="morning">朝 (5:00-12:00)</option>
                <option value="afternoon">昼 (12:00-18:00)</option>
                <option value="evening">夜 (18:00-24:00)</option>
                <option value="midnight">深夜 (0:00-5:00)</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="duration-filter">番組長:</label>
              <select 
                id="duration-filter"
                v-model="selectedDuration"
                class="filter-select"
                @change="applyFilters"
              >
                <option value="">すべて</option>
                <option value="short">短時間 (30分以下)</option>
                <option value="medium">中時間 (30分-2時間)</option>
                <option value="long">長時間 (2時間以上)</option>
              </select>
            </div>
          </div>
        </div>
        
        <!-- フィルター結果表示 -->
        <div v-if="isFiltering" class="filter-results">
          <span class="results-count">
            {{ filteredPrograms.length }}件の番組が見つかりました
          </span>
          <button @click="clearAllFilters" class="clear-filters-btn">
            すべてのフィルターをクリア
          </button>
        </div>
      </div>
    </div>
    
    <!-- 番組表表示エリア -->
    <div class="programs-container">
      <div v-if="!selectedStationId" class="no-station">
        放送局を選択してください
      </div>
      
      <div v-else-if="loading" class="loading-message">
        番組データを読み込み中...
      </div>
      
      <div v-else-if="!programs.length" class="no-programs">
        選択した日付に番組データがありません
      </div>
      
      <div v-else class="programs-content">
        <!-- フィルタリング結果が空の場合 -->
        <div v-if="isFiltering && !filteredPrograms.length" class="no-filtered-programs">
          <div class="no-results-message">
            <h3>🔍 検索結果がありません</h3>
            <p>検索条件やフィルターを変更してみてください</p>
            <button @click="clearAllFilters" class="clear-filters-btn">
              フィルターをクリア
            </button>
          </div>
        </div>
        
        <!-- 番組データがある場合 -->
        <div v-else>
          <!-- タイムテーブル表示 -->
          <div v-if="viewMode === 'timetable'" class="timetable-view">
            <div class="time-slots">
              <div 
                v-for="program in displayPrograms" 
                :key="program.id"
                class="program-slot"
                :class="{ 
                  'current-program': isCurrentProgram(program),
                  'highlighted': isHighlighted(program)
                }"
              >
                <div class="program-time">
                  {{ formatTime(program.start_time) }} - {{ formatTime(program.end_time) }}
                  <span class="program-duration">({{ calculateDuration(program) }}分)</span>
                </div>
                <div class="program-title">
                  <span v-html="highlightSearchTerm(program.title)"></span>
                </div>
                <div v-if="program.sub_title" class="program-subtitle">
                  <span v-html="highlightSearchTerm(program.sub_title)"></span>
                </div>
                <div v-if="program.desc" class="program-desc">
                  <span v-html="highlightSearchTerm(truncateText(program.desc, 100))"></span>
                </div>
                <div v-if="program.performer" class="program-performer">
                  出演: <span v-html="highlightSearchTerm(program.performer)"></span>
                </div>
                <div class="program-actions">
                  <button 
                    v-if="isPastProgram(program)" 
                    @click="downloadProgram(program)" 
                    class="download-btn"
                    :disabled="downloading.includes(program.id)"
                  >
                    {{ downloading.includes(program.id) ? 'ダウンロード中...' : 'ダウンロード' }}
                  </button>
                  <button 
                    v-else 
                    @click="reserveProgram(program)" 
                    class="reserve-btn"
                  >
                    録音予約
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- リスト表示 -->
          <div v-else class="list-view">
            <table class="programs-table">
              <thead>
                <tr>
                  <th>時間</th>
                  <th>番組名</th>
                  <th>説明</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="program in displayPrograms" 
                  :key="program.id"
                  :class="{ 
                    'current-program': isCurrentProgram(program),
                    'highlighted': isHighlighted(program)
                  }"
                >
                  <td class="time-cell">
                    {{ formatTime(program.start_time) }}<br>
                    <small>{{ formatTime(program.end_time) }}</small>
                    <div class="duration-info">{{ calculateDuration(program) }}分</div>
                  </td>
                  <td class="title-cell">
                    <strong><span v-html="highlightSearchTerm(program.title)"></span></strong>
                    <div v-if="program.sub_title" class="sub-title">
                      <span v-html="highlightSearchTerm(program.sub_title)"></span>
                    </div>
                    <div v-if="program.performer" class="performer-info">
                      出演: <span v-html="highlightSearchTerm(program.performer)"></span>
                    </div>
                  </td>
                  <td class="desc-cell">
                    <div v-if="program.desc" class="program-description">
                      <span v-html="highlightSearchTerm(truncateText(program.desc, 150))"></span>
                    </div>
                  </td>
                  <td class="action-cell">
                    <button 
                      v-if="isPastProgram(program)" 
                      @click="downloadProgram(program)" 
                      class="download-btn"
                      :disabled="downloading.includes(program.id)"
                    >
                      {{ downloading.includes(program.id) ? 'ダウンロード中...' : 'ダウンロード' }}
                    </button>
                    <button 
                      v-else 
                      @click="reserveProgram(program)" 
                      class="reserve-btn"
                    >
                      録音予約
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { appState, actions } from '../store/index.js'
import { formatTime, getTodayRadikoDate, addDaysToRadikoDate, isTimeInRange } from '../utils/dateUtils.js'
import axios from 'axios'

export default {
  name: 'ProgramGuide',
  setup() {
    const selectedStationId = ref('')
    const selectedDateInput = ref('')
    
    // 検索・フィルタリング状態
    const searchQuery = ref('')
    const selectedGenre = ref('')
    const selectedTimeRange = ref('')
    const selectedDuration = ref('')
    
    // ダウンロード状態
    const downloading = ref([])
    
    // 今日の日付をデフォルトに設定
    const today = new Date()
    selectedDateInput.value = today.toISOString().split('T')[0]
    
    const stations = computed(() => appState.stations)
    const programs = computed(() => appState.programs)
    const loading = computed(() => appState.loading)
    const viewMode = computed(() => appState.viewMode)
    
    // 計算プロパティ：フィルタリングされた番組リスト
    const filteredPrograms = computed(() => {
      let filtered = programs.value

      // 検索クエリによるフィルタリング
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim()
        filtered = filtered.filter(program => {
          return (
            program.title?.toLowerCase().includes(query) ||
            program.sub_title?.toLowerCase().includes(query) ||
            program.desc?.toLowerCase().includes(query) ||
            program.performer?.toLowerCase().includes(query)
          )
        })
      }

      // ジャンルフィルタリング
      if (selectedGenre.value) {
        filtered = filtered.filter(program => {
          return inferGenre(program) === selectedGenre.value
        })
      }

      // 時間帯フィルタリング
      if (selectedTimeRange.value) {
        filtered = filtered.filter(program => {
          const hour = parseInt(program.start_time.substring(8, 10))
          switch (selectedTimeRange.value) {
            case 'morning':
              return hour >= 5 && hour < 12
            case 'afternoon':
              return hour >= 12 && hour < 18
            case 'evening':
              return hour >= 18 && hour < 24
            case 'midnight':
              return hour >= 0 && hour < 5
            default:
              return true
          }
        })
      }

      // 番組時間フィルタリング
      if (selectedDuration.value) {
        filtered = filtered.filter(program => {
          const duration = calculateDuration(program)
          switch (selectedDuration.value) {
            case 'short':
              return duration <= 30
            case 'medium':
              return duration > 30 && duration <= 120
            case 'long':
              return duration > 120
            default:
              return true
          }
        })
      }

      return filtered
    })

    // 表示する番組リスト（フィルタリングが有効かどうかに応じて切り替え）
    const displayPrograms = computed(() => {
      return isFiltering.value ? filteredPrograms.value : programs.value
    })

    // フィルタリングが有効かどうか
    const isFiltering = computed(() => {
      return !!(searchQuery.value.trim() || selectedGenre.value || selectedTimeRange.value || selectedDuration.value)
    })

    const onStationChange = async (event) => {
      console.log('=== handleStationChange called ===')
      console.log('Event:', event)
      console.log('Event target value:', event?.target?.value)
      console.log('selectedStationId.value:', selectedStationId.value)
      
      const stationId = event?.target?.value || selectedStationId.value
      console.log('Using station ID:', stationId)
      
      if (stationId) {
        const station = stations.value.find(s => s.id === stationId)
        if (station) {
          console.log('Found station:', station.name)
          selectedStationId.value = stationId
          actions.setSelectedStation(station)
          await loadPrograms()
        } else {
          console.log('Station not found for ID:', stationId)
        }
      } else {
        console.log('No station ID provided')
      }
    }
    
    const onDateChange = async () => {
      console.log('Date changed to:', selectedDateInput.value)
      await loadPrograms()
    }
    
    const loadPrograms = async () => {
      if (selectedStationId.value && selectedDateInput.value) {
        const radikoDate = selectedDateInput.value.replace(/-/g, '')
        console.log('Loading programs for station:', selectedStationId.value, 'date:', radikoDate)
        actions.setSelectedDate(radikoDate)
        await actions.loadPrograms(selectedStationId.value, radikoDate)
        console.log('Programs loaded:', programs.value.length)
      } else {
        console.log('Missing station or date:', selectedStationId.value, selectedDateInput.value)
      }
    }
    
    const setViewMode = (mode) => {
      actions.setViewMode(mode)
    }
    
    const isCurrentProgram = (program) => {
      return isTimeInRange(program.start_time, program.end_time)
    }
    
    const reserveProgram = async (program) => {
      try {
        const reservationData = {
          title: program.title,
          station_id: selectedStationId.value,
          station_name: appState.selectedStation?.name || '',
          start_time: program.start_time,
          end_time: program.end_time,
          repeat_type: 'none'
        }
        
        await actions.createReservation(reservationData)
        alert('録音予約を作成しました')
      } catch (error) {
        alert('録音予約の作成に失敗しました: ' + error.message)
      }
    }

    // 検索・フィルタリング関数
    const onSearchInput = () => {
      // 検索入力時の処理（リアルタイム検索）
    }

    const applyFilters = () => {
      // フィルターが変更された時の処理
    }

    const clearSearch = () => {
      searchQuery.value = ''
    }

    const clearAllFilters = () => {
      searchQuery.value = ''
      selectedGenre.value = ''
      selectedTimeRange.value = ''
      selectedDuration.value = ''
    }

    // ヘルパー関数
    const inferGenre = (program) => {
      const title = program.title?.toLowerCase() || ''
      const desc = program.desc?.toLowerCase() || ''
      
      if (title.includes('ニュース') || title.includes('news') || desc.includes('ニュース')) {
        return 'news'
      }
      if (title.includes('音楽') || title.includes('music') || title.includes('ミュージック')) {
        return 'music'
      }
      if (title.includes('スポーツ') || title.includes('野球') || title.includes('サッカー')) {
        return 'sports'
      }
      if (title.includes('バラエティ') || title.includes('お笑い') || title.includes('コメディ')) {
        return 'entertainment'
      }
      if (title.includes('トーク') || title.includes('対談')) {
        return 'talk'
      }
      if (title.includes('教育') || title.includes('講座') || title.includes('学習')) {
        return 'education'
      }
      if (title.includes('ドラマ') || title.includes('朗読')) {
        return 'drama'
      }
      return 'other'
    }

    const calculateDuration = (program) => {
      const start = new Date(
        program.start_time.substring(0, 4) + '-' + 
        program.start_time.substring(4, 6) + '-' + 
        program.start_time.substring(6, 8) + 'T' + 
        program.start_time.substring(8, 10) + ':' + 
        program.start_time.substring(10, 12) + ':00'
      )
      const end = new Date(
        program.end_time.substring(0, 4) + '-' + 
        program.end_time.substring(4, 6) + '-' + 
        program.end_time.substring(6, 8) + 'T' + 
        program.end_time.substring(8, 10) + ':' + 
        program.end_time.substring(10, 12) + ':00'
      )
      return Math.round((end - start) / (1000 * 60))
    }

    const highlightSearchTerm = (text) => {
      if (!text || !searchQuery.value.trim()) {
        return text
      }
      const query = searchQuery.value.trim()
      const regex = new RegExp(`(${query})`, 'gi')
      return text.replace(regex, '<mark>$1</mark>')
    }

    const truncateText = (text, length) => {
      if (!text) return ''
      return text.length > length ? text.substring(0, length) + '...' : text
    }

    const isHighlighted = (program) => {
      if (!searchQuery.value.trim()) return false
      const query = searchQuery.value.toLowerCase().trim()
      return (
        program.title?.toLowerCase().includes(query) ||
        program.sub_title?.toLowerCase().includes(query) ||
        program.desc?.toLowerCase().includes(query) ||
        program.performer?.toLowerCase().includes(query)
      )
    }
    
    // 初期化
    onMounted(() => {
      // デフォルトで最初の放送局を選択
      if (stations.value.length > 0) {
        selectedStationId.value = stations.value[0].id
        onStationChange()
      }
    })
    
    // 放送局リストが更新されたら最初の放送局を選択
    watch(stations, (newStations) => {
      if (newStations.length > 0 && !selectedStationId.value) {
        selectedStationId.value = newStations[0].id
        onStationChange()
      }
    })
    
    // 放送局変更を監視
    watch(selectedStationId, async (newStationId, oldStationId) => {
      console.log('Watch: Station changed from', oldStationId, 'to', newStationId)
      if (newStationId) {
        const station = stations.value.find(s => s.id === newStationId)
        if (station) {
          console.log('Found station:', station.name)
          actions.setSelectedStation(station)
          await loadPrograms()
        }
      }
    }, { immediate: false })
    
    // 日付変更を監視  
    watch(selectedDateInput, async (newDate, oldDate) => {
      console.log('Watch: Date changed from', oldDate, 'to', newDate)
      if (newDate && selectedStationId.value) {
        await loadPrograms()
      }
    }, { immediate: false })
    
    // 過去番組判定
    const isPastProgram = (program) => {
      const now = new Date()
      const programEnd = new Date(program.end_time)
      return programEnd < now
    }
    
    // 番組ダウンロード
    const downloadProgram = async (program) => {
      if (downloading.value.includes(program.id)) return
      
      downloading.value.push(program.id)
      
      try {
        const response = await axios.post('/api/downloads', {
          stationId: program.station_id,
          startTime: program.start_time,
          endTime: program.end_time,
          title: program.title,
          stationName: stations.value.find(s => s.id === program.station_id)?.name || program.station_id
        })
        
        if (response.data.success) {
          alert(`ダウンロードを開始しました: ${program.title}`)
        }
      } catch (error) {
        console.error('Failed to start download:', error)
        alert('ダウンロードの開始に失敗しました: ' + (error.response?.data?.message || error.message))
      } finally {
        downloading.value = downloading.value.filter(id => id !== program.id)
      }
    }
    
    return {
      selectedStationId,
      selectedDateInput,
      stations,
      programs,
      loading,
      viewMode,
      handleStationChange: onStationChange,
      handleDateChange: onDateChange,
      setViewMode,
      isCurrentProgram,
      reserveProgram,
      formatTime,
      appState,
      
      // 検索・フィルタリング
      searchQuery,
      selectedGenre,
      selectedTimeRange,
      selectedDuration,
      filteredPrograms,
      displayPrograms,
      isFiltering,
      onSearchInput,
      applyFilters,
      clearSearch,
      clearAllFilters,
      highlightSearchTerm,
      truncateText,
      isHighlighted,
      calculateDuration,
      
      // ダウンロード機能
      isPastProgram,
      downloadProgram,
      downloading
    }
  }
}
</script>

<style scoped>
.program-guide {
  max-width: 1200px;
  margin: 0 auto;
}

.guide-header {
  margin-bottom: 2rem;
}

.guide-header h2 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
  font-size: 2rem;
}

.guide-controls {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  align-items: end;
  margin-bottom: 1.5rem;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group label {
  font-weight: 500;
  color: #555;
}

.select-input, .date-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  min-width: 200px;
}

.toggle-buttons {
  display: flex;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
}

.toggle-btn {
  padding: 0.75rem 1.25rem;
  border: none;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: #f5f5f5;
}

.toggle-btn.active {
  background: #667eea;
  color: white;
}

/* 検索・フィルターセクション */
.search-filter-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.search-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-group label {
  font-weight: 600;
  color: #333;
  min-width: 120px;
}

.search-input {
  flex: 1;
  min-width: 300px;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.clear-search-btn {
  padding: 0.5rem 0.75rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.clear-search-btn:hover {
  background: #545b62;
}

.filter-controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 150px;
}

.filter-group label {
  font-weight: 500;
  color: #555;
  font-size: 0.9rem;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.filter-results {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #e3f2fd;
  border-radius: 6px;
  margin-top: 1rem;
}

.results-count {
  font-weight: 600;
  color: #1976d2;
}

.clear-filters-btn {
  padding: 0.5rem 1rem;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.clear-filters-btn:hover {
  background: #1565c0;
}

.programs-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.no-station, .no-programs {
  padding: 3rem;
  text-align: center;
  color: #666;
  font-size: 1.1rem;
}

.no-filtered-programs {
  padding: 3rem;
  text-align: center;
}

.no-results-message h3 {
  color: #666;
  margin-bottom: 1rem;
}

.no-results-message p {
  color: #888;
  margin-bottom: 1.5rem;
}

/* タイムテーブル表示 */
.timetable-view {
  padding: 1rem;
}

.time-slots {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.program-slot {
  padding: 1rem;
  border-left: 4px solid #e0e0e0;
  background: #fafafa;
  transition: all 0.2s;
}

.program-slot:hover {
  background: #f0f0f0;
}

.program-slot.current-program {
  border-left-color: #667eea;
  background: #f0f4ff;
}

.program-slot.highlighted {
  border-left-color: #ff9800;
  background: #fff3e0;
}

.program-time {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.program-duration {
  color: #999;
  font-size: 0.8rem;
  margin-left: 0.5rem;
}

.program-title {
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.program-subtitle {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.program-desc {
  color: #666;
  line-height: 1.4;
  margin-bottom: 0.75rem;
}

.program-performer {
  font-size: 0.9rem;
  color: #777;
  margin-bottom: 0.75rem;
}

.program-actions {
  margin-top: 0.75rem;
}

/* リスト表示 */
.list-view {
  overflow-x: auto;
}

.programs-table {
  width: 100%;
  border-collapse: collapse;
}

.programs-table th {
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #dee2e6;
}

.programs-table td {
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
  vertical-align: top;
}

.programs-table tr.current-program {
  background: #f0f4ff;
}

.programs-table tr.highlighted {
  background: #fff3e0;
}

.time-cell {
  white-space: nowrap;
  width: 120px;
}

.time-cell small {
  color: #666;
}

.duration-info {
  font-size: 0.8rem;
  color: #999;
  margin-top: 0.25rem;
}

.title-cell {
  min-width: 200px;
}

.sub-title {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.25rem;
}

.performer-info {
  font-size: 0.8rem;
  color: #777;
  margin-top: 0.25rem;
}

.desc-cell {
  max-width: 300px;
}

.program-description {
  line-height: 1.4;
  color: #555;
}

.action-cell {
  width: 120px;
}

.reserve-btn {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.reserve-btn:hover {
  background: #5a6fd8;
}

.download-btn {
  padding: 0.5rem 1rem;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.download-btn:hover:not(:disabled) {
  background: #ee5a5a;
}

.download-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

/* 検索ハイライト */
:global(mark) {
  background-color: #ffeb3b;
  padding: 0 2px;
  border-radius: 2px;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .guide-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .control-group {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  
  .select-input, .date-input {
    min-width: auto;
    flex: 1;
  }

  .search-group {
    flex-direction: column;
    align-items: stretch;
  }

  .search-group label {
    min-width: auto;
  }

  .search-input {
    min-width: auto;
  }

  .filter-controls {
    flex-direction: column;
  }

  .filter-group {
    min-width: auto;
  }

  .filter-results {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .timetable-view {
    padding: 0.5rem;
  }
  
  .program-slot {
    padding: 0.75rem;
  }
  
  .programs-table th,
  .programs-table td {
    padding: 0.75rem 0.5rem;
  }
  
  .desc-cell {
    max-width: 200px;
  }
}
</style>