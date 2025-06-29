#!/bin/bash

# MyRadiko 再起動スクリプト
# サーバーとクライアントを停止してから再起動します

echo "🔄 MyRadiko を再起動しています..."
echo ""

# 停止スクリプトを実行
if [ -f "./stop.sh" ]; then
    echo "🛑 現在のプロセスを停止中..."
    ./stop.sh
    echo ""
    echo "⏳ 3秒待機中..."
    sleep 3
else
    echo "⚠️ stop.sh が見つかりません。手動でプロセスを停止してください。"
fi

# 起動スクリプトを実行
if [ -f "./start.sh" ]; then
    echo "🚀 アプリケーションを再起動中..."
    ./start.sh
else
    echo "⚠️ start.sh が見つかりません。npm run dev で起動してください。"
    npm run dev
fi