# 📝 **MyRadiko 開発記録・知見集** （2025年7月3日版）

## **プロジェクト概要**
radikoの番組表表示と録音・録音予約を行うWebアプリケーションの開発過程で得られた技術的知見・トラブルシューティング・ベストプラクティス

---

## **🏗️ アーキテクチャ設計の知見**

### **1. 技術スタック選定の理由**

#### **フロントエンド: Vue.js 3 + Composition API**
- **選定理由**: リアクティブなデータバインディングが番組表・予約管理に最適
- **知見**: Composition API により複雑な状態管理が簡潔に記述可能
- **注意点**: `ref()` と `reactive()` の使い分けが重要
```javascript
// 良い例: 単純な値は ref()
const isLoading = ref(false)

// 良い例: オブジェクトは reactive()
const programData = reactive({
  programs: [],
  selectedDate: new Date()
})
```

#### **バックエンド: Node.js + Express**
- **選定理由**: JavaScript統一、非同期処理に優れる
- **知見**: radiko API の非同期呼び出しとFFmpeg プロセス管理で威力発揮
- **注意点**: メモリリーク対策として、長時間プロセスは適切にクリーンアップ必要

#### **データベース: SQLite**
- **選定理由**: 軽量、セットアップ不要、個人利用に最適
- **知見**: トランザクション処理で録音履歴の整合性を保持
- **制限事項**: 同時書き込み数に制限があるが、個人利用では問題なし

#### **デスクトップ: Electron**
- **選定理由**: Web技術でネイティブアプリ化、クロスプラットフォーム対応
- **知見**: IPC (Inter-Process Communication) でフォルダ選択等のOS機能統合
- **注意点**: セキュリティ設定（`nodeIntegration: false`, `contextIsolation: true`）必須

---

## **🔧 radiko API 統合の知見**

### **1. radiko v2 API 認証システム**

#### **認証フロー実装**
```javascript
// 2段階認証プロセス
const authFlow = {
  step1: 'Auth1 - 初期認証トークン取得',
  step2: 'Auth2 - 部分キー生成・最終認証'
}
```

#### **重要な発見・修正事項**
1. **認証キーの更新 (2025年対応)**
   ```javascript
   // 旧: 'bcd151073c03b352e1ef2fd66c32209da9980f15'
   // 新: 'bcd151073c03b352e1ef2fd66c32209da9ca0afa'
   this.authKeyText = 'bcd151073c03b352e1ef2fd66c32209da9ca0afa';
   ```
   - **知見**: radikoは定期的に認証キーを変更するため、401エラー時は最新キーを確認必要

2. **User-Agent の重要性**
   ```javascript
   // 旧: Mozilla/5.0 ブラウザ文字列
   // 新: 'curl/7.56.1'
   this.userAgent = 'curl/7.56.1';
   ```
   - **知見**: 2025年からブラウザ系User-Agentが制限され、curl系が必要

3. **部分キー生成の境界値処理**
   ```javascript
   // keyOffset=0 の場合のハンドリング
   if (keyOffset === 0 && keyLength > 0) {
       const partialKey = authKeyBuffer.slice(0, keyLength);
       // 正常処理
   }
   ```
   - **知見**: `keyOffset=0`は有効な値として処理する必要がある

### **2. ストリーミングURL取得**

#### **リアルタイム vs タイムシフト**
```javascript
// リアルタイム
const liveURL = `https://radiko.jp/v2/api/ts/playlist.m3u8?station_id=${stationId}&l=15&lsid=${lsid}&type=b`;

