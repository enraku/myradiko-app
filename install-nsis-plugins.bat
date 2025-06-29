@echo off
chcp 65001 > nul

REM NSIS プラグイン自動インストールスクリプト

echo 🔌 NSIS プラグインをインストールしています...
echo.

REM NSIS インストールディレクトリ検索
set "NSIS_DIR="
if exist "%PROGRAMFILES(x86)%\NSIS" (
    set "NSIS_DIR=%PROGRAMFILES(x86)%\NSIS"
) else if exist "%PROGRAMFILES%\NSIS" (
    set "NSIS_DIR=%PROGRAMFILES%\NSIS"
) else (
    echo ❌ NSIS が見つかりません
    echo 先に NSIS をインストールしてください: https://nsis.sourceforge.io/Download
    pause
    exit /b 1
)

echo ✅ NSIS 検出: %NSIS_DIR%

set "PLUGINS_DIR=%NSIS_DIR%\Plugins\x86-unicode"
set "INCLUDE_DIR=%NSIS_DIR%\Include"

echo 📂 プラグインディレクトリ: %PLUGINS_DIR%

REM 管理者権限チェック
net session >nul 2>&1
if errorlevel 1 (
    echo ⚠️  管理者権限が必要です
    echo 右クリック → 「管理者として実行」で実行してください
    pause
    exit /b 1
)

REM 一時ディレクトリ作成
mkdir "%TEMP%\nsis-plugins" 2>nul
cd /d "%TEMP%\nsis-plugins"

echo.
echo 📥 inetc プラグインをダウンロード中...
powershell -Command "Invoke-WebRequest -Uri 'https://nsis.sourceforge.io/mediawiki/images/c/c9/Inetc.zip' -OutFile 'inetc.zip'"

if exist "inetc.zip" (
    powershell -Command "Expand-Archive -Path 'inetc.zip' -DestinationPath 'inetc' -Force"
    if exist "inetc\Plugins\x86-unicode\inetc.dll" (
        copy "inetc\Plugins\x86-unicode\inetc.dll" "%PLUGINS_DIR%\"
        echo ✅ inetc.dll をコピーしました
    )
    if exist "inetc\Docs\inetc\inetc.txt" (
        copy "inetc\Docs\inetc\inetc.txt" "%INCLUDE_DIR%\"
        echo ✅ inetc.txt をコピーしました
    )
) else (
    echo ❌ inetc プラグインのダウンロードに失敗しました
)

echo.
echo 📥 nsisunz プラグインをダウンロード中...
powershell -Command "Invoke-WebRequest -Uri 'https://nsis.sourceforge.io/mediawiki/images/5/5a/Nsisunz.zip' -OutFile 'nsisunz.zip'"

if exist "nsisunz.zip" (
    powershell -Command "Expand-Archive -Path 'nsisunz.zip' -DestinationPath 'nsisunz' -Force"
    if exist "nsisunz\Plugin\nsisunz.dll" (
        copy "nsisunz\Plugin\nsisunz.dll" "%PLUGINS_DIR%\"
        echo ✅ nsisunz.dll をコピーしました
    )
    if exist "nsisunz\nsisunz.nsh" (
        copy "nsisunz\nsisunz.nsh" "%INCLUDE_DIR%\"
        echo ✅ nsisunz.nsh をコピーしました
    )
) else (
    echo ❌ nsisunz プラグインのダウンロードに失敗しました
)

REM GetSize プラグイン（ファイルサイズ計算用）
echo.
echo 📥 GetSize プラグインをダウンロード中...
powershell -Command "Invoke-WebRequest -Uri 'https://nsis.sourceforge.io/mediawiki/images/5/5e/GetSize.zip' -OutFile 'getsize.zip'"

if exist "getsize.zip" (
    powershell -Command "Expand-Archive -Path 'getsize.zip' -DestinationPath 'getsize' -Force"
    if exist "getsize\GetSize.nsh" (
        copy "getsize\GetSize.nsh" "%INCLUDE_DIR%\"
        echo ✅ GetSize.nsh をコピーしました
    )
) else (
    echo ❌ GetSize プラグインのダウンロードに失敗しました
)

REM 一時ファイル削除
cd /d "%TEMP%"
rmdir /s /q "nsis-plugins" 2>nul

echo.
echo ✅ NSIS プラグインのインストールが完了しました！
echo.
echo 📋 インストールされたプラグイン:
if exist "%PLUGINS_DIR%\inetc.dll" echo ✅ inetc.dll - インターネットダウンロード
if exist "%PLUGINS_DIR%\nsisunz.dll" echo ✅ nsisunz.dll - ZIP ファイル展開
if exist "%INCLUDE_DIR%\GetSize.nsh" echo ✅ GetSize.nsh - ファイルサイズ計算

echo.
echo 🎉 インストーラーのビルド準備が完了しました！
echo 次に build-installer.bat を実行してください。
echo.
pause