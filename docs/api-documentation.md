# 📡 **MyRadiko API ドキュメント** （2025年7月3日版）

## **API 概要**
MyRadiko の REST API 仕様書。番組表取得、予約管理、録音管理、システム監視などの機能を HTTP API として提供。

**ベースURL**: `http://localhost:3010/api`  
**認証**: なし（ローカル実行のため）  
**データ形式**: JSON  
**文字エンコーディング**: UTF-8

---

## **📋 共通レスポンス形式**

### **成功レスポンス**
```json
{
  "success": true,
  "data": { /* 実際のデータ */ },
  "message": "Optional success message"
}
```

### **エラーレスポンス**
```json
{
  "success": false,
  "error": "エラーの種類",
  "message": "詳細なエラーメッセージ"
}
```

### **HTTPステータスコード**
- `200 OK`: 成功
- `201 Created`: 作成成功
- `400 Bad Request`: リクエストパラメータエラー
- `404 Not Found`: リソースが見つからない
- `500 Internal Server Error`: サーバー内部エラー
- `503 Service Unavailable`: サービス利用不可

---

## **🏥 ヘルスチェック API**

### **GET /health**
APIサーバーの動作確認

#### **リクエスト**
```http
GET /api/health
```

#### **レスポンス**
```json
{
  "status": "OK",
  "message": "MyRadiko API Server is running",
  "timestamp": "2025-07-03T10:30:00.000Z"
}
```

---

## **📻 放送局 API**

### **GET /stations**
全放送局一覧取得

#### **リクエスト**
```http
GET /api/stations
```

#### **レスポンス**
```json
{
  "success": true,
  "data": [
    {
      "id": "TBS",
      "name": "TBSラジオ",
      "area": "JP13",
      "freq": "954"
    }
  ]
}
```

### **GET /stations/:areaCode**
地域別放送局取得

#### **パラメータ**
- `areaCode` (string): 地域コード（例: JP13）

#### **リクエスト**
```http
GET /api/stations/JP13
```

---

## **📺 番組表 API**

### **GET /programs/:stationId/date/:date**
指定日の番組表取得

#### **パラメータ**
- `stationId` (string): 放送局ID（例: TBS）
- `date` (string): 日付（YYYY-MM-DD形式）

#### **リクエスト**
```http
GET /api/programs/TBS/date/2025-07-03
```

#### **レスポンス**
```json
{
  "success": true,
  "data": {
    "station": {
      "id": "TBS",
      "name": "TBSラジオ"
    },
    "date": "2025-07-03",
    "programs": [
      {
        "id": "20250703_TBS_0500",
        "title": "早朝ニュース",
        "start_time": "2025-07-03T05:00:00.000Z",
        "end_time": "2025-07-03T05:30:00.000Z",
        "performer": "アナウンサー",
        "description": "最新ニュースをお届け",
        "genre": "報道"
      }
    ]
  }
}
```

### **GET /programs/:stationId/weekly**
週間番組表取得

#### **パラメータ**
- `stationId` (string): 放送局ID

#### **クエリパラメータ**
- `start_date` (string, optional): 開始日（YYYY-MM-DD、デフォルト: 今日）

#### **リクエスト**
```http
GET /api/programs/TBS/weekly?start_date=2025-07-03
```

### **GET /programs/:stationId/current**
現在放送中の番組取得

#### **リクエスト**
```http
GET /api/programs/TBS/current
```

### **GET /programs/search**
番組検索

#### **クエリパラメータ**
- `q` (string): 検索キーワード
- `station` (string, optional): 放送局ID
- `date` (string, optional): 対象日（YYYY-MM-DD）
- `genre` (string, optional): ジャンル

#### **リクエスト**
```http
GET /api/programs/search?q=ニュース&station=TBS&date=2025-07-03
```

---

## **⏰ 予約管理 API**

### **GET /reservations**
予約一覧取得

#### **クエリパラメータ**
- `limit` (number, optional): 取得件数（デフォルト: 100）
- `offset` (number, optional): オフセット（デフォルト: 0）
- `status` (string, optional): 状態フィルター（active/inactive）

