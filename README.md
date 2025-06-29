# MyRadiko - Radiko録音アプリケーション (Windows専用)

MyRadikoは、radikoの番組を録音・管理するためのWindows用デスクトップアプリケーションです。

## 機能一覧

### 📻 番組表
- 1週間先までの番組表表示
- タイムテーブル/リスト表示の切り替え
- 高度な検索・フィルタリング機能
- ジャンル、時間帯、番組長でのフィルタリング

### 🎵 録音機能
- 番組表からの直接予約
- 手動予約（時間指定）
- 繰り返し予約（毎日/毎週/平日のみ）
- MP3形式での自動録音

### 📅 予約管理
- 予約の一覧・編集・削除
- 予約状況のリアルタイム表示
- 直前予約のアラート機能

### 🎧 ファイル管理
- 録音済みファイルの一覧表示
- ブラウザ内での音声再生
- ファイルダウンロード
- 統計情報表示

### ⚙️ 設定システム
- 録音設定（保存フォルダ、ファイル名形式、録音マージン）
- 番組表設定（表示形式、表示局、キャッシュ時間）
- 通知・表示設定
- システム設定
- データ管理

### 📋 ログシステム
- 録音履歴・エラーログの管理
- ログレベル別フィルタリング
- 詳細情報とスタックトレース表示
- ログのエクスポート機能

## 技術構成

### フロントエンド
- **Vue.js 3** (Composition API)
- **Vite** (開発・ビルド)
- **Vue Router** (ルーティング)
- レスポンシブデザイン対応

### バックエンド
- **Node.js** + **Express**
- **SQLite** (データベース)
- **node-cron** (スケジューラー)
- radiko v3 API連携

### デスクトップアプリ
- **Electron** (Windows専用)
- システムトレイ統合
- スタンドアロン実行ファイル（約180MB）
- Node.js環境不要で動作

## 起動方法

### 前提条件
- Node.js (v16以上)
- npm または yarn

### インストールと起動

#### 🚀 クイックスタート

