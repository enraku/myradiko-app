import { reactive, readonly } from 'vue'
import { stations, programs, reservations, recordings, settings } from '../services/api.js'

// アプリケーション全体の状態
const state = reactive({
  // 放送局データ
  stations: [],
  selectedStation: null,
  
  // 番組表データ
  programs: [],
  currentPrograms: {},
  selectedDate: new Date().toISOString().split('T')[0].replace(/-/g, ''),
  
  // 予約データ
  reservations: [],
  upcomingReservations: [],
  
  // 録音履歴データ
  recordings: [],
  recentRecordings: [],
  
  // 設定データ
  settings: {},
  
  // UI状態
  loading: false,
  error: null,
  
  // 表示設定
  viewMode: 'timetable', // 'timetable' or 'list'
  timeFormat: '24', // '12' or '24'
})

// アクション
const actions = {
  // エラー処理
  setError(error) {
    state.error = error?.response?.data?.message || error?.message || 'エラーが発生しました'
  },
  
  clearError() {
    state.error = null
  },
  
  // ローディング状態
  setLoading(loading) {
    state.loading = loading
  },
  
  // 放送局関連
  async loadStations() {
    try {
      this.setLoading(true)
      this.clearError()
      
      const response = await stations.getTokyoStations()
      state.stations = response.data.data
      
      // デフォルトで最初の放送局を選択
      if (state.stations.length > 0 && !state.selectedStation) {
        state.selectedStation = state.stations[0]
      }
    } catch (error) {
      this.setError(error)
    } finally {
      this.setLoading(false)
    }
  },
  
  setSelectedStation(station) {
    state.selectedStation = station
  },
  
  // 番組表関連
  async loadPrograms(stationId, date) {
    try {
      this.setLoading(true)
      this.clearError()
      
      console.log('Store: Loading programs for', stationId, date)
      const response = await programs.getProgramsByDate(stationId, date)
      console.log('Store: API response:', response.data)
      state.programs = response.data.data
      console.log('Store: Programs set to state:', state.programs.length)
    } catch (error) {
      console.error('Store: Error loading programs:', error)
      this.setError(error)
    } finally {
      this.setLoading(false)
    }
  },
  
  async loadCurrentProgram(stationId) {
    try {
      const response = await programs.getCurrentProgram(stationId)
      if (response.data.data) {
        state.currentPrograms[stationId] = response.data.data
      }
    } catch (error) {
      console.warn(`Failed to load current program for ${stationId}:`, error.message)
    }
  },
  
  setSelectedDate(date) {
    state.selectedDate = date
  },
  
  // 予約関連
  async loadReservations() {
    try {
      this.setLoading(true)
      this.clearError()
      
      const response = await reservations.getAll()
      state.reservations = response.data.data
    } catch (error) {
      this.setError(error)
    } finally {
      this.setLoading(false)
    }
  },
  
  async loadUpcomingReservations() {
    try {
      const response = await reservations.getUpcoming(24)
      state.upcomingReservations = response.data.data
    } catch (error) {
      console.warn('Failed to load upcoming reservations:', error.message)
    }
  },
  
  async createReservation(reservationData) {
    try {
      this.setLoading(true)
      this.clearError()
      
      await reservations.create(reservationData)
      await this.loadReservations() // 一覧を再読み込み
    } catch (error) {
      this.setError(error)
    } finally {
      this.setLoading(false)
    }
  },
  
  async updateReservation(id, reservationData) {
    try {
      this.setLoading(true)
      this.clearError()
      
      await reservations.update(id, reservationData)
      await this.loadReservations() // 一覧を再読み込み
    } catch (error) {
      this.setError(error)
    } finally {
      this.setLoading(false)
    }
  },

  async deleteReservation(id) {
    try {
      this.setLoading(true)
      this.clearError()
      
      await reservations.delete(id)
      await this.loadReservations() // 一覧を再読み込み
    } catch (error) {
      this.setError(error)
    } finally {
      this.setLoading(false)
    }
  },
  
  // 録音履歴関連
  async loadRecordings() {
    try {
      this.setLoading(true)
      this.clearError()
      
      const response = await recordings.getAll()
      state.recordings = response.data.data
    } catch (error) {
      this.setError(error)
    } finally {
      this.setLoading(false)
    }
  },
  
  async loadRecentRecordings() {
    try {
      const response = await recordings.getRecent(7)
      state.recentRecordings = response.data.data
    } catch (error) {
      console.warn('Failed to load recent recordings:', error.message)
    }
  },

  async deleteRecording(id) {
    try {
      this.setLoading(true)
      this.clearError()
      
      await recordings.delete(id)
      await this.loadRecordings() // 一覧を再読み込み
    } catch (error) {
      this.setError(error)
    } finally {
      this.setLoading(false)
    }
  },
  
  // 設定関連
  async loadSettings() {
    try {
      const response = await settings.getAll()
      state.settings = response.data.data
      
      // UI設定を状態に反映
      if (state.settings.default_view_mode) {
        state.viewMode = state.settings.default_view_mode.value
      }
      if (state.settings.time_format) {
        state.timeFormat = state.settings.time_format.value
      }
    } catch (error) {
      console.warn('Failed to load settings:', error.message)
    }
  },
  
  async updateSetting(key, value) {
    try {
      await settings.set(key, value)
      await this.loadSettings() // 設定を再読み込み
    } catch (error) {
      this.setError(error)
    }
  },
  
  // UI設定
  setViewMode(mode) {
    state.viewMode = mode
    this.updateSetting('default_view_mode', mode)
  },
  
  setTimeFormat(format) {
    state.timeFormat = format
    this.updateSetting('time_format', format)
  }
}

// ゲッター（計算プロパティ的な機能）
const getters = {
  // 選択された放送局の今日の番組一覧
  getTodayPrograms() {
    return state.programs.filter(program => 
      program.date === state.selectedDate
    )
  },
  
  // 現在放送中の番組
  getCurrentProgram() {
    if (!state.selectedStation) return null
    return state.currentPrograms[state.selectedStation.id] || null
  },
  
  // 今日の予約一覧
  getTodayReservations() {
    const today = new Date().toISOString().split('T')[0]
    return state.reservations.filter(reservation => 
      reservation.start_time.startsWith(today.replace(/-/g, ''))
    )
  }
}

export const appState = readonly(state)
export { actions, getters }