#### **リクエスト**
```http
GET /api/reservations?limit=10&status=active
```

#### **レスポンス**
```json
{
  "success": true,
  "data": [
    {
      "id": 7,
      "title": "山下達郎の楽天カード サンデー・ソングブック",
      "station_id": "FMT",
      "station_name": "TOKYO FM",
      "start_time": "2025-07-06T14:00:00.000Z",
      "end_time": "2025-07-06T14:54:00.000Z",
      "repeat_type": "weekly",
      "repeat_days": "[0]",
      "is_active": 1,
      "created_at": "2025-06-28T14:18:34.000Z",
      "updated_at": "2025-06-28T14:18:34.000Z"
    }
  ],
  "count": 5,
  "total": 5
}
```

### **GET /reservations/:id**
予約詳細取得

#### **パラメータ**
- `id` (number): 予約ID

#### **リクエスト**
```http
GET /api/reservations/7
```

### **POST /reservations**
予約作成

#### **リクエストボディ**
```json
{
  "title": "新番組",
  "station_id": "TBS",
  "station_name": "TBSラジオ",
  "start_time": "2025-07-10T20:00:00.000Z",
  "end_time": "2025-07-10T21:00:00.000Z",
  "repeat_type": "none",
  "repeat_days": null
}
```

#### **レスポンス**
```json
{
  "success": true,
  "data": {
    "id": 13,
    "title": "新番組",
    "station_id": "TBS",
    "station_name": "TBSラジオ",
    "start_time": "2025-07-10T20:00:00.000Z",
    "end_time": "2025-07-10T21:00:00.000Z",
    "repeat_type": "none",
    "repeat_days": null,
    "is_active": 1,
    "created_at": "2025-07-03T10:30:00.000Z",
    "updated_at": "2025-07-03T10:30:00.000Z"
  },
  "message": "予約が作成されました"
}
```

### **PUT /reservations/:id**
予約更新

#### **パラメータ**
- `id` (number): 予約ID

#### **リクエストボディ**
```json
{
  "title": "番組名変更",
  "is_active": 0
}
```

### **DELETE /reservations/:id**
予約削除

#### **パラメータ**
- `id` (number): 予約ID

#### **レスポンス**
```json
{
  "success": true,
  "message": "予約が削除されました"
}
```

### **GET /reservations/upcoming/:hours**
近日予約取得

#### **パラメータ**
- `hours` (number): 今後何時間以内の予約を取得するか

#### **リクエスト**
```http
GET /api/reservations/upcoming/24
```

---

## **🎵 録音管理 API**

### **GET /recordings**
録音履歴一覧取得

#### **クエリパラメータ**
- `limit` (number, optional): 取得件数（デフォルト: 100）
- `offset` (number, optional): オフセット（デフォルト: 0）
- `status` (string, optional): 状態フィルター

#### **リクエスト**
```http
GET /api/recordings?limit=20&status=completed
```

#### **レスポンス**
```json
{
  "success": true,
  "data": [
    {
      "id": 19,
      "reservation_id": 11,
      "title": "最終テスト_過去番組",
      "station_id": "LFR",
      "station_name": "ニッポン放送",
      "start_time": "2025-07-02T06:00:00.000Z",
      "end_time": "2025-07-02T06:02:00.000Z",
      "file_path": "/home/user/recordings/LFR_20250702_060000_最終テスト_過去番組.m4a",
      "file_size": 2048576,
      "status": "completed",
      "error_message": null,
      "created_at": "2025-07-02T16:00:01.000Z",
      "updated_at": "2025-07-02T16:00:01.000Z"
    }
  ],
  "count": 19,
  "limit": 100
}
```

### **GET /recordings/:id**
録音詳細取得

#### **パラメータ**
- `id` (number): 録音ID

