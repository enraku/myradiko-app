@echo off
chcp 65001 > nul

REM MyRadiko インストーラービルドスクリプト

echo 🔨 MyRadiko インストーラーをビルドしています...
echo.

REM 前提条件チェック
echo 📋 前提条件をチェック中...

REM NSIS インストール確認
where makensis >nul 2>&1
if errorlevel 1 (
    echo ❌ NSIS が見つかりません
    echo.
    echo 📥 NSIS インストール手順:
    echo 1. https://nsis.sourceforge.io/Download からNSISをダウンロード
    echo 2. インストーラーを実行してインストール
    echo 3. 環境変数PATHにNSISを追加 ^(通常: C:\Program Files ^(x86^)\NSIS^)
    echo.
    pause
    exit /b 1
)

echo ✅ NSIS が見つかりました

REM 必要なNSISプラグインの存在確認
set "NSIS_PLUGINS_DIR=%PROGRAMFILES(x86)%\NSIS\Plugins\x86-unicode"
if not exist "%NSIS_PLUGINS_DIR%" (
    set "NSIS_PLUGINS_DIR=%PROGRAMFILES%\NSIS\Plugins\x86-unicode"
)

echo 📦 必要なプラグインをチェック中...

REM Internet プラグイン (inetc)
if not exist "%NSIS_PLUGINS_DIR%\inetc.dll" (
    echo ⚠️  inetc プラグインが見つかりません
    echo 自動ダウンロード機能が制限される可能性があります
)

REM nsisunz プラグイン
if not exist "%NSIS_PLUGINS_DIR%\nsisunz.dll" (
    echo ⚠️  nsisunz プラグインが見つかりません
    echo ZIP展開機能が制限される可能性があります
)

echo.
echo 🔧 インストーラーをコンパイル中...

REM インストーラーディレクトリに移動
cd /d "%~dp0installer"

REM NSIS でコンパイル
makensis MyRadiko-Installer.nsi

if errorlevel 1 (
    echo.
    echo ❌ インストーラーのビルドに失敗しました
    echo.
    echo 🔍 トラブルシューティング:
    echo 1. NSIS が正しくインストールされているか確認
    echo 2. 必要なプラグインがインストールされているか確認
    echo 3. インターネット接続を確認
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ インストーラーのビルドが完了しました！
echo.
echo 📁 作成されたファイル:
dir "MyRadiko-Setup-v*.exe" 2>nul
echo.
echo 🚀 インストーラーの配置:
if exist "MyRadiko-Setup-v1.0.0.exe" (
    move "MyRadiko-Setup-v1.0.0.exe" "..\MyRadiko-Setup-v1.0.0.exe"
    echo ✅ インストーラーをルートディレクトリに移動しました
    echo 📂 場所: %~dp0MyRadiko-Setup-v1.0.0.exe
) else (
    echo ⚠️  インストーラーファイルが見つかりません
)

echo.
echo 🎉 完了！インストーラーをテストしてください。
echo.
pause