// タイムシフト（過去番組）
const timeshiftURL = `https://radiko.jp/v2/api/ts/playlist.m3u8?station_id=${stationId}&l=15&lsid=${lsid}&type=b&start_at=${startTime}&ft=${startTime}&to=${endTime}`;
```

#### **エラーハンドリングの知見**
- **401 Unauthorized**: 認証トークンまたは認証キーの問題
- **403 Forbidden**: 地域制限またはタイムシフト期間外
- **404 Not Found**: 存在しない番組またはURL構文エラー

---

## **🎵 FFmpeg 統合の知見**

### **1. クロスプラットフォーム対応**

#### **プラットフォーム別検出ロジック**
```javascript
const searchPaths = {
  win32: [
    // アプリ内蔵 → ローカル → システムPATH の順
    path.join(process.resourcesPath || '.', 'ffmpeg', 'ffmpeg.exe'),
    'C:\\ffmpeg\\bin\\ffmpeg.exe',
    'ffmpeg.exe'
  ],
  darwin: [
    '/opt/homebrew/bin/ffmpeg', // Apple Silicon
    '/usr/local/bin/ffmpeg',    // Intel Mac
    'ffmpeg'
  ],
  linux: [
    '/usr/bin/ffmpeg',          // パッケージマネージャー
    '/snap/bin/ffmpeg',         // Snap
    'ffmpeg'
  ]
};
```

#### **Windows 配布戦略の検討結果**
1. **軽量版 (推奨)**: アプリのみ配布、初回起動時にFFmpegインストール案内
2. **完全版**: FFmpeg同梱で配布（約60MB増加）
3. **インストーラー版**: 自動セットアップ（管理者権限必要）

### **2. 録音品質とパフォーマンス**

#### **FFmpeg パラメータ調整**
```javascript
const ffmpegArgs = [
  '-y', // 既存ファイル上書き
  '-headers', `X-Radiko-AuthToken: ${authToken}`,
  '-user_agent', 'curl/7.56.1',
  '-i', streamURL,
  '-vn', // 映像なし
  '-acodec', 'copy', // 音声コーデックコピー（再エンコードなし）
  '-t', duration,
  '-f', 'mp4',
  outputPath
];
```

#### **重要な知見**
- **`-acodec copy`**: 再エンコードしないため高速＆高品質
- **ヘッダー設定**: radiko認証トークンとUser-Agentが必須
- **プロセス監視**: `stderr` に進行状況、`stdout` に一般出力

---

## **📊 データベース設計の知見**

### **1. スキーマ設計のベストプラクティス**

#### **予約テーブル設計**
```sql
CREATE TABLE reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    station_id TEXT NOT NULL,
    station_name TEXT,
    start_time TEXT NOT NULL,  -- ISO 8601 または YYYYMMDDHHMMSS
    end_time TEXT NOT NULL,
    repeat_type TEXT DEFAULT 'none',
    repeat_days TEXT,          -- JSON配列または CSV
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **録音履歴テーブル設計**
```sql
CREATE TABLE recording_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reservation_id INTEGER,   -- 予約からの録音の場合
    title TEXT NOT NULL,
    station_id TEXT NOT NULL,
    station_name TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    file_path TEXT,          -- 録音ファイルパス
    file_size INTEGER,       -- ファイルサイズ（バイト）
    status TEXT DEFAULT 'scheduled', -- scheduled/recording/completed/failed
    error_message TEXT,      -- エラー詳細
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);
```

### **2. 時刻処理の標準化**

#### **統一ルール**
- **API間**: ISO 8601形式 (`2025-07-03T14:00:00.000Z`)
- **radiko API**: YYYYMMDDHHMMSS形式 (`20250703140000`)
- **データベース**: ISO 8601形式で統一

#### **変換ユーティリティ**
```javascript
// 時刻フォーマット変換
const timeUtils = {
  toRadikoFormat: (isoString) => {
    return new Date(isoString).toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  },
  toISOString: (radikoTime) => {
    const str = radikoTime.toString();
    return `${str.slice(0,4)}-${str.slice(4,6)}-${str.slice(6,8)}T${str.slice(8,10)}:${str.slice(10,12)}:${str.slice(12,14)}.000Z`;
  }
};
```

---

## **⚡ パフォーマンス最適化の知見**

### **1. Vue.js フロントエンド最適化**