#### **レスポンス**
```json
{
  "success": true,
  "data": {
    "id": 19,
    "reservation_id": 11,
    "title": "最終テスト_過去番組",
    "station_id": "LFR",
    "station_name": "ニッポン放送",
    "start_time": "2025-07-02T06:00:00.000Z",
    "end_time": "2025-07-02T06:02:00.000Z",
    "file_path": "/home/user/recordings/LFR_20250702_060000_最終テスト_過去番組.m4a",
    "file_size": 2048576,
    "status": "completed",
    "error_message": null,
    "created_at": "2025-07-02T16:00:01.000Z",
    "updated_at": "2025-07-02T16:00:01.000Z",
    "file_exists": true,
    "duration": 120
  }
}
```

### **DELETE /recordings/:id**
録音削除

#### **パラメータ**
- `id` (number): 録音ID

#### **レスポンス**
```json
{
  "success": true,
  "message": "録音が削除されました"
}
```

#### **注意事項**
- ファイルシステム上のファイルとデータベースレコードの両方が削除されます
- 削除されたデータは復元できません

### **GET /recordings/recent/:days**
最近の録音取得

#### **パラメータ**
- `days` (number): 過去何日分の録音を取得するか

#### **リクエスト**
```http
GET /api/recordings/recent/7
```

---

## **⚙️ スケジューラー API**

### **GET /scheduler/status**
スケジューラー状態取得

#### **レスポンス**
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "activeReservations": 5,
    "activeDownloads": 0,
    "nextCheck": "2025-07-03T10:31:00.000Z",
    "uptime": 86400,
    "processedToday": 3
  }
}
```

### **POST /scheduler/start**
スケジューラー開始

#### **レスポンス**
```json
{
  "success": true,
  "message": "Recording scheduler started successfully"
}
```

### **POST /scheduler/stop**
スケジューラー停止

#### **レスポンス**
```json
{
  "success": true,
  "message": "Recording scheduler stopped successfully"
}
```

### **POST /scheduler/update**
予約チェック手動実行

#### **レスポンス**
```json
{
  "success": true,
  "message": "Recording schedules checked and updated",
  "data": {
    "checkedReservations": 5,
    "startedDownloads": 2,
    "completedDownloads": 1
  }
}
```

### **GET /scheduler/active**
アクティブなダウンロード取得

#### **レスポンス**
```json
{
  "success": true,
  "data": {
    "count": 2,
    "downloads": [
      {
        "id": "download_1751477367787",
        "title": "過去番組テスト",
        "station_id": "FMT",
        "status": "downloading",
        "progress": 45,
        "startTime": "2025-07-03T10:25:00.000Z"
      }
    ]
  }
}
```

---

## **📊 システム管理 API**

### **GET /system/info**
システム情報取得

#### **レスポンス**
```json
{
  "success": true,
  "data": {
    "platform": "linux",
    "architecture": "x64",
    "nodeVersion": "v22.16.0",
    "hostname": "myradiko-server",
    "uptime": 86400,
    "memory": {
      "total": 8589934592,
      "free": 4294967296,
      "used": 4294967296,
      "processUsed": {
        "rss": 134217728,
        "heapTotal": 67108864,
        "heapUsed": 50331648,
        "external": 16777216
      }
    },
    "cpu": {
      "model": "Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz",
      "cores": 12,
      "loadAverage": [0.5, 0.7, 0.8]
    },
    "storage": {
      "recordingsPath": "/home/user/recordings",
      "fileCount": 15,
      "totalSize": 1073741824,
      "totalSizeFormatted": "1.00 GB",
      "diskSpace": {
        "total": "100GB",
        "used": "45GB",
        "available": "55GB",
        "usePercentage": "45%"
      }
    },
    "recordings": {
      "path": "/home/user/recordings",
      "canOpenFolder": true
    },
    "dependencies": {
      "ffmpeg": {
        "available": true,
        "version": "4.4.2-0ubuntu0.22.04.1",
        "path": "/usr/bin/ffmpeg",
        "platform": "linux"
      },
      "sqlite": {
        "available": true,
        "version": "Node.js sqlite3 package available"
      },
      "curl": {
        "available": true,
        "version": "7.81.0"
      }
    },
    "runtime": {
      "startTime": "2025-07-03T09:30:00.000Z",
      "uptime": 3600,
      "environment": "development",
      "pid": 12345
    }
  }
}
```

### **GET /system/stats**
詳細システム統計取得

#### **レスポンス**
```json
{
  "success": true,
  "data": {
    "timestamp": "2025-07-03T10:30:00.000Z",
    "process": {
      "pid": 12345,
      "uptime": 3600,
      "memory": {
        "rss": 134217728,
        "heapTotal": 67108864,
        "heapUsed": 50331648,
        "external": 16777216
      },
      "cpu": {
        "user": 1000000,
        "system": 500000
      },
      "version": "v22.16.0",
      "platform": "linux",
      "arch": "x64"
    },
    "system": {
      "hostname": "myradiko-server",
      "uptime": 86400,
      "loadavg": [0.5, 0.7, 0.8],
      "totalmem": 8589934592,
      "freemem": 4294967296,
      "cpus": 12,
      "networkInterfaces": 3
    },
    "application": {
      "environment": "development",
      "logLevel": "info",
      "recordingsPath": "/home/user/recordings"
    }
  }
}
```

### **GET /system/health**
システムヘルスチェック

#### **レスポンス**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-07-03T10:30:00.000Z",
    "score": "5/5",
    "checks": {
      "database": true,
      "recordings": true,
      "dependencies": true,
      "memory": true,
      "disk": true
    },
    "details": {
      "database": "Connected",
      "recordings": "Accessible",
      "dependencies": {
        "ffmpeg": {
          "available": true,
          "version": "4.4.2-0ubuntu0.22.04.1"
        },
        "sqlite": {
          "available": true,
          "version": "Node.js sqlite3 package available"
        },
        "curl": {
          "available": true,
          "version": "7.81.0"
        }
      },
      "memory": {
        "usage": "50.0%",
        "total": "8.00 GB",
        "free": "4.00 GB"
      },
      "disk": {
        "fileCount": 15,
        "totalSizeFormatted": "1.00 GB"
      }
    }
  }
}
```

