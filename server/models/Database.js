const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class MyRadikoDatabase {
    constructor() {
        // パッケージ化環境対応: 書き込み可能なディレクトリを使用
        const isElectron = process.versions.electron !== undefined;
        if (isElectron) {
            // Electronアプリ実行時: ユーザーデータディレクトリを使用
            const { app } = require('electron');
            const userDataPath = app.getPath('userData');
            this.dbPath = path.join(userDataPath, 'myradiko.db');
            
            // データディレクトリも同様に設定
            this.dataDir = userDataPath;
            this.recordingsDir = path.join(userDataPath, 'recordings');
        } else {
            // 開発環境: 従来のパス
            this.dbPath = path.join(__dirname, '../../database/myradiko.db');
            this.dataDir = path.join(__dirname, '../../data');
            this.recordingsDir = path.join(__dirname, '../../recordings');
        }
        
        this.db = null;
        
        // 必要なディレクトリを作成
        this.ensureDirectories();
    }
    
    ensureDirectories() {
        try {
            if (!fs.existsSync(path.dirname(this.dbPath))) {
                fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
            }
            if (!fs.existsSync(this.recordingsDir)) {
                fs.mkdirSync(this.recordingsDir, { recursive: true });
            }
        } catch (error) {
            console.error('Failed to create directories:', error);
        }
    }

    async connect() {
        try {
            this.db = new Database(this.dbPath);
            // better-sqlite3は同期的に接続するためエラーがなければ成功
            console.log('Connected to SQLite database with better-sqlite3');
        } catch (error) {
            console.error('Failed to connect to database:', error);
            throw error;
        }
    }

    async initialize() {
        // パッケージ化環境対応: init.sqlの適切なパス取得
        const isElectron = process.versions.electron !== undefined;
        let initSqlPath;
        
        if (isElectron) {
            // Electronアプリ実行時
            const { app } = require('electron');
            if (app.isPackaged) {
                initSqlPath = path.join(process.resourcesPath, 'app.asar', 'database', 'init.sql');
            } else {
                initSqlPath = path.join(__dirname, '../../database/init.sql');
            }
        } else {
            // 開発環境
            initSqlPath = path.join(__dirname, '../../database/init.sql');
        }
        
        console.log('Loading init.sql from:', initSqlPath);
        const initSql = fs.readFileSync(initSqlPath, 'utf8');
        
        try {
            this.db.exec(initSql);
            console.log('Database initialized successfully');
            
            // パッケージ化環境の場合、録音パスを適切に設定
            try {
                await this.updateRecordingPathForElectron();
            } catch (error) {
                console.error('Failed to update recording path:', error);
                // エラーでも継続
            }
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    }
    
    async updateRecordingPathForElectron() {
        const isElectron = process.versions.electron !== undefined;
        if (isElectron && this.recordingsDir) {
            // Electron環境の場合、録音パスを適切なディレクトリに更新
            const updateSql = `UPDATE settings SET value = ? WHERE key = 'recording_path'`;
            try {
                const stmt = this.db.prepare(updateSql);
                stmt.run(this.recordingsDir);
                console.log('Recording path updated for Electron environment:', this.recordingsDir);
            } catch (error) {
                console.error('Failed to update recording path:', error);
                throw error;
            }
        }
    }

    async run(sql, params = []) {
        try {
            const stmt = this.db.prepare(sql);
            const result = stmt.run(params);
            return { id: result.lastInsertRowid, changes: result.changes };
        } catch (error) {
            console.error('Database run error:', error);
            throw error;
        }
    }

    async get(sql, params = []) {
        try {
            const stmt = this.db.prepare(sql);
            const result = stmt.get(params);
            return result;
        } catch (error) {
            console.error('Database get error:', error);
            throw error;
        }
    }

    async all(sql, params = []) {
        try {
            const stmt = this.db.prepare(sql);
            const results = stmt.all(params);
            return results;
        } catch (error) {
            console.error('Database all error:', error);
            throw error;
        }
    }

    async close() {
        try {
            if (this.db) {
                this.db.close();
                console.log('Database connection closed');
            }
        } catch (error) {
            console.error('Error closing database:', error);
            throw error;
        }
    }
}

module.exports = MyRadikoDatabase;