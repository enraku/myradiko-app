@echo off
chcp 65001 > nul

REM MyRadiko デスクトップショートカット作成スクリプト

echo 🔗 MyRadiko デスクトップショートカットを作成しています...

REM 実行ファイルのパスを決定
set "TARGET_EXE="
if exist "dist-electron\MyRadiko 1.0.0.exe" (
    set "TARGET_EXE=%CD%\dist-electron\MyRadiko 1.0.0.exe"
) else if exist "MyRadiko.exe" (
    set "TARGET_EXE=%CD%\MyRadiko.exe"
) else (
    echo ❌ MyRadiko.exe が見つかりません
    echo 先にビルドを実行してください: npm run electron:build:portable
    pause
    exit /b 1
)

REM PowerShellでショートカット作成
powershell -Command ^
"$WshShell = New-Object -comObject WScript.Shell; ^
$Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\MyRadiko.lnk'); ^
$Shortcut.TargetPath = '%TARGET_EXE%'; ^
$Shortcut.WorkingDirectory = '%CD%'; ^
$Shortcut.Description = 'MyRadiko - radiko録音アプリケーション'; ^
$Shortcut.Save()"

if %ERRORLEVEL% EQU 0 (
    echo ✅ デスクトップショートカットを作成しました
    echo 📂 場所: %USERPROFILE%\Desktop\MyRadiko.lnk
) else (
    echo ❌ ショートカットの作成に失敗しました
)

echo.
pause