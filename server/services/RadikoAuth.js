const axios = require('axios');
const crypto = require('crypto');
const logger = require('./Logger');

class RadikoAuth {
    constructor() {
        this.baseURL = 'https://radiko.jp';
        this.authToken = null;
        this.keyOffset = null;
        this.keyLength = null;
        this.partialKey = null;
        this.userAgent = 'curl/7.56.1';
        this.playerURL = 'https://radiko.jp/apps/js/playerCommon.js';
        
        // radikoの認証キー（2025年最新）
        this.authKeyText = 'bcd151073c03b352e1ef2fd66c32209da9ca0afa';
    }

    /**
     * radiko認証を実行
     * @returns {Promise<Object>} 認証結果
     */
    async authenticate() {
        try {
            console.log('🔐 Starting Radiko authentication...');
            await logger.auth('info', 'Starting Radiko authentication');
            
            // Step 1: 認証トークン取得
            await this.getAuthToken();
            
            // Step 2: 部分キー生成・認証
            await this.authenticateWithPartialKey();
            
            console.log('✅ Radiko authentication completed successfully');
            await logger.auth('info', 'Radiko authentication completed successfully', {
                authToken: this.authToken ? this.authToken.substring(0, 10) + '...' : null
            });
            return {
                success: true,
                authToken: this.authToken,
                message: 'Authentication successful'
            };
            
        } catch (error) {
            console.error('❌ Radiko authentication failed:', error.message);
            await logger.auth('error', 'Radiko authentication failed', {
                error: error.message,
                stack: error.stack
            });
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Step 1: 認証トークンの取得
     */
    async getAuthToken() {
        try {
            console.log('📡 Getting auth token...');
            
            const response = await axios.get(`${this.baseURL}/v2/api/auth1`, {
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': '*/*',
                    'X-Radiko-App': 'pc_html5',
                    'X-Radiko-App-Version': '0.0.1',
                    'X-Radiko-User': 'dummy_user',
                    'X-Radiko-Device': 'pc'
                }
            });

            // レスポンスヘッダーから認証情報を取得
            this.authToken = response.headers['x-radiko-authtoken'];
            this.keyOffset = parseInt(response.headers['x-radiko-keyoffset']);
            this.keyLength = parseInt(response.headers['x-radiko-keylength']);

            if (!this.authToken || this.keyOffset === null || this.keyOffset === undefined || 
                this.keyLength === null || this.keyLength === undefined || isNaN(this.keyOffset) || isNaN(this.keyLength)) {
                throw new Error('Failed to get authentication parameters from response headers');
            }

            console.log(`✅ Auth token obtained: ${this.authToken.substring(0, 20)}...`);
            console.log(`📏 Key offset: ${this.keyOffset}, length: ${this.keyLength}`);

        } catch (error) {
            console.error('❌ Failed to get auth token:', error.message);
            throw error;
        }
    }

    /**
     * Step 2: 部分キー生成と認証
     */
    async authenticateWithPartialKey() {
        try {
            console.log('🔑 Generating partial key...');
            
            // 部分キーの生成
            this.partialKey = this.generatePartialKey();
            
            console.log(`🔐 Partial key generated: ${this.partialKey}`);
            
            // auth2 APIで認証
            const response = await axios.get(`${this.baseURL}/v2/api/auth2`, {
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': '*/*',
                    'X-Radiko-App': 'pc_html5',
                    'X-Radiko-App-Version': '0.0.1',
                    'X-Radiko-User': 'dummy_user',
                    'X-Radiko-Device': 'pc',
                    'X-Radiko-AuthToken': this.authToken,
                    'X-Radiko-PartialKey': this.partialKey
                }
            });

            console.log('✅ Authentication with partial key completed');
            console.log(`📍 Area: ${response.data || 'Unknown'}`);

        } catch (error) {
            console.error('❌ Failed to authenticate with partial key:', error.message);
            throw error;
        }
    }

    /**
     * 部分キーの生成
     */
    generatePartialKey() {
        try {
            // 認証キーから部分キーを抽出
            const keyBuffer = Buffer.from(this.authKeyText, 'ascii');
            const partialKeyBuffer = keyBuffer.slice(this.keyOffset, this.keyOffset + this.keyLength);
            
            // Base64エンコード
            return partialKeyBuffer.toString('base64');
            
        } catch (error) {
            console.error('❌ Failed to generate partial key:', error.message);
            throw error;
        }
    }

    /**
     * ストリーミングURLの取得
     * @param {string} stationId - 放送局ID
     * @returns {Promise<string>} ストリーミングURL
     */
    async getStreamURL(stationId) {
        try {
            console.log(`📻 Getting stream URL for station: ${stationId}`);
            
            if (!this.authToken) {
                throw new Error('Authentication required. Call authenticate() first.');
            }

            const response = await axios.get(`${this.baseURL}/v2/api/ts/playlist.m3u8`, {
                params: {
                    station_id: stationId,
                    l: '15',
                    lsid: Date.now().toString(),
                    type: 'b'
                },
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': '*/*',
                    'X-Radiko-AuthToken': this.authToken
                }
            });

            const m3u8URL = response.request.res.responseUrl || response.config.url;
            console.log(`✅ Stream URL obtained: ${m3u8URL}`);
            
            return m3u8URL;

        } catch (error) {
            console.error(`❌ Failed to get stream URL for ${stationId}:`, error.message);
            throw error;
        }
    }

    /**
     * タイムフリーストリーミングURLの取得
     * @param {string} stationId - 放送局ID
     * @param {Date} startTime - 開始時刻
     * @param {Date} endTime - 終了時刻
     * @returns {Promise<string>} ストリーミングURL
     */
    async getTimeshiftStreamURL(stationId, startTime, endTime) {
        try {
            console.log(`📻 Getting timeshift stream URL for station: ${stationId}`);
            console.log(`⏰ Time range: ${startTime.toISOString()} - ${endTime.toISOString()}`);
            
            if (!this.authToken) {
                throw new Error('Authentication required. Call authenticate() first.');
            }

            // radiko時刻フォーマットに変換
            const formatTime = (date) => {
                return date.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '');
            };

            const startTimeStr = formatTime(startTime);
            const endTimeStr = formatTime(endTime);

            const response = await axios.get(`${this.baseURL}/v2/api/ts/playlist.m3u8`, {
                params: {
                    station_id: stationId,
                    l: '15',
                    lsid: Date.now().toString(),
                    type: 'b',
                    start_at: startTimeStr,
                    ft: startTimeStr,
                    to: endTimeStr
                },
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': '*/*',
                    'X-Radiko-AuthToken': this.authToken
                }
            });

            const m3u8URL = response.request.res.responseUrl || response.config.url;
            console.log(`✅ Timeshift stream URL obtained: ${m3u8URL}`);
            
            return m3u8URL;

        } catch (error) {
            console.error(`❌ Failed to get timeshift stream URL for ${stationId}:`, error.message);
            throw error;
        }
    }

    /**
     * 認証トークンが有効かチェック
     * @returns {boolean} 有効性
     */
    isAuthenticated() {
        return this.authToken !== null;
    }

    /**
     * 認証情報をクリア
     */
    clearAuth() {
        this.authToken = null;
        this.keyOffset = null;
        this.keyLength = null;
        this.partialKey = null;
        console.log('🔓 Authentication cleared');
    }

    /**
     * 現在の認証情報を取得
     * @returns {Object} 認証情報
     */
    getAuthInfo() {
        return {
            isAuthenticated: this.isAuthenticated(),
            authToken: this.authToken ? this.authToken.substring(0, 20) + '...' : null,
            keyOffset: this.keyOffset,
            keyLength: this.keyLength
        };
    }
}

module.exports = RadikoAuth;