---

## **⚙️ 設定管理 API**

### **GET /settings**
設定一覧取得

#### **レスポンス**
```json
{
  "success": true,
  "data": [
    {
      "key": "recording_folder",
      "value": "/home/user/recordings",
      "description": "録音ファイル保存先フォルダ"
    },
    {
      "key": "recording_format",
      "value": "m4a",
      "description": "録音ファイル形式"
    },
    {
      "key": "default_station",
      "value": "TBS",
      "description": "デフォルト放送局"
    }
  ]
}
```

### **GET /settings/:key**
個別設定取得

#### **パラメータ**
- `key` (string): 設定キー

#### **リクエスト**
```http
GET /api/settings/recording_folder
```

#### **レスポンス**
```json
{
  "success": true,
  "data": {
    "key": "recording_folder",
    "value": "/home/user/recordings",
    "description": "録音ファイル保存先フォルダ"
  }
}
```

### **POST /settings**
設定作成

#### **リクエストボディ**
```json
{
  "key": "notification_enabled",
  "value": "true",
  "description": "録音通知の有効/無効"
}
```

### **PUT /settings/:key**
設定更新

#### **リクエストボディ**
```json
{
  "value": "/new/recording/path"
}
```

### **DELETE /settings/:key**
設定削除

### **GET /settings/default/recording-folder**
デフォルト録音フォルダ取得

#### **レスポンス**
```json
{
  "success": true,
  "data": {
    "defaultPath": "/home/user/recordings",
    "isElectron": true
  }
}
```

---

## **📋 ログ管理 API**

### **GET /logs**
ログ一覧取得

#### **クエリパラメータ**
- `level` (string, optional): ログレベル（error/warning/info/debug）
- `category` (string, optional): カテゴリ（auth/scheduler/recording/api/system）
- `limit` (number, optional): 取得件数（デフォルト: 100）
- `offset` (number, optional): オフセット（デフォルト: 0）
- `start_date` (string, optional): 開始日時（ISO 8601）
- `end_date` (string, optional): 終了日時（ISO 8601）

