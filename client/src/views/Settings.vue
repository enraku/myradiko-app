<template>
  <div class="settings-container">
    <div class="settings-header">
      <h1 class="title">設定</h1>
      <div class="header-actions">
        <button @click="saveAllSettings" :disabled="loading" class="btn btn-primary">
          <i class="fas fa-save"></i>
          {{ loading ? '保存中...' : '設定を保存' }}
        </button>
        <button @click="resetToDefaults" class="btn btn-secondary">
          <i class="fas fa-undo"></i>
          初期設定に戻す
        </button>
      </div>
    </div>

    <div v-if="error" class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      {{ error }}
    </div>

    <div v-if="successMessage" class="success-message">
      <i class="fas fa-check-circle"></i>
      {{ successMessage }}
    </div>

    <div class="settings-content">
      <!-- 録音設定 -->
      <div class="settings-section">
        <h2 class="section-title">
          <i class="fas fa-microphone"></i>
          録音設定
        </h2>
        <div class="settings-grid">
          <div class="setting-item">
            <label for="recording-folder">保存フォルダ</label>
            <div class="input-group">
              <input 
                id="recording-folder"
                v-model="localSettings.recording_folder"
                type="text" 
                class="form-control"
                placeholder="/home/recordings"
              >
              <button @click="selectFolder" class="btn btn-outline">
                <i class="fas fa-folder-open"></i>
              </button>
            </div>
            <small class="help-text">録音ファイルを保存するディレクトリを指定</small>
          </div>

          <div class="setting-item">
            <label for="filename-format">ファイル名形式</label>
            <select id="filename-format" v-model="localSettings.filename_format" class="form-control">
              <option value="{date}_{time}_{station}_{title}">{date}_{time}_{station}_{title}</option>
              <option value="{station}_{date}_{time}_{title}">{station}_{date}_{time}_{title}</option>
              <option value="{title}_{station}_{date}_{time}">{title}_{station}_{date}_{time}</option>
            </select>
            <small class="help-text">
              利用可能な変数: {date}, {time}, {station}, {title}, {duration}
            </small>
          </div>

          <div class="setting-item">
            <label for="recording-margin-before">録音開始マージン（秒）</label>
            <input 
              id="recording-margin-before"
              v-model.number="localSettings.recording_margin_before"
              type="number" 
              min="0" 
              max="300"
              class="form-control"
            >
            <small class="help-text">番組開始時刻より何秒前から録音を開始するか</small>
          </div>

          <div class="setting-item">
            <label for="recording-margin-after">録音終了マージン（秒）</label>
            <input 
              id="recording-margin-after"
              v-model.number="localSettings.recording_margin_after"
              type="number" 
              min="0" 
              max="300"
              class="form-control"
            >
            <small class="help-text">番組終了時刻より何秒後まで録音を継続するか</small>
          </div>

          <div class="setting-item">
            <label for="audio-quality">音質設定</label>
            <select id="audio-quality" v-model="localSettings.audio_quality" class="form-control">
              <option value="high">高品質 (128kbps)</option>
              <option value="medium">標準 (96kbps)</option>
              <option value="low">低品質 (64kbps)</option>
            </select>
            <small class="help-text">録音する音声の品質を選択</small>
          </div>
        </div>
      </div>

      <!-- 番組表設定 -->
      <div class="settings-section">
        <h2 class="section-title">
          <i class="fas fa-tv"></i>
          番組表設定
        </h2>
        <div class="settings-grid">
          <div class="setting-item">
            <label for="default-view-mode">デフォルト表示形式</label>
            <select id="default-view-mode" v-model="localSettings.default_view_mode" class="form-control">
              <option value="timetable">タイムテーブル</option>
              <option value="list">リスト</option>
            </select>
            <small class="help-text">番組表を開いた時の表示形式</small>
          </div>

          <div class="setting-item">
            <label for="time-format">時刻表示形式</label>
            <select id="time-format" v-model="localSettings.time_format" class="form-control">
              <option value="24">24時間表示</option>
              <option value="12">12時間表示</option>
            </select>
          </div>

          <div class="setting-item">
            <label for="default-stations">表示する放送局</label>
            <div class="checkbox-group">
              <label v-for="station in availableStations" :key="station.id" class="checkbox-item">
                <input 
                  type="checkbox" 
                  :value="station.id"
                  v-model="localSettings.visible_stations"
                >
                <span>{{ station.name }}</span>
              </label>
            </div>
            <small class="help-text">番組表に表示する放送局を選択</small>
          </div>

          <div class="setting-item">
            <label for="program-cache-duration">番組データキャッシュ時間（分）</label>
            <input 
              id="program-cache-duration"
              v-model.number="localSettings.program_cache_duration"
              type="number" 
              min="1" 
              max="1440"
              class="form-control"
            >
            <small class="help-text">番組データをキャッシュする時間</small>
          </div>
        </div>
      </div>

      <!-- 通知・表示設定 -->
      <div class="settings-section">
        <h2 class="section-title">
          <i class="fas fa-bell"></i>
          通知・表示設定
        </h2>
        <div class="settings-grid">
          <div class="setting-item checkbox-setting">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="localSettings.show_recording_status"
              >
              <span class="checkmark"></span>
              録音状態を表示
            </label>
            <small class="help-text">現在の録音状況をUIに表示する</small>
          </div>

          <div class="setting-item checkbox-setting">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="localSettings.enable_notifications"
              >
              <span class="checkmark"></span>
              デスクトップ通知を有効
            </label>
            <small class="help-text">録音開始・終了時にデスクトップ通知を表示</small>
          </div>

          <div class="setting-item checkbox-setting">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="localSettings.show_upcoming_reminders"
              >
              <span class="checkmark"></span>
              予約リマインダーを表示
            </label>
            <small class="help-text">予約録音の開始前にリマインダーを表示</small>
          </div>

          <div class="setting-item">
            <label for="reminder-time">リマインダー表示時間（分前）</label>
            <input 
              id="reminder-time"
              v-model.number="localSettings.reminder_time"
              type="number" 
              min="1" 
              max="60"
              class="form-control"
              :disabled="!localSettings.show_upcoming_reminders"
            >
            <small class="help-text">録音開始何分前にリマインダーを表示するか</small>
          </div>
        </div>
      </div>

      <!-- システム設定 -->
      <div class="settings-section">
        <h2 class="section-title">
          <i class="fas fa-cog"></i>
          システム設定
        </h2>
        <div class="settings-grid">
          <div class="setting-item checkbox-setting">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="localSettings.auto_start"
              >
              <span class="checkmark"></span>
              システム起動時に自動起動
            </label>
            <small class="help-text">OS起動時にアプリケーションを自動で開始</small>
          </div>

          <div class="setting-item checkbox-setting">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="localSettings.run_in_background"
              >
              <span class="checkmark"></span>
              バックグラウンドで実行
            </label>
            <small class="help-text">ウィンドウを閉じてもバックグラウンドで動作を継続</small>
          </div>

          <div class="setting-item">
            <label for="max-concurrent-recordings">同時録音数上限</label>
            <input 
              id="max-concurrent-recordings"
              v-model.number="localSettings.max_concurrent_recordings"
              type="number" 
              min="1" 
              max="10"
              class="form-control"
            >
            <small class="help-text">同時に実行できる録音の最大数</small>
          </div>

          <div class="setting-item">
            <label for="log-level">ログレベル</label>
            <select id="log-level" v-model="localSettings.log_level" class="form-control">
              <option value="error">エラーのみ</option>
              <option value="warn">警告以上</option>
              <option value="info">情報以上</option>
              <option value="debug">デバッグ</option>
            </select>
            <small class="help-text">記録するログの詳細レベル</small>
          </div>
        </div>
      </div>

      <!-- データ設定 -->
      <div class="settings-section">
        <h2 class="section-title">
          <i class="fas fa-database"></i>
          データ設定
        </h2>
        <div class="settings-grid">
          <div class="setting-item">
            <label for="database-path">データベースパス</label>
            <div class="input-group">
              <input 
                id="database-path"
                v-model="localSettings.database_path"
                type="text" 
                class="form-control"
                readonly
              >
              <button @click="showDatabaseInfo" class="btn btn-outline">
                <i class="fas fa-info-circle"></i>
              </button>
            </div>
            <small class="help-text">データベースファイルの保存場所</small>
          </div>

          <div class="setting-item">
            <label for="data-update-interval">データ更新間隔（分）</label>
            <input 
              id="data-update-interval"
              v-model.number="localSettings.data_update_interval"
              type="number" 
              min="5" 
              max="1440"
              class="form-control"
            >
            <small class="help-text">番組表データの自動更新間隔</small>
          </div>

          <div class="setting-item">
            <label for="auto-delete-days">自動削除日数</label>
            <input 
              id="auto-delete-days"
              v-model.number="localSettings.auto_delete_days"
              type="number" 
              min="0" 
              max="365"
              class="form-control"
            >
            <small class="help-text">録音ファイルを自動削除する日数（0で無効）</small>
          </div>

          <div class="setting-item">
            <label for="backup-frequency">バックアップ頻度</label>
            <select id="backup-frequency" v-model="localSettings.backup_frequency" class="form-control">
              <option value="none">バックアップしない</option>
              <option value="daily">毎日</option>
              <option value="weekly">毎週</option>
              <option value="monthly">毎月</option>
            </select>
            <small class="help-text">設定・予約データのバックアップ頻度</small>
          </div>
        </div>
      </div>

      <!-- アクションボタン -->
      <div class="settings-section">
        <h2 class="section-title">
          <i class="fas fa-tools"></i>
          データ管理
        </h2>
        <div class="action-buttons">
          <button @click="exportSettings" class="btn btn-outline">
            <i class="fas fa-download"></i>
            設定をエクスポート
          </button>
          <button @click="importSettings" class="btn btn-outline">
            <i class="fas fa-upload"></i>
            設定をインポート
          </button>
          <button @click="clearCache" class="btn btn-outline">
            <i class="fas fa-trash"></i>
            キャッシュを削除
          </button>
          <button @click="showSystemInfo" class="btn btn-outline">
            <i class="fas fa-info"></i>
            システム情報
          </button>
        </div>
      </div>
    </div>

    <!-- ファイル選択 -->
    <input 
      ref="fileInput" 
      type="file" 
      accept=".json"
      style="display: none"
      @change="handleFileImport"
    >
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { appState, actions } from '../store/index.js'

