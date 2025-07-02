const { app, BrowserWindow, Menu, Tray, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// アプリケーションの状態
let mainWindow = null;
let tray = null;
let isQuiting = false;

// 開発モードかどうかの判定
const isDev = process.env.NODE_ENV === 'development';
const SERVER_PORT = 3010;
const CLIENT_PORT = 5174;

// シングルインスタンス化
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // 2つ目のインスタンスが起動された時、既存のウィンドウにフォーカス
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// サーバーの直接起動（メインプロセス内）
let expressServer = null;

function startServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting MyRadiko server in main process...');
    
    // 静的ファイル提供のみの軽量サーバーを作成
    const express = require('express');
    const cors = require('cors');
    
    const app = express();
    
    try {
      console.log('📦 Creating embedded Express server...');
      
      // 基本ミドルウェア
      app.use(cors());
      app.use(express.json());
      
      // 静的ファイル配信（クライアント）
      const clientDistPath = path.join(__dirname, '../client/dist');
      console.log('📁 Client dist path:', clientDistPath);
      app.use(express.static(clientDistPath));
      
      // APIモジュールをインライン実装
      const axios = require('axios');
      const xml2js = require('xml2js');
      
      // RadikoAPI基本機能を実装
      const RadikoAPI = {
        async getAllStations() {
          const url = 'https://radiko.jp/v3/station/region/full.xml';
          const response = await axios.get(url);
          const parser = new xml2js.Parser();
          const result = await parser.parseStringPromise(response.data);
          
          const stations = [];
          if (result.regions && result.regions.region) {
            for (const region of result.regions.region) {
              if (region.station) {
                for (const station of region.station) {
                  stations.push({
                    id: station.$.id,
                    name: station.name[0],
                    region: region.$.region_name,
                    logo: station.logo ? station.logo[0] : null
                  });
                }
              }
            }
          }
          return stations;
        },
        
        async getStationsByArea(areaCode = 'JP13') {
          const url = `https://radiko.jp/v3/station/list/${areaCode}.xml`;
          const response = await axios.get(url);
          const parser = new xml2js.Parser();
          const result = await parser.parseStringPromise(response.data);
          
          const stations = [];
          if (result.stations && result.stations.station) {
            for (const station of result.stations.station) {
              try {
                // XMLの構造: <id>TBS</id>、<name>TBSラジオ</name>という形式
                const logoUrl = station.logo && station.logo.length > 0 ? station.logo[0] : null;
                stations.push({
                  id: station.id ? station.id[0] : 'unknown',
                  name: station.name ? station.name[0] : 'Unknown Station',
                  ascii: station.ascii_name ? station.ascii_name[0] : '',
                  logo: logoUrl,
                  href: station.href ? station.href[0] : null,
                  areafree: station.areafree ? station.areafree[0] : '0',
                  timefree: station.timefree ? station.timefree[0] : '0'
                });
              } catch (stationError) {
                console.error('Error parsing station:', station, stationError);
              }
            }
          }
          return stations;
        },
        
        async getProgramsByDate(stationId, date) {
          const url = `https://radiko.jp/v3/program/station/date/${date}/${stationId}.xml`;
          const response = await axios.get(url);
          const parser = new xml2js.Parser();
          const result = await parser.parseStringPromise(response.data);
          
          const programs = [];
          if (result.radiko && result.radiko.stations && result.radiko.stations[0].station) {
            const station = result.radiko.stations[0].station[0];
            
            if (station.progs && station.progs[0] && station.progs[0].prog) {
              station.progs[0].prog.forEach(prog => {
                programs.push({
                  id: prog.$.id,
                  title: prog.title ? prog.title[0] : '',
                  sub_title: prog.sub_title ? prog.sub_title[0] : '',
                  desc: prog.desc ? prog.desc[0] : '',
                  info: prog.info ? prog.info[0] : '',
                  pfm: prog.pfm ? prog.pfm[0] : '',
                  url: prog.url ? prog.url[0] : '',
                  start_time: prog.$.ft,
                  end_time: prog.$.to,
                  duration: prog.$.dur,
                  station_id: stationId,
                  date: date
                });
              });
            }
          }
          return programs;
        }
      };
      
      // API エンドポイント
      app.get('/api/health', (req, res) => {
        res.json({ 
          status: 'OK', 
          message: 'MyRadiko API Server is running',
          timestamp: new Date().toISOString()
        });
      });
      
      app.get('/api/version', (req, res) => {
        const packageInfo = require('../package.json');
        res.json({ 
          version: packageInfo.version,
          name: packageInfo.name 
        });
      });
      
      // Stations API
      app.get('/api/stations', async (req, res) => {
        try {
          console.log('Fetching all stations');
          const stations = await RadikoAPI.getAllStations();
          res.json({
            success: true,
            data: stations,
            count: stations.length
          });
        } catch (error) {
          console.error('Failed to fetch stations:', error.message);
          res.status(500).json({
            success: false,
            error: 'Failed to fetch stations',
            message: error.message
          });
        }
      });
      
      app.get('/api/stations/:areaCode', async (req, res) => {
        try {
          const { areaCode } = req.params;
          console.log(`Fetching stations for area: ${areaCode}`);
          const stations = await RadikoAPI.getStationsByArea(areaCode);
          res.json({
            success: true,
            data: stations,
            count: stations.length
          });
        } catch (error) {
          console.error('Failed to fetch stations by area:', error.message);
          res.status(500).json({
            success: false,
            error: 'Failed to fetch stations by area',
            message: error.message
          });
        }
      });
      
      // Programs API
      app.get('/api/programs/:stationId/date/:date', async (req, res) => {
        try {
          const { stationId, date } = req.params;
          console.log(`Fetching programs for ${stationId} on ${date}`);
          
          const programs = await RadikoAPI.getProgramsByDate(stationId, date);
          res.json({
            success: true,
            data: programs,
            count: programs.length,
            stationId: stationId,
            date: date
          });
        } catch (error) {
          console.error('Failed to fetch programs by date:', error);
          res.status(500).json({
            success: false,
            error: 'Failed to fetch programs by date',
            message: error.message
          });
        }
      });
      
      // SPA対応 - APIルート以外を全てindex.htmlにリダイレクト
      app.get('*', (req, res) => {
        // APIリクエストでない場合のみindex.htmlを返す
        if (!req.path.startsWith('/api/')) {
          res.sendFile(path.join(clientDistPath, 'index.html'));
        } else {
          // APIパスだが見つからない場合
          res.status(404).json({
            success: false,
            error: 'API endpoint not found',
            path: req.path
          });
        }
      });
      
      // サーバー起動
      expressServer = app.listen(SERVER_PORT, () => {
        console.log(`✅ MyRadiko embedded server running on port ${SERVER_PORT}`);
        console.log(`📡 Health check: http://localhost:${SERVER_PORT}/api/health`);
        console.log(`🎵 Web app: http://localhost:${SERVER_PORT}`);
        resolve();
      });
      
      expressServer.on('error', (err) => {
        console.error('❌ Server error:', err);
        if (err.code === 'EADDRINUSE') {
          console.error(`❌ Port ${SERVER_PORT} is already in use`);
        }
        resolve(); // エラーでも続行
      });
      
    } catch (error) {
      console.error('❌ Failed to create embedded server:', {
        message: error.message,
        stack: error.stack
      });
      
      console.log('🔄 Continuing without server...');
      resolve();
    }
  });
}