#### **リクエスト**
```http
GET /api/logs?level=error&category=recording&limit=50
```

#### **レスポンス**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "level": "error",
      "category": "recording",
      "message": "Recording failed for program: テスト番組",
      "details": "{\"error\":\"FFmpeg process failed\",\"exitCode\":1}",
      "timestamp": "2025-07-03T10:25:00.000Z"
    }
  ],
  "count": 25,
  "total": 150
}
```

### **GET /logs/:level**
レベル別ログ取得

#### **パラメータ**
- `level` (string): ログレベル

### **GET /logs/config**
ログ設定取得

#### **レスポンス**
```json
{
  "success": true,
  "data": {
    "logLevel": "info",
    "enableConsole": true,
    "enableDatabase": true,
    "retentionDays": 30,
    "categories": ["auth", "scheduler", "recording", "api", "system"]
  }
}
```

### **POST /logs/level**
ログレベル設定

#### **リクエストボディ**
```json
{
  "level": "debug"
}
```

### **POST /logs/cleanup**
ログクリーンアップ実行

#### **リクエストボディ**
```json
{
  "retentionDays": 30
}
```

#### **レスポンス**
```json
{
  "success": true,
  "message": "Log cleanup completed. Retained logs for 30 days",
  "data": {
    "retentionDays": 30,
    "deletedRows": 1000
  }
}
```

---

## **🎬 録音実行 API**

### **POST /download/past-program**
過去番組ダウンロード

#### **リクエストボディ**
```json
{
  "title": "過去番組テスト",
  "stationId": "TBS",
  "stationName": "TBSラジオ",
  "startTime": "2025-07-01T10:00:00.000Z",
  "endTime": "2025-07-01T11:00:00.000Z"
}
```

#### **レスポンス**
```json
{
  "success": true,
  "message": "過去番組のダウンロードを開始しました",
  "data": {
    "downloadId": "download_1751477367787",
    "title": "過去番組テスト",
    "stationId": "TBS",
    "estimatedDuration": 3600,
    "outputPath": "/home/user/recordings/TBS_20250701_100000_過去番組テスト.m4a"
  }
}
```

---

## **📁 ファイル操作 API**

### **GET /recordings/:id/play**
録音ファイルストリーミング再生

#### **パラメータ**
- `id` (number): 録音ID

#### **ヘッダー**
- `Range` (optional): 部分コンテンツ取得用

#### **レスポンス**
- **成功時**: 音声ファイルストリーム（Content-Type: audio/mp4）
- **Range指定時**: 206 Partial Content

### **GET /recordings/:id/download**
録音ファイルダウンロード

#### **パラメータ**
- `id` (number): 録音ID

#### **レスポンス**
- **成功時**: ファイルダウンロード（Content-Disposition: attachment）

### **POST /system/open-folder**
フォルダをエクスプローラーで開く

#### **リクエストボディ**
```json
{
  "folderPath": "/home/user/recordings"
}
```

#### **レスポンス**
```json
{
  "success": true,
  "message": "Folder opened successfully",
  "data": {
    "path": "/home/user/recordings",
    "platform": "linux"
  }
}
```

---

## **🔧 エラーコード一覧**

### **4xx クライアントエラー**

| コード | エラー名 | 説明 |
|--------|----------|------|
| 400 | Bad Request | リクエストパラメータが不正 |
| 401 | Unauthorized | 認証が必要（現在は未使用） |
| 403 | Forbidden | アクセスが禁止されている |
| 404 | Not Found | リソースが見つからない |
| 409 | Conflict | データの競合（重複予約等） |
| 422 | Unprocessable Entity | データ形式は正しいが処理できない |

### **5xx サーバーエラー**

| コード | エラー名 | 説明 |
|--------|----------|------|
| 500 | Internal Server Error | サーバー内部エラー |
| 502 | Bad Gateway | 外部API（radiko）からの不正レスポンス |
| 503 | Service Unavailable | サービス利用不可（メンテナンス等） |
| 504 | Gateway Timeout | 外部API（radiko）のタイムアウト |

### **一般的なエラーレスポンス例**

#### **400 Bad Request**
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "必須パラメータ 'stationId' が指定されていません"
}
```