export default {
  name: 'Settings',
  setup() {
    const loading = ref(false)
    const error = ref(null)
    const successMessage = ref(null)
    const fileInput = ref(null)
    const availableStations = ref([])

    // ローカル設定状態（編集中の値）
    const localSettings = ref({
      // 録音設定
      recording_folder: '/home/recordings',
      filename_format: '{date}_{time}_{station}_{title}',
      recording_margin_before: 30,
      recording_margin_after: 30,
      audio_quality: 'medium',
      
      // 番組表設定
      default_view_mode: 'timetable',
      time_format: '24',
      visible_stations: [],
      program_cache_duration: 60,
      
      // 通知・表示設定
      show_recording_status: true,
      enable_notifications: true,
      show_upcoming_reminders: true,
      reminder_time: 5,
      
      // システム設定
      auto_start: false,
      run_in_background: false,
      max_concurrent_recordings: 2,
      log_level: 'info',
      
      // データ設定
      database_path: './data/myradiko.db',
      data_update_interval: 60,
      auto_delete_days: 0,
      backup_frequency: 'weekly'
    })

    // 設定値の変更監視
    watch(localSettings, () => {
      clearMessages()
    }, { deep: true })

    // メッセージクリア
    const clearMessages = () => {
      error.value = null
      successMessage.value = null
    }

    // 設定読み込み
    const loadSettings = async () => {
      try {
        loading.value = true
        await actions.loadSettings()
        
        // サーバーの設定を localSettings に反映
        const serverSettings = appState.settings
        Object.keys(localSettings.value).forEach(key => {
          if (serverSettings[key] && serverSettings[key].value !== undefined) {
            localSettings.value[key] = serverSettings[key].value
          }
        })
        
        // visible_stations が文字列の場合は配列に変換
        if (typeof localSettings.value.visible_stations === 'string') {
          localSettings.value.visible_stations = localSettings.value.visible_stations.split(',').filter(Boolean)
        }
        
      } catch (err) {
        error.value = err.message || '設定の読み込みに失敗しました'
      } finally {
        loading.value = false
      }
    }

    // 放送局一覧読み込み
    const loadStations = async () => {
      try {
        await actions.loadStations()
        availableStations.value = appState.stations
        
        // デフォルトで全ての放送局を表示対象に
        if (localSettings.value.visible_stations.length === 0) {
          localSettings.value.visible_stations = appState.stations.map(s => s.id)
        }
      } catch (err) {
        console.warn('放送局の読み込みに失敗:', err.message)
      }
    }

    // 全設定保存
    const saveAllSettings = async () => {
      try {
        loading.value = true
        clearMessages()
        
        // 各設定をサーバーに送信
        const settingsToSave = { ...localSettings.value }
        
        // visible_stations を文字列に変換
        if (Array.isArray(settingsToSave.visible_stations)) {
          settingsToSave.visible_stations = settingsToSave.visible_stations.join(',')
        }
        
        // 設定を順次保存
        for (const [key, value] of Object.entries(settingsToSave)) {
          await actions.updateSetting(key, value)
        }
        
        successMessage.value = '設定を保存しました'
        
        // 3秒後にメッセージを消去
        setTimeout(() => {
          successMessage.value = null
        }, 3000)
        
      } catch (err) {
        error.value = err.message || '設定の保存に失敗しました'
      } finally {
        loading.value = false
      }
    }

    // 初期設定に戻す
    const resetToDefaults = () => {
      if (confirm('設定を初期値に戻してもよろしいですか？')) {
        localSettings.value = {
          recording_folder: '/home/recordings',
          filename_format: '{date}_{time}_{station}_{title}',
          recording_margin_before: 30,
          recording_margin_after: 30,
          audio_quality: 'medium',
          default_view_mode: 'timetable',
          time_format: '24',
          visible_stations: availableStations.value.map(s => s.id),
          program_cache_duration: 60,
          show_recording_status: true,
          enable_notifications: true,
          show_upcoming_reminders: true,
          reminder_time: 5,
          auto_start: false,
          run_in_background: false,
          max_concurrent_recordings: 2,
          log_level: 'info',
          database_path: './data/myradiko.db',
          data_update_interval: 60,
          auto_delete_days: 0,
          backup_frequency: 'weekly'
        }
        successMessage.value = '設定を初期値に戻しました'
      }
    }

    // フォルダ選択（ダミー実装）
    const selectFolder = () => {
      alert('フォルダ選択機能は今後実装予定です')
    }

    // 設定エクスポート
    const exportSettings = () => {
      try {
        const exportData = {
          settings: localSettings.value,
          exported_at: new Date().toISOString(),
          version: '1.0'
        }
        
        const dataStr = JSON.stringify(exportData, null, 2)
        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        
        const link = document.createElement('a')
        link.href = url
        link.download = `myradiko-settings-${new Date().toISOString().split('T')[0]}.json`
        link.click()
        
        URL.revokeObjectURL(url)
        successMessage.value = '設定をエクスポートしました'
      } catch (err) {
        error.value = '設定のエクスポートに失敗しました'
      }
    }

    // 設定インポート
    const importSettings = () => {
      fileInput.value.click()
    }

    // ファイルインポート処理
    const handleFileImport = (event) => {
      const file = event.target.files[0]
      if (!file) return
      
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target.result)
          if (importData.settings) {
            localSettings.value = { ...localSettings.value, ...importData.settings }
            successMessage.value = '設定をインポートしました'
          } else {
            error.value = '無効な設定ファイルです'
          }
        } catch (err) {
          error.value = '設定ファイルの読み込みに失敗しました'
        }
      }
      reader.readAsText(file)
      
      // ファイル入力をリセット
      event.target.value = ''
    }

    // キャッシュ削除
    const clearCache = () => {
      if (confirm('キャッシュを削除してもよろしいですか？')) {
        // キャッシュ削除のAPI呼び出しを実装
        successMessage.value = 'キャッシュを削除しました'
      }
    }

    // データベース情報表示
    const showDatabaseInfo = () => {
      alert(`データベースパス: ${localSettings.value.database_path}\n\nデータベース情報表示機能は今後実装予定です`)
    }

    // システム情報表示
    const showSystemInfo = () => {
      alert('システム情報表示機能は今後実装予定です')
    }

    // コンポーネント初期化
    onMounted(async () => {
      await loadStations()
      await loadSettings()
    })

    return {
      loading: computed(() => appState.loading || loading.value),
      error,
      successMessage,
      localSettings,
      availableStations,
      fileInput,
      
      saveAllSettings,
      resetToDefaults,
      selectFolder,
      exportSettings,
      importSettings,
      handleFileImport,
      clearCache,
      showDatabaseInfo,
      showSystemInfo
    }
  }
}
</script>