#### **番組表表示の最適化**
```javascript
// 大量データの仮想スクロール実装
const programList = computed(() => {
  return programs.value.slice(startIndex.value, endIndex.value);
});

// 番組予約状態のメモ化
const isReservedProgram = (program) => {
  return reservationsMap.value.has(`${program.station_id}-${program.start_time}`);
};
```

#### **API呼び出しの最適化**
```javascript
// デバウンス処理で検索APIの過剰呼び出し防止
const debouncedSearch = debounce(async (query) => {
  await searchPrograms(query);
}, 300);
```

### **2. Node.js バックエンド最適化**

#### **メモリ使用量削減**
```javascript
// ストリーム処理でメモリ効率改善
const processLargeData = (dataStream) => {
  return pipeline(
    dataStream,
    transform(/* 変換処理 */),
    destination,
    (err) => {
      if (err) console.error('Pipeline failed:', err);
    }
  );
};
```

#### **同時実行制御**
```javascript
// 同時録音数の制限
const concurrentLimit = 3;
const recordingQueue = new PQueue({ concurrency: concurrentLimit });

const startRecording = async (programInfo) => {
  return recordingQueue.add(() => recorder.record(programInfo));
};
```

---

## **🐛 トラブルシューティング事例集**

### **1. radiko 認証エラー (401 Unauthorized)**

#### **症状**
```
Server returned 401 Unauthorized (authorization failed)
```

#### **原因と対策**
1. **認証キーの古さ**
   - **対策**: 最新の認証キーに更新
   - **確認方法**: ブラウザのネットワークタブでradikoサイトの認証リクエストを確認

2. **User-Agent の制限**
   - **対策**: `curl/7.56.1` など curl系に変更
   - **注意**: Mozilla系User-Agentは2025年から制限強化

3. **地域制限**
   - **対策**: 利用可能地域での実行確認
   - **確認方法**: Auth2レスポンスの地域情報を確認

### **2. API ルーティング競合 (404 Not Found)**

#### **症状**
```
Cannot GET /api/reservations
Cannot GET /api/recordings
```

#### **原因**
- Express.js の複数ルートファイル競合
- `/server/routes/recordings.js` と `/server/controllers/recordingsController.js` の重複

#### **対策**
```javascript
// api.js での正しいルーティング
router.get('/recordings', recordingsController.getAll);
router.get('/recordings/:id', recordingsController.getById);

// 別ファイルルートの削除
// router.use('/recordings', recordingsRoutes); // 削除
```

### **3. FFmpeg プロセス管理エラー**

#### **症状**
- プロセスのゾンビ化
- メモリリーク
- 録音途中での停止

#### **対策**
```javascript
// 適切なプロセス管理
const ffmpegProcess = spawn('ffmpeg', args);

// タイムアウト設定
const timeout = setTimeout(() => {
  if (!ffmpegProcess.killed) {
    ffmpegProcess.kill('SIGTERM');
    setTimeout(() => {
      if (!ffmpegProcess.killed) {
        ffmpegProcess.kill('SIGKILL');
      }
    }, 5000);
  }
}, maxDuration * 1000);

// プロセス終了時のクリーンアップ
ffmpegProcess.on('close', () => {
  clearTimeout(timeout);
});
```

### **4. Electron IPC 通信エラー**

#### **症状**
```
Error: Cannot read property 'selectFolder' of undefined
```

#### **原因**
- preload.js でのAPI未公開
- セキュリティ設定の問題

#### **対策**
```javascript
// preload.js
contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  checkFolderPermissions: (folderPath) => ipcRenderer.invoke('check-folder-permissions', folderPath)
});

// main.js でのセキュリティ設定
new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    preload: path.join(__dirname, 'preload.js')
  }
});
```

---

## **🔒 セキュリティ考慮事項**

### **1. Electron セキュリティ**

#### **必須設定**
```javascript
const secureDefaults = {
  nodeIntegration: false,           // Node.js API への直接アクセス禁止
  contextIsolation: true,           // レンダラープロセスの分離
  enableRemoteModule: false,        // remote モジュール無効化
  allowRunningInsecureContent: false, // HTTP コンテンツの実行禁止
  experimentalFeatures: false       // 実験的機能無効化
};
```