// サーバーの停止
function stopServer() {
  console.log('🛑 Stopping MyRadiko embedded server...');
  isQuiting = true;
  
  if (expressServer) {
    try {
      expressServer.close(() => {
        console.log('✅ Embedded server stopped successfully');
      });
      expressServer = null;
    } catch (error) {
      console.log('⚠️ Server stop error (ignored):', error.message);
    }
  }
}

// メインウィンドウの作成
function createWindow() {
  // バージョン情報を取得
  const packageInfo = require('../package.json');
  const appTitle = `${packageInfo.productName || 'MyRadiko'} v${packageInfo.version}`;
  
  // ウィンドウの設定
  const windowOptions = {
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: appTitle,
    // icon: path.join(__dirname, 'assets/icon.png'), // アイコンを一時的に無効化
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    titleBarStyle: 'default',
    autoHideMenuBar: false
  };

  mainWindow = new BrowserWindow(windowOptions);

  // ウィンドウが準備できたら表示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // アプリケーションのロード
  let startUrl;
  if (isDev) {
    startUrl = `http://localhost:${CLIENT_PORT}`;
  } else {
    // 本番環境：常にサーバー経由でアクセス
    startUrl = `http://localhost:${SERVER_PORT}`;
  }
    
  console.log('Loading URL:', startUrl);
  
  mainWindow.loadURL(startUrl);
  
  // ロードエラーの監視
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', validatedURL);
    console.error('Error:', errorCode, errorDescription);
    
    // エラーページを表示
    const errorHtml = `
      <html>
        <head>
          <title>MyRadiko - 接続エラー</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 40px; 
              background: #f5f5f5;
              margin: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #d32f2f; }
            .error-code { background: #ffebee; padding: 10px; border-radius: 4px; }
            .retry-btn { 
              background: #1976d2; 
              color: white; 
              border: none; 
              padding: 10px 20px; 
              border-radius: 4px; 
              cursor: pointer; 
              margin-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔌 サーバー接続エラー</h1>
            <p>MyRadikoサーバーに接続できませんでした。</p>
            <div class="error-code">
              <strong>エラーコード:</strong> ${errorCode}<br>
              <strong>詳細:</strong> ${errorDescription}<br>
              <strong>URL:</strong> ${validatedURL}
            </div>
            <h3>💡 対処法</h3>
            <ul>
              <li>開発モード（start.bat）で起動してみてください</li>
              <li>ファイアウォールやセキュリティソフトをチェック</li>
              <li>ポート ${SERVER_PORT} が他のアプリケーションに使用されていないか確認</li>
            </ul>
            <button class="retry-btn" onclick="location.reload()">🔄 再読み込み</button>
          </div>
        </body>
      </html>
    `;
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
  });

  // ウィンドウが閉じられる時の処理
  mainWindow.on('close', (event) => {
    if (!isQuiting) {
      // トレイアイコンが有効な場合のみバックグラウンド実行
      if (tray) {
        event.preventDefault();
        mainWindow.hide();
        
        // 初回のみトレイ通知を表示
        if (!mainWindow.wasHiddenBefore) {
          tray.displayBalloon({
            iconType: 'info',
            title: 'MyRadiko',
            content: 'アプリケーションはバックグラウンドで実行されています'
          });
          mainWindow.wasHiddenBefore = true;
        }
      } else {
        // トレイアイコンがない場合は完全に終了
        isQuiting = true;
        app.quit();
      }
    }
  });

  // ウィンドウが閉じられた時
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 外部リンクを既定のブラウザで開く
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return mainWindow;
}

