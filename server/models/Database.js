const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
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
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    // console.log('Connected to SQLite database'); // ログを無効化
                    resolve();
                }
            });
        });
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
        
        return new Promise((resolve, reject) => {
            this.db.exec(initSql, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('Database initialized successfully');
                    // パッケージ化環境の場合、録音パスを適切に設定
                    this.updateRecordingPathForElectron().then(() => {
                        resolve();
                    }).catch((error) => {
                        console.error('Failed to update recording path:', error);
                        resolve(); // エラーでも継続
                    });
                }
            });
        });
    }
    
    async updateRecordingPathForElectron() {
        const isElectron = process.versions.electron !== undefined;
        if (isElectron && this.recordingsDir) {
            // Electron環境の場合、録音パスを適切なディレクトリに更新
            const updateSql = `UPDATE settings SET value = ? WHERE key = 'recording_path'`;
            return new Promise((resolve, reject) => {
                this.db.run(updateSql, [this.recordingsDir], (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('Recording path updated for Electron environment:', this.recordingsDir);
                        resolve();
                    }
                });
            });
        }
    }

    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        // console.log('Database connection closed'); // ログを無効化
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = Database;