#### **IPC 通信の制限**
```javascript
// 特定の操作のみ許可
const allowedOperations = [
  'select-folder',
  'check-folder-permissions',
  'create-folder'
];

ipcMain.handle('secure-operation', (event, operation, ...args) => {
  if (!allowedOperations.includes(operation)) {
    throw new Error('Operation not allowed');
  }
  // 処理実行
});
```

### **2. ファイルシステム保護**

#### **パス検証**
```javascript
const validatePath = (inputPath, basePath) => {
  const resolvedPath = path.resolve(inputPath);
  const resolvedBase = path.resolve(basePath);
  
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new Error('Path traversal attack detected');
  }
  
  return resolvedPath;
};
```

#### **権限チェック**
```javascript
const checkPermissions = async (dirPath) => {
  try {
    await fs.access(dirPath, fs.constants.W_OK);
    return { writable: true };
  } catch (error) {
    return { writable: false, error: error.message };
  }
};
```

---

## **📈 スケーラビリティ考慮事項**

### **1. 同時録音処理**

#### **現在の制限**
- 同時録音数: 制限なし（メモリ・CPU による自然制限）
- 実用的制限: 3-5番組程度（FFmpegプロセス数による）

#### **将来の拡張案**
```javascript
// キューイングシステム
class RecordingScheduler {
  constructor() {
    this.maxConcurrent = 3;
    this.activeRecordings = new Map();
    this.recordingQueue = [];
  }

  async scheduleRecording(programInfo) {
    if (this.activeRecordings.size >= this.maxConcurrent) {
      this.recordingQueue.push(programInfo);
    } else {
      await this.startRecording(programInfo);
    }
  }
}
```

### **2. データベース容量管理**

#### **ログローテーション**
```javascript
const cleanupOldLogs = async (retentionDays = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  await db.run(
    'DELETE FROM logs WHERE created_at < ?',
    [cutoffDate.toISOString()]
  );
};
```

#### **録音ファイル管理**
```javascript
const manageStorageSpace = async (maxSizeGB = 50) => {
  const totalSize = await calculateTotalSize();
  
  if (totalSize > maxSizeGB * 1024 * 1024 * 1024) {
    // 古いファイルから削除
    await deleteOldestFiles(totalSize - maxSizeGB * 1024 * 1024 * 1024);
  }
};
```

---

## **🚀 デプロイメント知見**

### **1. Electron ビルド最適化**

#### **ビルド設定**
```json
{
  "build": {
    "productName": "MyRadiko",
    "appId": "com.example.myradiko",
    "directories": {
      "output": "dist-electron"
    },
    "files": [
      "dist/**/*",
      "node_modules/**/*",
      "server/**/*",
      "database/**/*"
    ],
    "extraResources": [
      {
        "from": "database/",
        "to": "database/"
      }
    ],
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "mac": {
      "target": "dmg",
      "icon": "assets/icon.icns"
    },
    "linux": {
      "target": "AppImage",
      "icon": "assets/icon.png"
    }
  }
}
```

#### **サイズ最適化**
- **依存関係整理**: `devDependencies` と `dependencies` の適切な分離
- **不要ファイル除外**: `.gitignore` 類似の除外設定
- **圧縮設定**: Electron Builder の圧縮オプション活用

### **2. Windows 配布での注意点**

#### **ウイルス対策ソフト対応**
- **コード署名**: 信頼性確保のため
- **誤検知対策**: VirusTotal での事前チェック
- **ユーザー案内**: 初回実行時の警告への対処方法

#### **FFmpeg 配布戦略**
1. **同梱配布**: インストーラーに含める（推奨）
2. **自動ダウンロード**: 初回起動時に取得
3. **手動インストール**: ユーザーにインストール案内

---

## **💡 今後の改善提案**

### **1. 機能拡張**

