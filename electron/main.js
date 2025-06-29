const { app, BrowserWindow, Menu, Tray, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// アプリケーションの状態
let mainWindow = null;
let tray = null;
let serverProcess = null;
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

// サーバープロセスの起動
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('Starting MyRadiko server...');
    
    // パッケージ化された環境での Node.js パス取得
    const nodeExecutable = process.execPath;
    const serverPath = path.join(__dirname, '../server/app.js');
    
    console.log('Node executable:', nodeExecutable);
    console.log('Server path:', serverPath);
    
    serverProcess = spawn(nodeExecutable, [serverPath], {
      stdio: 'pipe',
      cwd: path.join(__dirname, '..')
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`Server: ${data}`);
      if (data.toString().includes('MyRadiko Server is running')) {
        console.log('Server started successfully');
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`Server Error: ${data}`);
    });

    serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
      if (!isQuiting) {
        // サーバーが予期せず終了した場合の処理
        setTimeout(() => {
          if (!isQuiting) {
            startServer();
          }
        }, 5000);
      }
    });

    serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error);
      console.error('Error details:', error.message);
      console.error('Error code:', error.code);
      
      // ENOENT エラーの場合の詳細情報
      if (error.code === 'ENOENT') {
        console.error('Node.js executable not found. Trying alternative approach...');
        // タイムアウトで続行させる（サーバーなしでも UI だけ表示）
        setTimeout(() => resolve(), 1000);
      } else {
        reject(error);
      }
    });

    // タイムアウト処理
    setTimeout(() => {
      resolve(); // 5秒経過したら強制的に続行
    }, 5000);
  });
}

// サーバープロセスの停止
function stopServer() {
  if (serverProcess) {
    console.log('Stopping MyRadiko server...');
    
    // プロセスの終了を試行
    if (process.platform === 'win32') {
      // Windows: 強制終了
      spawn('taskkill', ['/pid', serverProcess.pid, '/f', '/t'], { stdio: 'ignore' });
    } else {
      // Unix系: SIGTERM送信
      serverProcess.kill('SIGTERM');
    }
    
    // 2秒後に強制終了
    setTimeout(() => {
      if (serverProcess && !serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
    }, 2000);
    
    serverProcess = null;
  }
}

// メインウィンドウの作成
function createWindow() {
  // ウィンドウの設定
  const windowOptions = {
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
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
    
    // 開発モードではDevToolsを開く
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // アプリケーションのロード
  const startUrl = isDev 
    ? `http://localhost:${CLIENT_PORT}` 
    : `http://localhost:${SERVER_PORT}`;
    
  mainWindow.loadURL(startUrl);

  // ウィンドウが閉じられる時の処理
  mainWindow.on('close', (event) => {
    if (!isQuiting) {
      event.preventDefault();
      mainWindow.hide();
      
      // 初回のみトレイ通知を表示
      if (tray && !mainWindow.wasHiddenBefore) {
        tray.displayBalloon({
          iconType: 'info',
          title: 'MyRadiko',
          content: 'アプリケーションはバックグラウンドで実行されています'
        });
        mainWindow.wasHiddenBefore = true;
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
    // トレイアイコンがある場合は継続実行
    if (!tray) {
      isQuiting = true;
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
  if (serverProcess && !isQuiting) {
    event.preventDefault();
    isQuiting = true;
    
    console.log('Gracefully shutting down...');
    stopServer();
    
    // サーバーが停止するまで待機
    setTimeout(() => {
      app.quit();
    }, 3000);
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