#!/usr/bin/env node

/**
 * MyRadiko 統合テストスクリプト
 * 録音予約から実行までの全体的な動作を検証
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3010/api';
const TEST_RESULTS = [];

// テスト結果記録用
function recordTest(testName, success, message = '') {
  const result = {
    test: testName,
    success,
    message,
    timestamp: new Date().toISOString()
  };
  TEST_RESULTS.push(result);
  
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}${message ? ': ' + message : ''}`);
}

// APIテスト用ヘルパー
async function testAPI(endpoint, method = 'GET', data = null, customUrl = null) {
  try {
    const config = {
      method,
      url: customUrl || `${BASE_URL}${endpoint}`,
      timeout: 10000
    };
    
    if (data) {
      config.data = data;
      config.headers = { 'Content-Type': 'application/json' };
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      status: error.response?.status || 0 
    };
  }
}

// 1. サーバー接続テスト
async function testServerConnection() {
  console.log('\n🔗 サーバー接続テスト');
  
  // テスト用エンドポイントで接続確認
  const result = await testAPI('', 'GET', null, 'http://localhost:3010/test/ping');
  if (result.success) {
    recordTest('サーバー接続', true, `Status: ${result.status}`);
  } else {
    recordTest('サーバー接続', false, result.error);
    return false;
  }
  return true;
}

// 2. 基本APIエンドポイントテスト
async function testBasicAPIs() {
  console.log('\n📡 基本APIエンドポイントテスト');
  
  // テスト用放送局一覧
  const stationsResult = await testAPI('', 'GET', null, 'http://localhost:3010/test/stations');
  recordTest('放送局一覧API（テスト）', stationsResult.success, 
    stationsResult.success ? `${stationsResult.data?.data?.length || 0}局取得` : stationsResult.error);
  
  // 設定API
  const settingsResult = await testAPI('/settings');
  recordTest('設定API', settingsResult.success,
    settingsResult.success ? `${Object.keys(settingsResult.data?.data || {}).length}設定取得` : settingsResult.error);
  
  // テスト用予約一覧
  const reservationsResult = await testAPI('', 'GET', null, 'http://localhost:3010/test/reservations');
  recordTest('予約一覧API（テスト）', reservationsResult.success,
    reservationsResult.success ? `${reservationsResult.data?.reservations?.length || 0}件の予約` : reservationsResult.error);
    
  // テスト用録音ファイル一覧
  const recordingsResult = await testAPI('', 'GET', null, 'http://localhost:3010/test/recordings');
  recordTest('録音ファイル一覧API（テスト）', recordingsResult.success,
    recordingsResult.success ? `${recordingsResult.data?.recordings?.length || 0}件のファイル` : recordingsResult.error);
    
  return stationsResult.success && settingsResult.success;
}

// 3. 番組表取得テスト
async function testProgramGuide() {
  console.log('\n📺 番組表取得テスト');
  
  // まずテスト用放送局一覧を取得
  const stationsResult = await testAPI('', 'GET', null, 'http://localhost:3010/test/stations');
  if (!stationsResult.success || !stationsResult.data?.data?.length) {
    recordTest('番組表取得準備', false, '放送局データなし');
    return false;
  }
  
  const station = stationsResult.data.data[0];
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  
  // テスト用番組表取得
  const programsResult = await testAPI('', 'GET', null, `http://localhost:3010/test/programs/${station.id}/${today}`);
  recordTest('番組表取得（テスト）', programsResult.success,
    programsResult.success ? `${station.name} ${programsResult.data?.data?.length || 0}番組` : programsResult.error);
    
  return programsResult.success;
}

// 4. 録音予約作成テスト
async function testRecordingReservation() {
  console.log('\n⏰ 録音予約作成テスト');
  
  // テスト用予約データ
  const testReservation = {
    title: '統合テスト番組',
    station_id: 'TBS',
    station_name: 'TBSラジオ',
    start_time: '23:50:00',
    end_time: '23:52:00',
    repeat_type: 'none',
    description: '統合テスト用の予約'
  };
  
  // 予約作成
  const createResult = await testAPI('/reservations', 'POST', testReservation);
  recordTest('録音予約作成', createResult.success,
    createResult.success ? `予約ID: ${createResult.data?.reservation?.id}` : createResult.error);
  
  if (createResult.success) {
    const reservationId = createResult.data.reservation?.id || createResult.data.id;
    
    // 作成された予約の確認
    const getResult = await testAPI(`/reservations/${reservationId}`);
    recordTest('予約詳細取得', getResult.success,
      getResult.success ? `タイトル: ${getResult.data?.reservation?.title}` : getResult.error);
    
    // 予約削除（テスト後のクリーンアップ）
    const deleteResult = await testAPI(`/reservations/${reservationId}`, 'DELETE');
    recordTest('予約削除（クリーンアップ）', deleteResult.success,
      deleteResult.success ? '正常に削除' : deleteResult.error);
    
    return createResult.success && getResult.success;
  }
  
  return false;
}

// 5. 録音スケジューラーテスト
async function testRecordingScheduler() {
  console.log('\n🕐 録音スケジューラーテスト');
  
  // スケジューラー状態確認
  const statusResult = await testAPI('/scheduler/status');
  recordTest('スケジューラー状態確認', statusResult.success,
    statusResult.success ? `アクティブ: ${statusResult.data?.active ? 'Yes' : 'No'}` : statusResult.error);
  
  // アクティブな予約確認
  const activeResult = await testAPI('/scheduler/active');
  recordTest('アクティブ予約確認', activeResult.success,
    activeResult.success ? `${activeResult.data?.count || 0}件のアクティブ予約` : activeResult.error);
    
  return statusResult.success;
}

// 6. 設定変更テスト
async function testSettingsManagement() {
  console.log('\n⚙️ 設定管理テスト');
  
  // 設定取得
  const getResult = await testAPI('/settings');
  if (!getResult.success) {
    recordTest('設定管理', false, '設定取得失敗');
    return false;
  }
  
  // テスト設定更新
  const updateResult = await testAPI('/settings/test_integration', 'PUT', {
    value: `test_${Date.now()}`,
    description: '統合テスト用設定'
  });
  recordTest('設定更新', updateResult.success,
    updateResult.success ? '設定更新成功' : updateResult.error);
  
  return updateResult.success;
}

// 7. ファイルシステムテスト
async function testFileSystem() {
  console.log('\n📁 ファイルシステムテスト');
  
  // 録音ディレクトリの確認
  const recordingsDir = path.join(__dirname, 'recordings');
  const dirExists = fs.existsSync(recordingsDir);
  recordTest('録音ディレクトリ確認', dirExists, 
    dirExists ? `パス: ${recordingsDir}` : '録音ディレクトリが存在しません');
  
  // データベースファイルの確認
  const dbPath = path.join(__dirname, 'server', 'database', 'myradiko.db');
  const dbExists = fs.existsSync(dbPath);
  recordTest('データベースファイル確認', dbExists,
    dbExists ? `パス: ${dbPath}` : 'データベースファイルが存在しません');
    
  return dirExists && dbExists;
}

// メイン統合テスト実行
async function runIntegrationTests() {
  console.log('🚀 MyRadiko 統合テスト開始\n');
  console.log('=' .repeat(50));
  
  const testResults = [];
  
  // 各テストを順次実行
  testResults.push(await testServerConnection());
  testResults.push(await testBasicAPIs());
  testResults.push(await testProgramGuide());
  testResults.push(await testRecordingReservation());
  testResults.push(await testRecordingScheduler());
  testResults.push(await testSettingsManagement());
  testResults.push(await testFileSystem());
  
  // 結果サマリー
  console.log('\n' + '=' .repeat(50));
  console.log('📊 テスト結果サマリー');
  console.log('=' .repeat(50));
  
  const totalTests = TEST_RESULTS.length;
  const passedTests = TEST_RESULTS.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`総テスト数: ${totalTests}`);
  console.log(`成功: ${passedTests} (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`失敗: ${failedTests} (${Math.round(failedTests/totalTests*100)}%)`);
  
  if (failedTests > 0) {
    console.log('\n❌ 失敗したテスト:');
    TEST_RESULTS.filter(r => !r.success).forEach(test => {
      console.log(`  - ${test.test}: ${test.message}`);
    });
  }
  
  // テスト結果をファイルに保存
  const reportPath = path.join(__dirname, 'integration-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    summary: { totalTests, passedTests, failedTests },
    results: TEST_RESULTS,
    timestamp: new Date().toISOString()
  }, null, 2));
  
  console.log(`\n📝 詳細レポート: ${reportPath}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 全てのテストが成功しました！');
    return true;
  } else {
    console.log('\n⚠️ 一部のテストが失敗しました。');
    return false;
  }
}

// テスト実行
if (require.main === module) {
  runIntegrationTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ 統合テスト実行中にエラーが発生:', error.message);
      process.exit(1);
    });
}

module.exports = { runIntegrationTests };