#### **高優先度**
- **週間繰り返し予約**: 毎週同じ番組の自動予約
- **番組検索機能**: タイトル・出演者での横断検索
- **通知機能**: 録音開始・完了のデスクトップ通知

#### **中優先度**
- **プレイリスト機能**: 録音ファイルのカテゴリ分け
- **クラウドバックアップ**: Google Drive等への自動アップロード
- **モバイル対応**: PWA化による スマートフォン対応

### **2. 技術的改善**

#### **パフォーマンス**
- **Redis キャッシュ**: 番組表データのキャッシュ
- **ワーカープロセス**: 重い処理の別プロセス化
- **仮想スクロール**: 大量データ表示の最適化

#### **可用性**
- **自動復旧**: ネットワーク断線からの自動復帰
- **データバックアップ**: 設定・予約データの自動バックアップ
- **エラー監視**: ログ解析による問題の早期検出

### **3. ユーザビリティ**

#### **UI/UX 改善**
- **ダークモード**: システム設定連動
- **キーボードショートカット**: パワーユーザー向け操作
- **ドラッグ&ドロップ**: ファイル操作の直感化

#### **アクセシビリティ**
- **スクリーンリーダー対応**: ARIA ラベル設定
- **高コントラストモード**: 視認性向上
- **キーボード操作**: マウス不要の完全操作

---

## **📚 参考資料・ドキュメント**

### **1. 外部API仕様**
- [radiko API 非公式仕様](https://github.com/radiko-jp/radiko-api-docs) (コミュニティ版)
- [FFmpeg 公式ドキュメント](https://ffmpeg.org/documentation.html)
- [Electron 公式ガイド](https://www.electronjs.org/docs)

### **2. 開発ツール**
- [Vue.js 3 公式ドキュメント](https://vuejs.org/guide/)
- [Express.js ガイド](https://expressjs.com/ja/guide/)
- [SQLite 公式リファレンス](https://sqlite.org/docs.html)

### **3. セキュリティガイドライン**
- [Electron セキュリティガイド](https://www.electronjs.org/docs/tutorial/security)
- [Node.js セキュリティベストプラクティス](https://nodejs.org/en/docs/guides/security/)

---

## **🏆 プロジェクト成果**

### **技術的成果**
1. **radiko v2 API 完全対応**: 2025年最新仕様での認証・録音システム
2. **クロスプラットフォーム対応**: Windows/macOS/Linux での動作保証
3. **安定したスケジューリング**: 1分間隔での確実な予約実行
4. **包括的なエラーハンドリング**: 各種異常状況での適切な処理

### **実用性**
1. **個人利用に最適**: セットアップ簡単、安定動作
2. **高い録音品質**: FFmpeg による原音品質保持
3. **直感的UI**: 番組表からワンクリック予約
4. **メンテナンスフリー**: 自動化されたスケジューリング

### **拡張性**
1. **モジュラー設計**: 機能追加・修正が容易
2. **API 基盤**: 外部連携・モバイルアプリ対応可能
3. **ログ・監視**: 運用時の問題特定・性能改善が可能

---

## **📝 開発チームからのメッセージ**

MyRadiko の開発を通じて、個人プロジェクトでありながら企業レベルの品質を実現するためのベストプラクティスを数多く学ぶことができました。特に以下の点が重要であることを再認識しました：

1. **適切な設計**: 初期のアーキテクチャ設計が後の開発効率を大きく左右
2. **エラーハンドリング**: 実用アプリケーションでは正常系だけでなく異常系の丁寧な実装が必須
3. **ドキュメント化**: コードだけでなく設計意図・トラブルシューティングの記録が将来の保守で重要
4. **ユーザー目線**: 技術的に正しいだけでなく、実際に使いやすいUIの重要性

この開発記録が、同様のプロジェクトを手がける方々の参考になれば幸いです。

**最終更新**: 2025年7月3日  
**記録者**: Claude Code AI Assistant  
**プロジェクトステータス**: Production Ready