/**
 * radikoの時刻フォーマット（YYYYMMDDHHMMSS）をJavaScript Dateオブジェクトに変換
 * @param {string} radikoTime - radiko形式の時刻文字列
 * @returns {Date} - Dateオブジェクト
 */
function parseRadikoTime(radikoTime) {
    if (!radikoTime || radikoTime.length !== 14) {
        return null;
    }
    
    const year = parseInt(radikoTime.substring(0, 4));
    const month = parseInt(radikoTime.substring(4, 6)) - 1; // JSのmonthは0ベース
    const day = parseInt(radikoTime.substring(6, 8));
    const hour = parseInt(radikoTime.substring(8, 10));
    const minute = parseInt(radikoTime.substring(10, 12));
    const second = parseInt(radikoTime.substring(12, 14));
    
    return new Date(year, month, day, hour, minute, second);
}

/**
 * radikoの時刻フォーマットをISO8601形式に変換
 * @param {string} radikoTime - radiko形式の時刻文字列
 * @returns {string} - ISO8601形式の時刻文字列
 */
function radikoTimeToISO(radikoTime) {
    const date = parseRadikoTime(radikoTime);
    return date ? date.toISOString() : null;
}

/**
 * radikoの時刻フォーマットを日本語ローカル時刻に変換
 * @param {string} radikoTime - radiko形式の時刻文字列
 * @returns {string} - 日本語ローカル時刻文字列
 */
function radikoTimeToLocaleString(radikoTime) {
    const date = parseRadikoTime(radikoTime);
    return date ? date.toLocaleString('ja-JP') : null;
}

/**
 * 現在時刻がradiko時刻の範囲内かチェック
 * @param {string} startTime - 開始時刻（radiko形式）
 * @param {string} endTime - 終了時刻（radiko形式）
 * @param {Date} currentTime - 現在時刻（省略時は現在時刻）
 * @returns {boolean} - 範囲内かどうか
 */
function isTimeInRange(startTime, endTime, currentTime = new Date()) {
    const start = parseRadikoTime(startTime);
    const end = parseRadikoTime(endTime);
    
    if (!start || !end) {
        return false;
    }
    
    return currentTime >= start && currentTime < end;
}

module.exports = {
    parseRadikoTime,
    radikoTimeToISO,
    radikoTimeToLocaleString,
    isTimeInRange
};