#### **404 Not Found**
```json
{
  "success": false,
  "error": "Not Found",
  "message": "指定された録音（ID: 999）は存在しません"
}
```

#### **500 Internal Server Error**
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "データベース接続エラーが発生しました"
}
```

---

## **📊 レート制限・制約事項**

### **API レート制限**
- **なし**: ローカル実行のため制限なし
- **同時接続数**: 実質的制限なし（Node.js の制限による）

### **データサイズ制限**
- **リクエストボディ**: 最大 10MB
- **レスポンスサイズ**: 実質的制限なし（メモリによる）
- **ファイルアップロード**: 対応なし

### **録音制限**
- **同時録音数**: 実質的制限なし（FFmpeg プロセス数・システムリソースによる）
- **録音時間**: 最大 24時間/番組
- **ファイルサイズ**: ディスク容量による制限のみ

---

## **🔐 セキュリティ考慮事項**

### **認証・認可**
- **現在**: 認証なし（ローカル実行想定）
- **将来**: JWT トークン認証の実装可能

### **入力検証**
- **SQLインジェクション**: パラメータ化クエリで対策済み
- **XSS**: レスポンスはJSONのみ、HTMLエスケープ不要
- **パストラバーサル**: ファイルパス検証で対策済み

### **CORS 設定**
```javascript
app.use(cors({
  origin: ['http://localhost:3010', 'http://localhost:5173'],
  credentials: true
}));
```

---

## **📈 パフォーマンス考慮事項**

### **キャッシュ戦略**
- **番組表データ**: メモリキャッシュ（15分間）
- **システム情報**: リアルタイム取得（キャッシュなし）
- **静的ファイル**: Express.js の static キャッシュ

### **データベース最適化**
- **インデックス**: 主要検索項目にインデックス設定
- **接続プール**: SQLite のため単一接続
- **クエリ最適化**: 必要最小限のカラムのみ取得

### **推奨される使用パターン**
- **ポーリング間隔**: 最小 1秒（リアルタイム更新時）
- **バッチ処理**: 複数操作は単一トランザクションで実行
- **大量データ**: ページネーション必須

---

## **🧪 API テスト例**

### **curl コマンド例**

#### **ヘルスチェック**
```bash
curl -X GET http://localhost:3010/api/health
```

#### **予約作成**
```bash
curl -X POST http://localhost:3010/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "title": "テスト番組",
    "station_id": "TBS",
    "station_name": "TBSラジオ",
    "start_time": "2025-07-10T20:00:00.000Z",
    "end_time": "2025-07-10T21:00:00.000Z"
  }'
```

#### **録音履歴取得**
```bash
curl -X GET "http://localhost:3010/api/recordings?limit=10&status=completed"
```

#### **システム情報取得**
```bash
curl -X GET http://localhost:3010/api/system/info
```

### **JavaScript fetch 例**

#### **予約一覧取得**
```javascript
const fetchReservations = async () => {
  try {
    const response = await fetch('/api/reservations');
    const data = await response.json();
    
    if (data.success) {
      console.log('予約一覧:', data.data);
    } else {
      console.error('エラー:', data.message);
    }
  } catch (error) {
    console.error('API呼び出しエラー:', error);
  }
};
```

#### **過去番組ダウンロード**
```javascript
const downloadPastProgram = async (programInfo) => {
  try {
    const response = await fetch('/api/download/past-program', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(programInfo)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('ダウンロード開始:', result.data.downloadId);
    } else {
      console.error('ダウンロード失敗:', result.message);
    }
  } catch (error) {
    console.error('ダウンロードエラー:', error);
  }
};
```

---

## **📚 関連ドキュメント**

- [要件定義書](./requirements.md)
- [テスト仕様書](./test-specification.md)
- [開発記録・知見集](./development-notes.md)

---

**最終更新**: 2025年7月3日  
**APIバージョン**: v1.0.0  
**ベースURL**: http://localhost:3010/api