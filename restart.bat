@echo off
chcp 65001 > nul

REM MyRadiko 再起動スクリプト (Windows)
REM サーバーとクライアントを停止してから再起動します

echo 🔄 MyRadiko を再起動しています...
echo.

REM 停止スクリプトを実行
if exist "stop.bat" (
    echo 🛑 現在のプロセスを停止中...
    call stop.bat
    echo.
    echo ⏳ 3秒待機中...
    timeout /t 3 /nobreak > nul
) else (
    echo ⚠️ stop.bat が見つかりません。手動でプロセスを停止してください。
)

REM 起動スクリプトを実行
if exist "start.bat" (
    echo 🚀 アプリケーションを再起動中...
    call start.bat
) else (
    echo ⚠️ start.bat が見つかりません。npm run dev で起動してください。
    npm run dev
)