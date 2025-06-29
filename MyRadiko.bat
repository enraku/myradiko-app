@echo off
chcp 65001 > nul

REM MyRadiko デスクトップアプリ起動 (Windows専用)

echo 🖥️ MyRadiko デスクトップアプリを起動しています...
echo.

REM 実行ファイルが存在するかチェック
if not exist "MyRadiko.exe" (
    echo ❌ MyRadiko.exe が見つかりません
    echo.
    echo 📦 実行ファイルをビルドする必要があります
    echo この処理には数分かかります（初回のみ）
    echo.
    set /p choice="自動でビルドしますか？ (y/n): "
    if /i "%choice%"=="y" (
        echo.
        echo 🔨 実行ファイルをビルドしています...
        echo しばらくお待ちください...
        npm run electron:build:portable
        if errorlevel 1 (
            echo.
            echo ❌ ビルドに失敗しました
            echo 手動で以下のコマンドを実行してください:
            echo npm run electron:build:portable
            pause
            exit /b 1
        )
        echo.
        echo ✅ ビルドが完了しました！
        echo.
    ) else (
        echo.
        echo 📋 手動でビルドする場合は以下のコマンドを実行してください:
        echo npm run electron:build:portable
        echo.
        echo 💡 または開発モードで起動: start.bat
        pause
        exit /b 1
    )
)

REM MyRadiko.exe を起動
echo 🚀 MyRadiko を起動します...
start "" "MyRadiko.exe"

echo ✅ MyRadiko が起動されました
echo ウィンドウが表示されない場合は、タスクバーを確認してください