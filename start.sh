#!/bin/bash

# MyRadiko 起動スクリプト
# サーバーとクライアントを同時起動します

echo "🎵 MyRadiko を起動しています..."
echo ""

# Node.js がインストールされているかチェック
if ! command -v node &> /dev/null; then
    echo "❌ Node.js がインストールされていません"
    echo "Node.js をインストールしてから再実行してください"
    exit 1
fi

# npm がインストールされているかチェック
if ! command -v npm &> /dev/null; then
    echo "❌ npm がインストールされていません"
    echo "npm をインストールしてから再実行してください"
    exit 1
fi

# package.json が存在するかチェック
if [ ! -f "package.json" ]; then
    echo "❌ package.json が見つかりません"
    echo "プロジェクトのルートディレクトリで実行してください"
    exit 1
fi

# 依存関係がインストールされているかチェック
if [ ! -d "node_modules" ]; then
    echo "📦 バックエンドの依存関係をインストールしています..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 フロントエンドの依存関係をインストールしています..."
    cd client && npm install && cd ..
fi

# データベースの初期化チェック
if [ ! -f "data/myradiko.db" ]; then
    echo "🗄️ データベースを初期化しています..."
    npm run db:init
fi

# ディレクトリ作成
mkdir -p data recordings logs

echo ""
echo "🚀 サーバーとクライアントを起動します..."
echo "📻 バックエンド: http://localhost:3010"
echo "🖥️ フロントエンド: http://localhost:5174"
echo ""
echo "停止するには Ctrl+C を押してください"
echo ""

# サーバーとクライアントを同時起動
npm run dev