**方法1: インストーラーをダウンロード（最も簡単）**
1. [GitHub Releases](https://github.com/enraku/myradiko-app/releases) から最新版をダウンロード
2. お好みのインストーラーを選択：
   - `MyRadiko-Setup-vX.X.X.exe` - NSISインストーラー（推奨）
   - `MyRadiko-vX.X.X.msi` - MSIインストーラー（企業環境向け）
   - `MyRadiko-Portable-vX.X.X.exe` - ポータブル版（インストール不要）
3. ダウンロードしたファイルを実行

**方法2: ソースからビルド**
```cmd
git clone https://github.com/enraku/myradiko-app.git
cd myradiko-app
npm install
MyRadiko.bat
```
> 初回実行時に自動でビルドオプションが表示されます

**方法3: 手動ビルド**
```cmd
git clone https://github.com/enraku/myradiko-app.git
cd myradiko-app
npm install
npm run electron:build:portable
MyRadiko.bat
```

**方法4: 開発モード（Node.js環境）**
```cmd
git clone https://github.com/enraku/myradiko-app.git
cd myradiko-app
start.bat
```

> **📝 注意**: 実行ファイル（MyRadiko.exe）は容量が大きいため、GitHubには含まれていません。上記のビルドコマンドで作成してください。

#### 📋 手動起動

1. **プロジェクトクローン**
```bash
git clone https://github.com/enraku/myradiko-app.git
cd myradiko-app
```

2. **初期セットアップ**
```bash
npm run setup
```

3. **開発環境起動**
```bash
# サーバーとクライアントを同時起動
npm run dev
# または
npm run start:all
```

4. **本番環境起動**
```bash
npm run start:prod
```

#### 🔗 アクセス
- **フロントエンド**: http://localhost:5174
- **バックエンドAPI**: http://localhost:3010

#### 🛑 停止方法

**実行ファイル版（MyRadiko.exe）:**
- アプリケーションウィンドウを閉じる
- システムトレイアイコンを右クリック → 終了

**開発モード（start.bat）:**
```cmd
stop.bat
```
または
```cmd
npm run stop
```

**緊急停止:**
- コマンドプロンプトで `Ctrl+C`

#### 📝 利用可能なコマンド
```bash
# 起動関連
npm run dev          # 開発環境で起動
npm run start:all    # 開発環境で起動（devと同じ）
npm run start:prod   # 本番環境で起動

# 停止・再起動関連
npm run stop         # アプリケーション停止
npm run stop:dev     # 開発環境停止
npm run restart      # 再起動（開発環境）
npm run restart:prod # 再起動（本番環境）

# セットアップ・テスト関連
npm run setup        # 初期セットアップ
npm run test:all     # 全テスト実行
npm run db:init      # データベース初期化
npm run build        # フロントエンドビルド

# Electronデスクトップアプリ関連
npm run electron                # Electronアプリ起動
npm run electron:build:portable # ポータブル版作成
npm run electron:build:nsis     # NSISインストーラー作成
npm run electron:build:msi      # MSIインストーラー作成
npm run electron:build:all      # 全インストーラー形式作成
npm run electron:pack           # パッケージ作成
npm run electron:dist           # 配布用パッケージ作成

# 自動ビルドインストーラー関連
npm run setup:nsis              # NSIS環境セットアップ（初回のみ）
npm run build:installer         # 自動ダウンロード・ビルドインストーラー作成
```

#### 🔧 実行ファイルのビルド詳細

**1. 前提条件**
- Windows 10/11
- Node.js 16以上
- npm

**2. ビルド手順**
```cmd
# リポジトリをクローン
git clone https://github.com/enraku/myradiko-app.git
cd myradiko-app

# 依存関係をインストール
npm install

# フロントエンド依存関係もインストール
cd client
npm install
cd ..

# ビルドオプション（お好みに応じて選択）
npm run electron:build:portable    # ポータブル版（exe）
npm run electron:build:nsis        # NSISインストーラー（exe）
npm run electron:build:msi         # MSIインストーラー
npm run electron:build:all         # 全形式（推奨）
```

**3. インストーラー形式の選択**
- **ポータブル版** - 単体実行ファイル、インストール不要
- **NSISインストーラー** - 標準的なWindows .exeインストーラー
- **MSIインストーラー** - 企業環境向け .msiパッケージ

**4. 起動方法**

**ポータブル版の場合:**
```cmd
# バッチファイルで起動
MyRadiko.bat

# または直接実行ファイルを起動
"dist-electron\MyRadiko 1.0.0.exe"
```

**インストーラー版の場合:**
- NSISインストーラー実行 → デスクトップ・スタートメニューから起動
- MSIインストーラー実行 → デスクトップ・スタートメニューから起動

**ビルド成果物:**
- `dist-electron/MyRadiko Setup 1.0.0.exe` - NSISインストーラー
- `dist-electron/MyRadiko 1.0.0.msi` - MSIインストーラー  
- `dist-electron/MyRadiko 1.0.0.exe` - ポータブル実行ファイル
- `MyRadiko.bat` - ポータブル版起動用スクリプト

**付属ファイル:**
- `start.bat` - 開発モード起動スクリプト（Node.js環境用）
- `stop.bat` - 開発モード停止スクリプト

> **💡 ヒント**: 初回ビルドには時間がかかりますが、2回目以降は高速になります。

## 使用方法

### 1. 初期設定
1. ブラウザでアプリケーションにアクセス
2. 「設定」タブで録音設定を確認・調整
3. 録音保存フォルダを適切に設定

### 2. 番組予約
1. 「番組表」タブで目的の番組を探す
2. 検索・フィルター機能を活用
3. 番組の「録音予約」ボタンをクリック
4. 予約内容を確認して登録

### 3. 予約管理
1. 「予約管理」タブで全予約を確認
2. 予約の編集・削除が可能
3. 繰り返し予約の設定

### 4. 録音確認
1. 「録音管理」タブで録音済みファイルを確認
2. ブラウザで直接再生
3. ファイルのダウンロードも可能

### 5. ログ確認
1. 「ログ」タブで録音履歴・エラーを確認
2. 問題発生時のトラブルシューティングに活用

## 設定ファイル

### データベース
- **場所**: `./data/myradiko.db`
- **バックアップ**: 設定で自動バックアップを有効化可能

### 録音ファイル
- **デフォルト保存先**: `./recordings/`
- **ファイル名形式**: `{date}_{time}_{station}_{title}.mp3`
- **形式**: MP3（品質設定可能）

## トラブルシューティング

### よくある問題

1. **録音が開始されない**
   - スケジューラーが稼働中か確認
   - 予約時刻が正しく設定されているか確認
   - ログでエラーメッセージを確認

2. **番組表が表示されない**
   - インターネット接続を確認
   - radiko APIの状況を確認
   - ブラウザのコンソールでエラーを確認

3. **ファイルが保存されない**
   - 録音フォルダの権限を確認
   - ディスク容量を確認
   - 設定の保存パスを確認

### ログの確認
- アプリ内の「ログ」タブでエラー詳細を確認
- レベル別（情報/警告/エラー）でフィルタリング可能

## ライセンス

個人使用目的のみ。radikoの利用規約に従ってご使用ください。

## 注意事項

- 本アプリケーションはradiko公式アプリではありません
- 録音した音声の著作権は各放送局に帰属します
- 個人的な利用の範囲でご使用ください
- radiko Premiumの地域外視聴には対応していません

## 開発者向け

### プロジェクト構造
```
myradiko-app/
├── server/               # バックエンド
│   ├── models/          # データベースモデル
│   ├── routes/          # APIルート
│   ├── services/        # ビジネスロジック
│   └── controllers/     # コントローラー
├── client/              # フロントエンド
│   ├── src/
│   │   ├── views/       # ページコンポーネント
│   │   ├── components/  # 再利用可能コンポーネント
│   │   ├── store/       # 状態管理
│   │   └── utils/       # ユーティリティ
│   └── public/
└── data/                # データベースファイル
```

### 主要な技術選択理由
- **Vue.js 3**: モダンなリアクティブUI構築
- **SQLite**: 軽量で設定不要なデータベース
- **Express**: シンプルで高速なAPIサーバー
- **node-cron**: 確実なスケジューリング機能

## サポート

問題が発生した場合は、以下を確認してください：
1. アプリ内のログシステム
2. ブラウザの開発者コンソール
3. サーバーのコンソール出力

## 🚀 自動ダウンロード・ビルドインストーラー

**特徴:**
- Node.js、Git を自動インストール
- ソースコードを自動ダウンロード
- 依存関係を自動インストール
- アプリケーションを自動ビルド
- アンインストーラー付き

**前提条件:**
- Windows 10/11 (64bit)
- NSIS (Nullsoft Scriptable Install System)

**ビルド手順:**
```cmd
# 1. NSIS環境セットアップ（初回のみ）
npm run setup:nsis

# 2. インストーラーをビルド
npm run build:installer
```

**作成されるファイル:**
- `MyRadiko-Setup-v1.0.0.exe` - 自動ビルドインストーラー

**インストーラーの機能:**
- ✅ Node.js LTS 自動インストール
- ✅ Git for Windows 自動インストール  
- ✅ ソースコード自動ダウンロード
- ✅ 依存関係自動インストール
- ✅ アプリケーション自動ビルド
- ✅ デスクトップ・スタートメニューショートカット作成
- ✅ Windows プログラムと機能に登録
- ✅ 完全アンインストーラー付き
- ✅ ユーザーデータ保持オプション

---

🎧 **Happy Recording with MyRadiko!** 📻