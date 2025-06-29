-- myradiko database schema

-- 設定テーブル
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 録音予約テーブル
CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    station_id TEXT NOT NULL,
    station_name TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    repeat_type TEXT DEFAULT 'none', -- none, daily, weekly, monthly
    repeat_days TEXT, -- JSON array for weekly repeats (e.g., ["mon", "wed", "fri"])
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 録音履歴テーブル
CREATE TABLE IF NOT EXISTS recording_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reservation_id INTEGER,
    title TEXT NOT NULL,
    station_id TEXT NOT NULL,
    station_name TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    status TEXT DEFAULT 'recording', -- recording, completed, failed
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reservation_id) REFERENCES reservations (id) ON DELETE SET NULL
);

-- ログテーブル
CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level TEXT NOT NULL, -- info, warning, error
    category TEXT NOT NULL, -- recording, api, system
    message TEXT NOT NULL,
    details TEXT, -- JSON format for additional data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 初期設定データの挿入
INSERT OR IGNORE INTO settings (key, value, description) VALUES
('recording_path', './recordings', '録音ファイルの保存先フォルダ'),
('filename_format', '{station_name}_{title}_{date}.mp3', 'ファイル名の形式'),
('recording_margin_before', '30', '録音開始前のマージン（秒）'),
('recording_margin_after', '30', '録音終了後のマージン（秒）'),
('default_view_mode', 'timetable', 'デフォルトの番組表表示形式'),
('time_format', '24', '時間表示形式（12/24）'),
('log_retention_days', '30', 'ログ保存期間（日）'),
('auto_delete_recordings', 'false', '古い録音ファイルの自動削除'),
('auto_delete_days', '7', '自動削除までの日数'),
('program_guide_update_interval', '6', '番組表更新間隔（時間）');