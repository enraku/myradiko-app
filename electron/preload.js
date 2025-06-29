const { contextBridge, ipcRenderer } = require('electron');

// セキュアなAPIをレンダラープロセスに公開
contextBridge.exposeInMainWorld('electronAPI', {
  // アプリ情報の取得
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // プラットフォーム情報
  platform: process.platform,
  
  // Electronで動作していることを示すフラグ
  isElectron: true,
  
  // 開発モードかどうか
  isDev: process.env.NODE_ENV === 'development'
});

// ウィンドウローダーでElectron環境を識別できるようにする
window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('electron-app');
  
  // Electronバージョン情報をHTMLに追加
  const versionInfo = document.createElement('meta');
  versionInfo.name = 'electron-version';
  versionInfo.content = process.versions.electron;
  document.head.appendChild(versionInfo);
});

console.log('MyRadiko Electron preload script loaded');