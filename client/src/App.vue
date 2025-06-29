<template>
  <div id="app">
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">
          📻 MyRadiko
        </h1>
        <nav class="main-nav">
          <router-link to="/" class="nav-link">
            <i class="fas fa-home"></i>
            <span>ホーム</span>
          </router-link>
          <router-link to="/program-guide" class="nav-link">
            <i class="fas fa-tv"></i>
            <span>番組表</span>
          </router-link>
          <router-link to="/recordings" class="nav-link">
            <i class="fas fa-music"></i>
            <span>録音管理</span>
          </router-link>
          <router-link to="/reservations" class="nav-link">
            <i class="fas fa-calendar-alt"></i>
            <span>予約管理</span>
          </router-link>
          <router-link to="/settings" class="nav-link">
            <i class="fas fa-cog"></i>
            <span>設定</span>
          </router-link>
          <router-link to="/logs" class="nav-link">
            <i class="fas fa-file-alt"></i>
            <span>ログ</span>
          </router-link>
        </nav>
      </div>
    </header>
    
    <main class="main-content">
      <ErrorMessage 
        v-if="error" 
        :message="error" 
        @dismiss="clearError"
        @retry="retryLastAction"
        :retryable="true"
      />
      
      <LoadingSpinner 
        v-if="loading" 
        message="読み込み中..."
      />
      
      <RecordingStatus v-if="!loading" />
      
      <router-view v-if="!loading" />
    </main>
  </div>
</template>

<script>
import { onMounted } from 'vue'
import { appState, actions } from './store/index.js'
import LoadingSpinner from './components/common/LoadingSpinner.vue'
import ErrorMessage from './components/common/ErrorMessage.vue'
import RecordingStatus from './components/RecordingStatus.vue'

export default {
  name: 'App',
  components: {
    LoadingSpinner,
    ErrorMessage,
    RecordingStatus
  },
  setup() {
    let lastAction = null
    
    const clearError = () => {
      actions.clearError()
    }
    
    const retryLastAction = async () => {
      if (lastAction) {
        try {
          await lastAction()
        } catch (error) {
          console.error('Retry failed:', error)
        }
      }
    }
    
    // アプリ初期化
    onMounted(async () => {
      // Electron環境の検出
      if (window.electronAPI) {
        console.log('Running in Electron environment')
        document.body.classList.add('electron-app')
        
        try {
          const appInfo = await window.electronAPI.getAppInfo()
          console.log('App Info:', appInfo)
        } catch (error) {
          console.error('Failed to get app info:', error)
        }
      }
      
      lastAction = async () => {
        await actions.loadSettings()
        await actions.loadStations()
      }
      
      try {
        await lastAction()
      } catch (error) {
        console.error('App initialization failed:', error)
      }
    })
    
    return {
      loading: appState.loading,
      error: appState.error,
      clearError,
      retryLastAction
    }
  }
}
</script>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f5f5;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.app-title {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
}

.main-nav {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 100px;
  justify-content: center;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}

.nav-link.router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.main-content {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  width: 100%;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .header-content {
    padding: 1rem;
    flex-direction: column;
    align-items: stretch;
  }
  
  .main-nav {
    justify-content: center;
  }
  
  .nav-link {
    flex: 1;
    text-align: center;
    min-width: 80px;
  }
  
  .nav-link span {
    font-size: 0.8rem;
  }
  
  .main-content {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .app-title {
    font-size: 1.4rem;
  }
  
  .nav-link {
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem;
  }
  
  .nav-link span {
    font-size: 0.7rem;
  }
}

/* 追加のグローバルスタイル */
.btn {
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn:active {
  transform: translateY(0);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* カードスタイル */
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

/* フォームスタイル */
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  font-family: inherit;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* アニメーション */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.pulse {
  animation: pulse 2s infinite;
}

/* ローディングスピナー */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1s linear infinite;
}

/* トースト通知スタイル */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  z-index: 1000;
  animation: slideInRight 0.3s ease-out;
}

.toast.success {
  background-color: #28a745;
}

.toast.error {
  background-color: #dc3545;
}

.toast.warning {
  background-color: #ffc107;
  color: #333;
}

.toast.info {
  background-color: #17a2b8;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* スクロールバーのスタイリング */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Electron専用スタイル */
.electron-app {
  -webkit-user-select: none;
  user-select: none;
}

.electron-app input,
.electron-app textarea,
.electron-app [contenteditable] {
  -webkit-user-select: text;
  user-select: text;
}

/* タイトルバー調整 */
.electron-app .app-header {
  -webkit-app-region: drag;
}

.electron-app .app-header .main-nav,
.electron-app .app-header button {
  -webkit-app-region: no-drag;
}
</style>