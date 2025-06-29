#!/bin/bash

# MyRadiko 停止スクリプト
# サーバーとクライアントのプロセスを停止します

echo "🛑 MyRadiko を停止しています..."
echo ""

# Node.js プロセスを検索して停止
SERVER_PIDS=$(ps aux | grep "node.*server/app.js" | grep -v grep | awk '{print $2}')
CLIENT_PIDS=$(ps aux | grep "node.*vite" | grep -v grep | awk '{print $2}')
NODEMON_PIDS=$(ps aux | grep "nodemon" | grep -v grep | awk '{print $2}')
NPM_PIDS=$(ps aux | grep "npm.*run.*dev\|npm.*run.*client\|npm.*run.*server" | grep -v grep | awk '{print $2}')

# サーバープロセスを停止
if [ ! -z "$SERVER_PIDS" ]; then
    echo "📻 バックエンドサーバーを停止中..."
    echo "$SERVER_PIDS" | xargs kill -TERM 2>/dev/null
    sleep 2
    # まだ残っている場合は強制終了
    echo "$SERVER_PIDS" | xargs kill -KILL 2>/dev/null
    echo "✅ バックエンドサーバーを停止しました"
else
    echo "ℹ️ バックエンドサーバーは稼働していません"
fi

# クライアントプロセスを停止
if [ ! -z "$CLIENT_PIDS" ]; then
    echo "🖥️ フロントエンドクライアントを停止中..."
    echo "$CLIENT_PIDS" | xargs kill -TERM 2>/dev/null
    sleep 2
    # まだ残っている場合は強制終了
    echo "$CLIENT_PIDS" | xargs kill -KILL 2>/dev/null
    echo "✅ フロントエンドクライアントを停止しました"
else
    echo "ℹ️ フロントエンドクライアントは稼働していません"
fi

# nodemonプロセスを停止
if [ ! -z "$NODEMON_PIDS" ]; then
    echo "🔄 nodemonプロセスを停止中..."
    echo "$NODEMON_PIDS" | xargs kill -TERM 2>/dev/null
    sleep 1
    echo "$NODEMON_PIDS" | xargs kill -KILL 2>/dev/null
    echo "✅ nodemonプロセスを停止しました"
fi

# npm runプロセスを停止
if [ ! -z "$NPM_PIDS" ]; then
    echo "📦 npmプロセスを停止中..."
    echo "$NPM_PIDS" | xargs kill -TERM 2>/dev/null
    sleep 1
    echo "$NPM_PIDS" | xargs kill -KILL 2>/dev/null
    echo "✅ npmプロセスを停止しました"
fi

# ポートを使用しているプロセスをチェック
PORT_3010=$(lsof -ti:3010 2>/dev/null)
PORT_5174=$(lsof -ti:5174 2>/dev/null)

if [ ! -z "$PORT_3010" ]; then
    echo "🔌 ポート3010を使用中のプロセスを停止中..."
    kill -TERM $PORT_3010 2>/dev/null
    sleep 1
    kill -KILL $PORT_3010 2>/dev/null
    echo "✅ ポート3010を解放しました"
fi

if [ ! -z "$PORT_5174" ]; then
    echo "🔌 ポート5174を使用中のプロセスを停止中..."
    kill -TERM $PORT_5174 2>/dev/null
    sleep 1
    kill -KILL $PORT_5174 2>/dev/null
    echo "✅ ポート5174を解放しました"
fi

echo ""
echo "🎯 MyRadiko の停止が完了しました"
echo ""

# プロセス状況を確認
REMAINING_PROCESSES=$(ps aux | grep -E "node.*server/app.js|node.*vite|nodemon" | grep -v grep)
if [ ! -z "$REMAINING_PROCESSES" ]; then
    echo "⚠️ 一部のプロセスが残っている可能性があります:"
    echo "$REMAINING_PROCESSES"
    echo ""
    echo "手動で停止する場合は以下のコマンドを実行してください:"
    echo "sudo pkill -f 'node.*server/app.js'"
    echo "sudo pkill -f 'node.*vite'"
    echo "sudo pkill -f 'nodemon'"
else
    echo "✨ すべてのプロセスが正常に停止されました"
fi