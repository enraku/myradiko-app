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

**方法1: 実行ファイルをビルドして使用（推奨）**
```cmd
git clone https://github.com/enraku/myradiko-app.git
cd myradiko-app
npm install
npm run electron:build:portable
MyRadiko.bat
```

**方法2: 開発モード（Node.js環境）**
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

**Windows:**
```cmd
npm run stop
```

**またはElectronアプリを直接閉じる、またはCtrl+Cで停止**

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
npm run electron:build:portable # Windows用実行ファイル作成
npm run electron:pack           # パッケージ作成
npm run electron:dist           # 配布用パッケージ作成
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

# 実行ファイルをビルド（数分かかります）
npm run electron:build:portable
```

**3. 起動**
```cmd
# バッチファイルで起動
MyRadiko.bat

# または直接実行ファイルを起動
MyRadiko.exe
```

**ビルド成果物:**
- `MyRadiko.exe` - メイン実行ファイル（約180MB）
- 各種DLLとリソースファイル
- `MyRadiko.bat` - 実行ファイル起動用スクリプト

**付属ファイル:**
- `start.bat` - 開発モード起動スクリプト（Node.js環境用）

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

---

🎧 **Happy Recording with MyRadiko!** 📻