<style scoped>
.settings-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #eee;
}

.title {
  margin: 0;
  color: #333;
  font-size: 2em;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-primary:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.btn-outline {
  background-color: transparent;
  color: #007bff;
  border: 1px solid #007bff;
}

.btn-outline:hover {
  background-color: #007bff;
  color: white;
}

.error-message, .success-message {
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.success-message {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.settings-section {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.section-title {
  margin: 0 0 24px 0;
  color: #333;
  font-size: 1.4em;
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-item label {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.form-control {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}

.form-control:disabled {
  background-color: #f8f9fa;
  color: #6c757d;
}

.input-group {
  display: flex;
}

.input-group .form-control {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
}

.input-group .btn {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  padding: 10px 12px;
}

.help-text {
  color: #6c757d;
  font-size: 12px;
  margin-top: 4px;
}

.checkbox-setting {
  align-items: flex-start;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-weight: 600;
  margin-bottom: 4px;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 12px;
}

.action-buttons .btn {
  flex: 1;
  min-width: 200px;
  justify-content: center;
}

@media (max-width: 768px) {
  .settings-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .header-actions {
    justify-content: center;
  }

  .settings-grid {
    grid-template-columns: 1fr;
  }
  
  .action-buttons .btn {
    min-width: auto;
    flex: none;
  }
}
</style>