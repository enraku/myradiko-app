#!/usr/bin/env node

// リアルタイム録音テスト

const RadikoRecorder = require('./server/services/RadikoRecorder');

async function testLiveRecording() {
    console.log('🎯 リアルタイム録音テスト開始');
    console.log('================================');

    try {
        const recorder = new RadikoRecorder();
        
        console.log('\n📻 10秒間のリアルタイム録音を開始...');
        
        const recordingParams = {
            stationId: 'TBS',
            duration: 10, // 10秒
            title: 'リアルタイム録音テスト10秒',
            reservationId: null,
            stationName: 'TBSラジオ'
        };

        const recording = await recorder.startRecording(recordingParams);
        
        console.log('✅ 録音開始成功');
        console.log('📂 ファイル:', recording.filename);
        console.log('🆔 録音ID:', recording.id);
        
        // 15秒待って結果確認
        console.log('\n⏳ 15秒間待機中...');
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        console.log('\n📊 アクティブ録音確認...');
        const activeRecordings = recorder.getActiveRecordings();
        console.log('アクティブ録音数:', activeRecordings.length);
        
        if (activeRecordings.length > 0) {
            activeRecordings.forEach(rec => {
                console.log(`- ${rec.title}: ${rec.status}`);
            });
        }

        // ファイル確認
        const fs = require('fs');
        const path = require('path');
        
        console.log('\n📁 録音ファイル確認...');
        try {
            const recordingsDir = './recordings';
            const files = await fs.promises.readdir(recordingsDir);
            
            console.log('録音フォルダ内ファイル数:', files.length);
            
            if (files.length > 0) {
                console.log('📝 ファイル一覧:');
                for (const file of files) {
                    const filePath = path.join(recordingsDir, file);
                    const stats = await fs.promises.stat(filePath);
                    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
                    console.log(`   ${file} (${stats.size} bytes = ${sizeMB}MB)`);
                }
            }
        } catch (error) {
            console.log('⚠️ ファイル確認エラー:', error.message);
        }

        console.log('\n================================');
        console.log('🎯 リアルタイム録音テスト完了');

    } catch (error) {
        console.error('\n❌ テスト実行エラー:', error.message);
        console.error('📝 スタックトレース:', error.stack);
    }
}

// テスト実行
testLiveRecording();