#!/usr/bin/env node

// 認証デバッグテスト

const axios = require('axios');

async function debugAuth() {
    console.log('🔍 Radiko認証デバッグ');
    console.log('================================');

    try {
        console.log('\n📡 auth1エンドポイントへのリクエスト...');
        
        const response = await axios.get('https://radiko.jp/v2/api/auth1', {
            headers: {
                'User-Agent': 'curl/7.56.1',
                'Accept': '*/*',
                'X-Radiko-App': 'pc_html5',
                'X-Radiko-App-Version': '0.0.1',
                'X-Radiko-User': 'dummy_user',
                'X-Radiko-Device': 'pc'
            }
        });

        console.log('\n📊 レスポンス情報:');
        console.log('ステータス:', response.status);
        console.log('データ:', response.data);
        
        console.log('\n📋 レスポンスヘッダー:');
        Object.keys(response.headers).forEach(key => {
            console.log(`${key}: ${response.headers[key]}`);
        });

        // ヘッダーから認証情報を抽出
        console.log('\n🔑 認証情報抽出:');
        const authToken = response.headers['x-radiko-authtoken'];
        const keyOffset = response.headers['x-radiko-keyoffset'];
        const keyLength = response.headers['x-radiko-keylength'];

        console.log('authToken:', authToken);
        console.log('keyOffset:', keyOffset);
        console.log('keyLength:', keyLength);

        if (authToken && keyOffset && keyLength) {
            console.log('✅ 認証パラメータ取得成功');
            
            // 部分キー生成テスト
            const authKeyText = 'bcd151073c03b352e1ef2fd66c32209da9ca0afa';
            const offset = parseInt(keyOffset);
            const length = parseInt(keyLength);
            
            console.log('\n🔐 部分キー生成:');
            console.log('認証キー:', authKeyText);
            console.log('オフセット:', offset);
            console.log('長さ:', length);
            
            const keyBuffer = Buffer.from(authKeyText, 'ascii');
            const partialKeyBuffer = keyBuffer.slice(offset, offset + length);
            const partialKey = partialKeyBuffer.toString('base64');
            
            console.log('部分キー:', partialKey);

            // auth2テスト
            console.log('\n📡 auth2エンドポイントテスト...');
            try {
                const auth2Response = await axios.get('https://radiko.jp/v2/api/auth2', {
                    headers: {
                        'User-Agent': 'curl/7.56.1',
                        'Accept': '*/*',
                        'X-Radiko-App': 'pc_html5',
                        'X-Radiko-App-Version': '0.0.1',
                        'X-Radiko-User': 'dummy_user',
                        'X-Radiko-Device': 'pc',
                        'X-Radiko-AuthToken': authToken,
                        'X-Radiko-PartialKey': partialKey
                    }
                });

                console.log('✅ auth2成功');
                console.log('エリア情報:', auth2Response.data);
            } catch (auth2Error) {
                console.error('❌ auth2エラー:', auth2Error.message);
                if (auth2Error.response) {
                    console.error('auth2レスポンス:', auth2Error.response.data);
                }
            }
        } else {
            console.log('❌ 認証パラメータが不足');
        }

    } catch (error) {
        console.error('❌ リクエストエラー:', error.message);
        if (error.response) {
            console.error('レスポンス状態:', error.response.status);
            console.error('レスポンスデータ:', error.response.data);
            console.error('レスポンスヘッダー:', error.response.headers);
        }
    }
}

// デバッグ実行
debugAuth();