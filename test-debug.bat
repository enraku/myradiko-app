@echo off
chcp 65001 > nul

echo ========== MyRadiko Debug Test ==========
echo.

echo 現在のディレクトリ:
cd

echo.
echo 環境変数 PATH の一部:
echo %PATH%

echo.
echo Node.js バージョン:
node --version

echo.
echo npm バージョン:
npm --version

echo.
echo package.json 存在確認:
if exist "package.json" (
    echo ✅ package.json が存在します
) else (
    echo ❌ package.json が見つかりません
)

echo.
echo 利用可能な npm scripts:
npm run

echo.
echo ファイル一覧:
dir /b

echo.
pause