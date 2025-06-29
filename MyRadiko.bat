@echo off
chcp 65001 > nul

REM MyRadiko デスクトップアプリ起動 (Windows専用)

echo 🖥️ MyRadiko デスクトップアプリを起動しています...
echo.

REM 実行ファイルが存在するかチェック
if not exist "MyRadiko.exe" (
    echo ❌ MyRadiko.exe が見つかりません
    echo ビルドが完了していない可能性があります
    echo npm run electron:build:portable を実行してください
    pause
    exit /b 1
)

REM MyRadiko.exe を起動
echo 🚀 MyRadiko を起動します...
start "" "MyRadiko.exe"

echo ✅ MyRadiko が起動されました
echo ウィンドウが表示されない場合は、タスクバーを確認してください