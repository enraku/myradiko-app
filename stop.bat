@echo off
chcp 65001 > nul

REM MyRadiko 停止スクリプト (Windows)
REM サーバーとクライアントのプロセスを停止します

echo 🛑 MyRadiko を停止しています...
echo.

REM Node.js関連プロセスを停止
echo 📻 バックエンドサーバーを停止中...
taskkill /f /im node.exe > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.jsプロセスを停止しました
) else (
    echo ℹ️ Node.jsプロセスは稼働していませんでした
)

REM nodemonプロセスを停止
echo 🔄 nodemonプロセスを停止中...
taskkill /f /im nodemon.exe > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ nodemonプロセスを停止しました
) else (
    echo ℹ️ nodemonプロセスは稼働していませんでした
)

REM npmプロセスを停止
echo 📦 npmプロセスを停止中...
taskkill /f /im npm.cmd > nul 2>&1
taskkill /f /im npm.exe > nul 2>&1

REM ポートを使用しているプロセスを停止
echo 🔌 ポート3010を使用中のプロセスを確認中...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3010') do (
    if not "%%a"=="0" (
        echo ポート3010のプロセス %%a を停止中...
        taskkill /f /pid %%a > nul 2>&1
    )
)

echo 🔌 ポート5174を使用中のプロセスを確認中...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5174') do (
    if not "%%a"=="0" (
        echo ポート5174のプロセス %%a を停止中...
        taskkill /f /pid %%a > nul 2>&1
    )
)

REM concurrentlyプロセスを停止
echo 🔄 concurrentlyプロセスを停止中...
wmic process where "CommandLine like '%%concurrently%%'" delete > nul 2>&1

echo.
echo 🎯 MyRadiko の停止が完了しました
echo.

REM プロセス状況を確認
echo 📊 現在のNode.jsプロセス状況:
tasklist /fi "imagename eq node.exe" 2>nul | findstr node.exe
if %errorlevel% neq 0 (
    echo ✨ Node.jsプロセスは稼働していません
)

echo.
echo 📊 現在のポート使用状況:
echo ポート3010:
netstat -an | findstr :3010
if %errorlevel% neq 0 (
    echo ✅ ポート3010は使用されていません
)

echo ポート5174:
netstat -an | findstr :5174
if %errorlevel% neq 0 (
    echo ✅ ポート5174は使用されていません
)

echo.
echo 💡 手動で停止する場合は以下のコマンドを実行してください:
echo taskkill /f /im node.exe
echo taskkill /f /im nodemon.exe

pause