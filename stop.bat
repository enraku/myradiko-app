@echo off
chcp 65001 > nul

REM MyRadiko アプリケーション停止スクリプト (Windows専用)

echo 🛑 MyRadiko アプリケーションを停止しています...
echo.

REM npm run stop を実行
npm run stop

if errorlevel 1 (
    echo ⚠️ npm stopが失敗しました。手動でプロセスを終了します...
    echo.
    
    REM 手動でNode.jsプロセスを終了
    taskkill /f /im node.exe >nul 2>&1
    
    if errorlevel 1 (
        echo ❌ プロセスの終了に失敗しました
        echo 手動でタスクマネージャーからNode.jsプロセスを終了してください
    ) else (
        echo ✅ Node.jsプロセスを強制終了しました
    )
) else (
    echo ✅ MyRadiko アプリケーションを正常に停止しました
)

echo.
pause