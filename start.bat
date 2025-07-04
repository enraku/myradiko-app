@echo off
chcp 65001 > nul

REM MyRadiko Electron アプリ起動スクリプト (Windows専用)

echo 🖥️ MyRadiko Electron アプリを起動しています...
echo.

REM Node.js がインストールされているかチェック
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js がインストールされていません
    echo Node.js をインストールしてから再実行してください
    pause
    exit /b 1
)

REM npm がインストールされているかチェック
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm がインストールされていません
    echo npm をインストールしてから再実行してください
    pause
    exit /b 1
)

REM package.json が存在するかチェック
if not exist "package.json" (
    echo ❌ package.json が見つかりません
    echo プロジェクトのルートディレクトリで実行してください
    pause
    exit /b 1
)

REM 依存関係がインストールされているかチェック
if not exist "node_modules" (
    echo 📦 依存関係をインストールしています...
    npm install
)

if not exist "client\node_modules" (
    echo 📦 フロントエンドの依存関係をインストールしています...
    cd client
    npm install
    cd ..
)

REM フロントエンドをビルド
echo 🔨 フロントエンドをビルドしています...
npm run build

REM データベースの初期化チェック
if not exist "data\myradiko.db" (
    echo 🗄️ データベースを初期化しています...
    echo 実行中: npm run db:init
    npm run db:init
    if errorlevel 1 (
        echo ❌ データベース初期化に失敗しました
        echo 手動で以下のコマンドを実行してください:
        echo npm run db:init
        pause
    ) else (
        echo ✅ データベース初期化完了
    )
)

REM ディレクトリ作成
if not exist "data" mkdir data
if not exist "recordings" mkdir recordings
if not exist "logs" mkdir logs

echo.
echo 🚀 MyRadiko Electron アプリを起動します...
echo 📻 デスクトップアプリケーションとして動作します
echo.
echo 💡 ヒント: Ctrl+C で終了できます
echo.

REM Electronアプリを起動
npm run electron

if errorlevel 1 (
    echo.
    echo ❌ Electronアプリの起動に失敗しました
    echo.
    echo 📋 トラブルシューティング:
    echo 1. Windows Defender やアンチウイルスソフトが Node.js をブロックしていないか確認
    echo 2. 管理者権限で実行してみる
    echo 3. 実行ファイル版を試す: MyRadiko.bat
    echo.
)

pause