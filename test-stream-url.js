#!/usr/bin/env node

// ストリーミングURL取得テスト

const RadikoAuth = require('./server/services/RadikoAuth');

async function testStreamURL() {
    console.log('🎯 ストリーミングURL取得テスト');
    console.log('================================');

    try {
        // 1. 認証実行
        console.log('\n1️⃣ Radiko認証実行');
        const auth = new RadikoAuth();
        const authResult = await auth.authenticate();
        
        if (!authResult.success) {
            console.error('❌ 認証失敗:', authResult.error);
            return;
        }
        
        console.log('✅ 認証成功');

        // 2. ライブストリーミングURL取得テスト
        console.log('\n2️⃣ ライブストリーミングURL取得テスト');
        try {
            const liveStreamURL = await auth.getStreamURL('TBS');
            console.log('✅ ライブストリーミングURL:', liveStreamURL);
        } catch (error) {
            console.error('❌ ライブストリーミングURL取得エラー:', error.message);
        }

        // 3. タイムシフトストリーミングURL取得テスト
        console.log('\n3️⃣ タイムシフトストリーミングURL取得テスト');
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const startTime = new Date(yesterday);
            startTime.setHours(10, 0, 0, 0);
            const endTime = new Date(yesterday);
            endTime.setHours(10, 30, 0, 0);

            console.log('📅 時間範囲:', startTime.toISOString(), '-', endTime.toISOString());
            
            const timeshiftStreamURL = await auth.getTimeshiftStreamURL('TBS', startTime, endTime);
            console.log('✅ タイムシフトストリーミングURL:', timeshiftStreamURL);
        } catch (error) {
            console.error('❌ タイムシフトストリーミングURL取得エラー:', error.message);
        }

        // 4. 他の放送局でもテスト
        console.log('\n4️⃣ 他の放送局テスト');
        const stations = ['FMT', 'QRR', 'LFR'];
        
        for (const stationId of stations) {
            try {
                console.log(`📻 ${stationId} のストリーミングURL取得中...`);
                const streamURL = await auth.getStreamURL(stationId);
                console.log(`✅ ${stationId}: URL取得成功`);
            } catch (error) {
                console.error(`❌ ${stationId}: ${error.message}`);
            }
        }

        console.log('\n================================');
        console.log('🎯 ストリーミングURL取得テスト完了');

    } catch (error) {
        console.error('\n❌ テスト実行エラー:', error.message);
        console.error('📝 スタックトレース:', error.stack);
    }
}

// テスト実行
testStreamURL();