// システムトレイの作成
function createTray() {
  try {
    const trayIconPath = path.join(__dirname, 'assets/tray-icon.png');
    tray = new Tray(trayIconPath);
  } catch (error) {
    console.warn('Failed to create tray icon, skipping tray functionality:', error.message);
    return;
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'MyRadiko を開く',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) {
            mainWindow.restore();
          }
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      }
    },
    {
      label: '録音フォルダを開く',
      click: async () => {
        const recordingsPath = path.join(__dirname, '../recordings');
        shell.openPath(recordingsPath);
      }
    },
    { type: 'separator' },
    {
      label: 'バージョン情報',
      click: () => {
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'MyRadiko について',
          message: 'MyRadiko',
          detail: `バージョン: ${app.getVersion()}\nElectron: ${process.versions.electron}\nNode.js: ${process.versions.node}`,
          buttons: ['OK']
        });
      }
    },
    { type: 'separator' },
    {
      label: '終了',
      click: () => {
        isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('MyRadiko - ラジオ録音アプリ');
  tray.setContextMenu(contextMenu);

  // トレイアイコンをダブルクリック時
  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.show();
      mainWindow.focus();
    } else {
      createWindow();
    }
  });
}

// アプリケーションメニューの作成
function createMenu() {
  const template = [
    {
      label: 'ファイル',
      submenu: [
        {
          label: '録音フォルダを開く',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const recordingsPath = path.join(__dirname, '../recordings');
            shell.openPath(recordingsPath);
          }
        },
        { type: 'separator' },
        {
          label: '終了',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            isQuiting = true;
            app.quit();
          }
        }
      ]
    },
    {
      label: '表示',
      submenu: [
        { role: 'reload', label: '再読み込み' },
        { role: 'forceReload', label: '強制再読み込み' },
        { role: 'toggleDevTools', label: '開発者ツール' },
        { type: 'separator' },
        { role: 'resetZoom', label: '実際のサイズ' },
        { role: 'zoomIn', label: '拡大' },
        { role: 'zoomOut', label: '縮小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'フルスクリーン切り替え' }
      ]
    },
    {
      label: 'ウィンドウ',
      submenu: [
        { role: 'minimize', label: '最小化' },
        { role: 'close', label: '閉じる' }
      ]
    },
    {
      label: 'ヘルプ',
      submenu: [
        {
          label: 'MyRadiko について',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'MyRadiko について',
              message: 'MyRadiko',
              detail: `radiko 番組表表示と録音・録音予約アプリケーション\n\nバージョン: ${app.getVersion()}\nElectron: ${process.versions.electron}\nNode.js: ${process.versions.node}`,
              buttons: ['OK']
            });
          }
        },
        {
          label: 'GitHub リポジトリ',
          click: () => {
            shell.openExternal('https://github.com/enraku/myradiko');
          }
        }
      ]
    }
  ];

  // macOS用の調整
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about', label: 'MyRadiko について' },
        { type: 'separator' },
        { role: 'services', label: 'サービス' },
        { type: 'separator' },
        { role: 'hide', label: 'MyRadiko を隠す' },
        { role: 'hideOthers', label: '他を隠す' },
        { role: 'unhide', label: 'すべて表示' },
        { type: 'separator' },
        { role: 'quit', label: 'MyRadiko を終了' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// アプリケーションの準備ができた時
app.whenReady().then(async () => {
  console.log('MyRadiko Electron app starting...');
  
  try {
    // サーバーを起動（失敗してもアプリは続行）
    try {
      await startServer();
      console.log('MyRadiko server started successfully');
    } catch (serverError) {
      console.error('Failed to start server, but continuing with UI:', serverError);
      dialog.showMessageBox(null, {
        type: 'warning',
        title: 'サーバー起動警告',
        message: 'バックエンドサーバーの起動に失敗しました',
        detail: 'UIは表示されますが、一部機能が制限される場合があります。\n\n開発モード（start.bat）での実行を試してください。',
        buttons: ['続行', '終了']
      }).then((result) => {
        if (result.response === 1) {
          app.quit();
        }
      });
    }
    
    // ウィンドウとトレイを作成
    createWindow();
    createTray();
    createMenu();
    
    console.log('MyRadiko app UI started successfully');
  } catch (error) {
    console.error('Failed to start MyRadiko app:', error);
    dialog.showErrorBox('起動エラー', 'MyRadiko の起動に失敗しました。\n\n' + error.message);
    app.quit();
  }
});

// すべてのウィンドウが閉じられた時
app.on('window-all-closed', () => {
  // macOS以外では、ウィンドウが閉じられてもアプリは終了しない
  if (process.platform !== 'darwin') {
    // トレイアイコンがある場合は継続実行、ない場合は終了
    if (!tray) {
      isQuiting = true;
      stopServer();
      app.quit();
    }
  }
});

// アプリがアクティブになった時（macOS）
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// アプリが終了する前
app.on('before-quit', () => {
  isQuiting = true;
});

// アプリが終了する時
app.on('will-quit', (event) => {
  if (!isQuiting) {
    isQuiting = true;
    console.log('Gracefully shutting down...');
    stopServer();
  }
});

// IPC通信の設定
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-info', () => {
  return {
    name: app.getName(),
    version: app.getVersion(),
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    platform: process.platform
  };
});

// 未処理のエラーをキャッチ
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});