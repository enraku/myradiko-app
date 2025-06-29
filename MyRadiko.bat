@echo off
chcp 65001 > nul

REM MyRadiko デスクトップアプリ起動 (Windows専用)

echo 🖥️ MyRadiko デスクトップアプリを起動しています...
echo.

REM 実行ファイルを探す
set "EXE_PATH="
echo 🔍 実行ファイルを検索中...

if exist "dist-electron\MyRadiko 1.0.0.exe" (
    set "EXE_PATH=dist-electron\MyRadiko 1.0.0.exe"
    echo ✅ 見つかりました: dist-electron\MyRadiko 1.0.0.exe
) else (
    echo ❌ dist-electron\MyRadiko 1.0.0.exe は見つかりません
)

if exist "MyRadiko.exe" (
    set "EXE_PATH=MyRadiko.exe"
    echo ✅ 見つかりました: MyRadiko.exe
) else (
    echo ❌ MyRadiko.exe は見つかりません
)

REM 実行ファイルが存在するかチェック
if "%EXE_PATH%"=="" (
    echo ❌ MyRadiko 実行ファイルが見つかりません
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
echo 実行ファイル: "%EXE_PATH%"
"%EXE_PATH%"

echo ✅ MyRadiko が起動されました
echo ウィンドウが表示されない場合は、タスクバーを確認してください