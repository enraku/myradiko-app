# Windows環境でのFFmpeg対応方法

## 🎯 推奨インストール方法

### **方法1: 自動配布（推奨）**

#### **A. Electron Builder設定**
```json
// package.json
{
  "build": {
    "win": {
      "extraResources": [
        {
          "from": "ffmpeg-win64/",
          "to": "ffmpeg/",
          "filter": ["**/*"]
        }
      ]
    }
  }
}
```

#### **B. FFmpeg同梱配布**
```
MyRadiko-Setup.exe にFFmpegを含めて配布
├── ffmpeg.exe (約60MB)
├── ffprobe.exe
└── ライセンスファイル
```

### **方法2: ユーザー手動インストール**

#### **A. 公式サイトからダウンロード**
1. https://ffmpeg.org/download.html#build-windows にアクセス
2. Windows版をダウンロード（gyan.dev推奨）
3. C:\\ffmpeg\\ に解凍
4. 環境変数PATHに C:\\ffmpeg\\bin を追加

#### **B. パッケージマネージャー使用**
```bash
# Chocolatey
choco install ffmpeg

# Scoop
scoop install ffmpeg

# Winget
winget install Gyan.FFmpeg
```

### **方法3: ポータブル配置**
```
MyRadiko/
├── MyRadiko.exe
├── ffmpeg/
│   ├── ffmpeg.exe
│   └── ffprobe.exe
└── resources/
```

## 🔧 実装での対応

### **1. 自動検出システム**
```javascript
// 複数箇所からFFmpegを検索
const searchOrder = [
  './ffmpeg/ffmpeg.exe',           // アプリ同梱
  'C:\\ffmpeg\\bin\\ffmpeg.exe',   // 標準インストール
  'ffmpeg'                         // システムPATH
];
```

### **2. インストール確認UI**
```javascript
// 初回起動時にFFmpegチェック
if (!ffmpegAvailable) {
  showFFmpegInstallDialog({
    title: 'FFmpeg必須',
    message: '録音機能にはFFmpegが必要です',
    downloadUrl: 'https://ffmpeg.org/download.html',
    installGuide: 'インストールガイドを表示'
  });
}
```

### **3. エラー処理**
```javascript
try {
  await ffmpegManager.initialize();
} catch (error) {
  if (error.message.includes('not found')) {
    // FFmpegインストールガイド表示
    showInstallationGuide();
  }
}
```

## 📦 配布パッケージ案

### **Option 1: 軽量版（推奨）**
- MyRadiko.exe のみ
- 初回起動時にFFmpegダウンロードを案内
- サイズ: 約150MB

### **Option 2: 完全版**
- MyRadiko.exe + FFmpeg同梱
- すぐに使用可能
- サイズ: 約210MB

### **Option 3: インストーラー版**
- FFmpegを自動インストール
- レジストリ登録・PATH設定
- 管理者権限必要

## 🚀 推奨実装手順

1. **FFmpegManager統合** ✅ 実装済み
2. **自動検出システム** ✅ 実装済み
3. **エラーハンドリング** ✅ 実装済み
4. **インストールガイドUI** （必要に応じて実装）
5. **配布パッケージ準備** （リリース時）

## 💡 ユーザー向けガイド

### **簡単インストール手順**
1. MyRadikoをダウンロード・インストール
2. 初回起動時にFFmpegインストール案内が表示される
3. 案内に従ってFFmpegをインストール
4. MyRadikoを再起動して完了

### **トラブルシューティング**
- FFmpegが見つからない → PATHの確認
- 権限エラー → 管理者として実行
- 録音できない → ファイアウォール設定確認