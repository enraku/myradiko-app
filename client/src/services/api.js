import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// レスポンスインターセプター
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// 放送局関連API
export const stations = {
  // 東京地域の放送局一覧取得
  getTokyoStations() {
    return api.get('/stations/JP13')
  },
  
  // 全放送局一覧取得
  getAllStations() {
    return api.get('/stations')
  },
  
  // 地域別放送局一覧取得
  getStationsByArea(areaCode) {
    return api.get(`/stations/${areaCode}`)
  }
}

// 番組表関連API
export const programs = {
  // 指定日の番組表取得
  getProgramsByDate(stationId, date) {
    return api.get(`/programs/${stationId}/date/${date}`)
  },
  
  // 週間番組表取得
  getWeeklyPrograms(stationId) {
    return api.get(`/programs/${stationId}/weekly`)
  },
  
  // 現在放送中の番組取得
  getCurrentProgram(stationId) {
    return api.get(`/programs/${stationId}/current`)
  },
  
  // 番組検索
  searchPrograms(query, options = {}) {
    const params = new URLSearchParams({
      q: query,
      ...options
    })
    return api.get(`/programs/search?${params}`)
  }
}

// 録音予約関連API
export const reservations = {
  // 全予約一覧取得
  getAll() {
    return api.get('/reservations')
  },
  
  // 予約詳細取得
  getById(id) {
    return api.get(`/reservations/${id}`)
  },
  
  // 予約作成
  create(reservationData) {
    return api.post('/reservations', reservationData)
  },
  
  // 予約更新
  update(id, reservationData) {
    return api.put(`/reservations/${id}`, reservationData)
  },
  
  // 予約削除
  delete(id) {
    return api.delete(`/reservations/${id}`)
  },
  
  // 近日中の予約取得
  getUpcoming(hours = 24) {
    return api.get(`/reservations/upcoming/${hours}`)
  }
}

// 録音履歴関連API
export const recordings = {
  // 全録音履歴取得
  getAll(limit = 100) {
    return api.get(`/recordings?limit=${limit}`)
  },
  
  // 録音詳細取得
  getById(id) {
    return api.get(`/recordings/${id}`)
  },
  
  // 最近の録音履歴取得
  getRecent(days = 7) {
    return api.get(`/recordings/recent/${days}`)
  },
  
  // 録音削除
  delete(id) {
    return api.delete(`/recordings/${id}`)
  },
  
  // 録音開始
  startRecording(id) {
    return api.post(`/recordings/${id}/start`)
  },
  
  // 録音停止
  stopRecording(id) {
    return api.post(`/recordings/${id}/stop`)
  }
}

// 設定関連API
export const settings = {
  // 全設定取得
  getAll() {
    return api.get('/settings')
  },
  
  // 特定設定取得
  get(key) {
    return api.get(`/settings/${key}`)
  },
  
  // 設定更新
  set(key, value) {
    return api.put(`/settings/${key}`, { value })
  },
  
  // 設定削除
  delete(key) {
    return api.delete(`/settings/${key}`)
  }
}

// ログ関連API
export const logs = {
  // 全ログ取得
  getAll(limit = 1000) {
    return api.get(`/logs?limit=${limit}`)
  },
  
  // レベル別ログ取得
  getByLevel(level, limit = 1000) {
    return api.get(`/logs/level/${level}?limit=${limit}`)
  },
  
  // カテゴリ別ログ取得
  getByCategory(category, limit = 1000) {
    return api.get(`/logs/category/${category}?limit=${limit}`)
  },
  
  // 最近のログ取得
  getRecent(days = 7) {
    return api.get(`/logs/recent/${days}`)
  }
}

// ヘルスチェック
export const health = {
  check() {
    return api.get('/health')
  }
}

export default api