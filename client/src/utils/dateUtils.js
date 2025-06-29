/**
 * radikoの時刻フォーマット（YYYYMMDDHHMMSS）をJavaScript Dateオブジェクトに変換
 * @param {string} radikoTime - radiko形式の時刻文字列
 * @returns {Date|null} - Dateオブジェクト
 */
export function parseRadikoTime(radikoTime) {
  if (!radikoTime || radikoTime.length !== 14) {
    return null
  }
  
  const year = parseInt(radikoTime.substring(0, 4))
  const month = parseInt(radikoTime.substring(4, 6)) - 1 // JSのmonthは0ベース
  const day = parseInt(radikoTime.substring(6, 8))
  const hour = parseInt(radikoTime.substring(8, 10))
  const minute = parseInt(radikoTime.substring(10, 12))
  const second = parseInt(radikoTime.substring(12, 14))
  
  return new Date(year, month, day, hour, minute, second)
}

/**
 * Dateオブジェクトをradiko時刻フォーマットに変換
 * @param {Date} date - Dateオブジェクト
 * @returns {string} - radiko形式の時刻文字列
 */
export function dateToRadikoTime(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  
  return `${year}${month}${day}${hour}${minute}${second}`
}

/**
 * radikoの時刻フォーマットを時分表示に変換
 * @param {string} radikoTime - radiko形式の時刻文字列
 * @param {string} format - 時刻フォーマット ('12' or '24')
 * @returns {string} - 時分表示文字列
 */
export function formatTime(radikoTime, format = '24') {
  const date = parseRadikoTime(radikoTime)
  if (!date) return ''
  
  if (format === '12') {
    return date.toLocaleTimeString('ja-JP', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  } else {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }
}

/**
 * radikoの日付フォーマット（YYYYMMDD）をDate文字列に変換
 * @param {string} radikoDate - radiko形式の日付文字列
 * @returns {string} - 日付表示文字列
 */
export function formatDate(radikoDate) {
  if (!radikoDate || radikoDate.length !== 8) {
    return ''
  }
  
  const year = radikoDate.substring(0, 4)
  const month = radikoDate.substring(4, 6)
  const day = radikoDate.substring(6, 8)
  
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  })
}

/**
 * 今日の日付をradiko形式で取得
 * @returns {string} - YYYYMMDD形式の今日の日付
 */
export function getTodayRadikoDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  
  return `${year}${month}${day}`
}

/**
 * 日付を加算してradiko形式で取得
 * @param {number} days - 加算する日数
 * @param {string} baseDate - 基準日（省略時は今日）
 * @returns {string} - YYYYMMDD形式の日付
 */
export function addDaysToRadikoDate(days, baseDate = null) {
  let date
  
  if (baseDate) {
    const year = parseInt(baseDate.substring(0, 4))
    const month = parseInt(baseDate.substring(4, 6)) - 1
    const day = parseInt(baseDate.substring(6, 8))
    date = new Date(year, month, day)
  } else {
    date = new Date()
  }
  
  date.setDate(date.getDate() + days)
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}${month}${day}`
}

/**
 * 現在時刻がradiko時刻の範囲内かチェック
 * @param {string} startTime - 開始時刻（radiko形式）
 * @param {string} endTime - 終了時刻（radiko形式）
 * @param {Date} currentTime - 現在時刻（省略時は現在時刻）
 * @returns {boolean} - 範囲内かどうか
 */
export function isTimeInRange(startTime, endTime, currentTime = new Date()) {
  const start = parseRadikoTime(startTime)
  const end = parseRadikoTime(endTime)
  
  if (!start || !end) {
    return false
  }
  
  return currentTime >= start && currentTime < end
}

/**
 * 番組の継続時間を分単位で計算
 * @param {string} startTime - 開始時刻（radiko形式）
 * @param {string} endTime - 終了時刻（radiko形式）
 * @returns {number} - 継続時間（分）
 */
export function getProgramDurationMinutes(startTime, endTime) {
  const start = parseRadikoTime(startTime)
  const end = parseRadikoTime(endTime)
  
  if (!start || !end) {
    return 0
  }
  
  return Math.floor((end - start) / (1000 * 60))
}