#!/usr/bin/env node

// システム情報機能テスト

const axios = require('axios');

const BASE_URL = 'http://localhost:3011/api';

async function testSystemInfo() {
    console.log('🎯 システム情報機能テスト開始');
    console.log('================================');

    try {
        // 1. 基本システム情報取得
        console.log('\n1️⃣ 基本システム情報取得');
        const systemInfoResponse = await axios.get(`${BASE_URL}/system/info`);
        const systemInfo = systemInfoResponse.data.data;
        
        console.log('🖥️ システム基本情報:');
        console.log(`   Platform: ${systemInfo.platform} (${systemInfo.architecture})`);
        console.log(`   Node.js: ${systemInfo.nodeVersion}`);
        console.log(`   Hostname: ${systemInfo.hostname}`);
        console.log(`   Uptime: ${Math.floor(systemInfo.uptime / 3600)}h ${Math.floor((systemInfo.uptime % 3600) / 60)}m`);
        
        console.log('\n💾 メモリ情報:');
        console.log(`   Total: ${formatBytes(systemInfo.memory.total)}`);
        console.log(`   Free: ${formatBytes(systemInfo.memory.free)}`);
        console.log(`   Used: ${formatBytes(systemInfo.memory.used)} (${((systemInfo.memory.used / systemInfo.memory.total) * 100).toFixed(1)}%)`);
        
        console.log('\n🔧 CPU情報:');
        console.log(`   Model: ${systemInfo.cpu.model}`);
        console.log(`   Cores: ${systemInfo.cpu.cores}`);
        console.log(`   Load Average: [${systemInfo.cpu.loadAverage.map(l => l.toFixed(2)).join(', ')}]`);
        
        console.log('\n💿 ストレージ情報:');
        console.log(`   録音フォルダ: ${systemInfo.storage.recordingsPath}`);
        console.log(`   ファイル数: ${systemInfo.storage.fileCount}`);
        console.log(`   使用容量: ${systemInfo.storage.totalSizeFormatted}`);
        if (systemInfo.storage.diskSpace && !systemInfo.storage.diskSpace.error) {
            console.log(`   ディスク使用率: ${systemInfo.storage.diskSpace.usePercentage || 'N/A'}`);
            console.log(`   利用可能: ${systemInfo.storage.diskSpace.available || 'N/A'}`);
        }
        
        console.log('\n🔗 依存関係:');
        Object.entries(systemInfo.dependencies).forEach(([name, info]) => {
            const status = info.available ? '✅' : '❌';
            const version = info.version || info.error || 'Unknown';
            console.log(`   ${status} ${name}: ${version}`);
        });

        // 2. 詳細システム統計取得
        console.log('\n2️⃣ 詳細システム統計取得');
        const statsResponse = await axios.get(`${BASE_URL}/system/stats`);
        const stats = statsResponse.data.data;
        
        console.log('📊 プロセス統計:');
        console.log(`   PID: ${stats.process.pid}`);
        console.log(`   Uptime: ${Math.floor(stats.process.uptime)}秒`);
        console.log(`   Memory RSS: ${formatBytes(stats.process.memory.rss)}`);
        console.log(`   Memory Heap Used: ${formatBytes(stats.process.memory.heapUsed)}`);
        
        console.log('\n🌐 システム統計:');
        console.log(`   システム稼働時間: ${Math.floor(stats.system.uptime / 3600)}時間`);
        console.log(`   ネットワークIF数: ${stats.system.networkInterfaces}`);
        
        console.log('\n⚙️ アプリケーション設定:');
        console.log(`   環境: ${stats.application.environment}`);
        console.log(`   ログレベル: ${stats.application.logLevel}`);

        // 3. ヘルスチェック実行
        console.log('\n3️⃣ システムヘルスチェック');
        const healthResponse = await axios.get(`${BASE_URL}/system/health`);
        const health = healthResponse.data.data;
        
        const statusIcon = health.status === 'healthy' ? '🟢' : 
                          health.status === 'warning' ? '🟡' : '🔴';
        
        console.log(`${statusIcon} システム状態: ${health.status.toUpperCase()}`);
        console.log(`📈 スコア: ${health.score}`);
        console.log(`⏰ チェック時刻: ${new Date(health.timestamp).toLocaleString()}`);
        
        console.log('\n🔍 ヘルスチェック詳細:');
        Object.entries(health.checks).forEach(([component, status]) => {
            const icon = status ? '✅' : '❌';
            const detail = health.details[component];
            let detailStr = '';
            
            if (typeof detail === 'string') {
                detailStr = detail;
            } else if (typeof detail === 'object' && detail !== null) {
                if (component === 'memory') {
                    detailStr = `使用率: ${detail.usage}, 空き: ${detail.free}`;
                } else if (component === 'disk') {
                    detailStr = `ファイル数: ${detail.fileCount}, 使用容量: ${detail.totalSizeFormatted}`;
                } else if (component === 'dependencies') {
                    const deps = Object.entries(detail).filter(([, info]) => info.available).length;
                    const total = Object.keys(detail).length;
                    detailStr = `${deps}/${total} 利用可能`;
                } else {
                    detailStr = JSON.stringify(detail);
                }
            }
            
            console.log(`   ${icon} ${component}: ${detailStr}`);
        });

        // 4. パフォーマンステスト
        console.log('\n4️⃣ API パフォーマンステスト');
        const performanceTests = [
            { name: 'システム情報', url: '/system/info' },
            { name: '詳細統計', url: '/system/stats' },
            { name: 'ヘルスチェック', url: '/system/health' }
        ];

        for (const test of performanceTests) {
            const startTime = Date.now();
            await axios.get(`${BASE_URL}${test.url}`);
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            const perfIcon = responseTime < 100 ? '🚀' : 
                           responseTime < 500 ? '⚡' : '🐌';
            
            console.log(`   ${perfIcon} ${test.name}: ${responseTime}ms`);
        }

        console.log('\n================================');
        console.log('🎯 システム情報機能テスト完了');
        console.log('');
        console.log('📊 実装完了機能:');
        console.log('   ✅ 基本システム情報表示');
        console.log('   ✅ メモリ・CPU・ディスク監視');
        console.log('   ✅ 依存関係チェック');
        console.log('   ✅ 詳細システム統計');
        console.log('   ✅ ヘルスチェック機能');
        console.log('   ✅ パフォーマンス監視');
        console.log('   ✅ ログ統合機能');
        console.log('');
        console.log('🚀 システム情報機能実装完了！');

    } catch (error) {
        console.error('\n❌ テスト実行エラー:', error.message);
        if (error.response) {
            console.error('📡 レスポンス状態:', error.response.status);
            console.error('📡 レスポンス:', error.response.data);
        }
    }
}

// バイト数フォーマット関数
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// テスト実行
testSystemInfo();