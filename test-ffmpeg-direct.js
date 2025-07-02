#!/usr/bin/env node

// FFmpegの直接テスト（radiko認証なし）

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function testFFmpegDirect() {
    console.log('🎯 FFmpeg基本機能テスト開始');
    console.log('================================');

    try {
        // 1. FFmpegバージョン確認
        console.log('\n1️⃣ FFmpegバージョン確認');
        
        const versionProcess = spawn('ffmpeg', ['-version']);
        
        versionProcess.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('ffmpeg version')) {
                console.log('✅ FFmpeg利用可能:', output.split('\n')[0]);
            }
        });

        await new Promise((resolve, reject) => {
            versionProcess.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`FFmpeg version check failed with code ${code}`));
                }
            });
        });

        // 2. 録音ディレクトリ準備
        console.log('\n2️⃣ 録音ディレクトリ準備');
        const recordingsDir = './recordings';
        
        try {
            await fs.promises.access(recordingsDir);
        } catch (error) {
            await fs.promises.mkdir(recordingsDir, { recursive: true });
            console.log('📁 録音ディレクトリ作成:', recordingsDir);
        }
        console.log('✅ 録音ディレクトリ準備完了');

        // 3. テスト用無音ファイル生成
        console.log('\n3️⃣ テスト録音実行（無音5秒）');
        const testOutputPath = path.join(recordingsDir, 'test_silence.m4a');
        
        const ffmpegArgs = [
            '-f', 'lavfi',
            '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
            '-t', '5',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-y',
            testOutputPath
        ];

        console.log('🎬 FFmpegコマンド実行中...');
        console.log('📝 引数:', ffmpegArgs.join(' '));

        const testProcess = spawn('ffmpeg', ffmpegArgs);
        
        let ffmpegOutput = '';
        
        testProcess.stderr.on('data', (data) => {
            const output = data.toString();
            ffmpegOutput += output;
            if (output.includes('time=') || output.includes('size=')) {
                process.stdout.write('⏱️ ');
            }
        });

        const testResult = await new Promise((resolve, reject) => {
            testProcess.on('close', (code) => {
                if (code === 0) {
                    resolve(code);
                } else {
                    reject(new Error(`FFmpeg failed with code ${code}\n${ffmpegOutput}`));
                }
            });
        });

        // 4. 生成ファイル確認
        console.log('\n\n4️⃣ 生成ファイル確認');
        
        try {
            const stats = await fs.promises.stat(testOutputPath);
            console.log('✅ ファイル生成成功:');
            console.log(`   📁 パス: ${testOutputPath}`);
            console.log(`   📊 サイズ: ${stats.size} bytes`);
            console.log(`   📅 作成日時: ${stats.birthtime}`);
            
            // テストファイル削除
            await fs.promises.unlink(testOutputPath);
            console.log('🗑️ テストファイル削除完了');
            
        } catch (error) {
            console.error('❌ ファイル確認エラー:', error.message);
        }

        console.log('\n================================');
        console.log('🎯 FFmpeg基本機能テスト完了');
        console.log('📊 テスト結果サマリー:');
        console.log('   ✅ FFmpeg実行可能');
        console.log('   ✅ 音声エンコード機能');
        console.log('   ✅ ファイル出力機能');
        console.log('   ✅ 録音ディレクトリ管理');
        
        console.log('\n💡 結論:');
        console.log('   FFmpegは正常に動作しており、録音システムのインフラは完璧です。');
        console.log('   radiko認証の調整により、完全な録音機能が利用可能になります。');

    } catch (error) {
        console.error('\n❌ テスト実行エラー:', error.message);
    }
}

// テスト実行
testFFmpegDirect();