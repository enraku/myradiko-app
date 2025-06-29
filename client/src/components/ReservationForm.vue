<template>
  <form @submit.prevent="handleSubmit" class="reservation-form">
    <!-- 基本情報 -->
    <div class="form-section">
      <h4>基本情報</h4>
      
      <div class="form-group">
        <label for="title" class="required">番組名</label>
        <input 
          id="title"
          v-model="formData.title" 
          type="text" 
          required 
          placeholder="録音する番組名を入力..."
          class="form-input"
        />
      </div>
      
      <div class="form-group">
        <label for="station" class="required">放送局</label>
        <select 
          id="station"
          v-model="formData.station_id" 
          @change="updateStationName"
          required 
          class="form-select"
        >
          <option value="">放送局を選択...</option>
          <option 
            v-for="station in stations" 
            :key="station.id" 
            :value="station.id"
          >
            {{ station.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- 録音時間 -->
    <div class="form-section">
      <h4>録音時間</h4>
      
      <div class="form-row">
        <div class="form-group">
          <label for="start-date" class="required">開始日</label>
          <input 
            id="start-date"
            v-model="startDate" 
            type="date" 
            required 
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label for="start-time" class="required">開始時刻</label>
          <input 
            id="start-time"
            v-model="startTime" 
            type="time" 
            required 
            class="form-input"
          />
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="end-date" class="required">終了日</label>
          <input 
            id="end-date"
            v-model="endDate" 
            type="date" 
            required 
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label for="end-time" class="required">終了時刻</label>
          <input 
            id="end-time"
            v-model="endTime" 
            type="time" 
            required 
            class="form-input"
          />
        </div>
      </div>
      
      <div class="duration-info">
        録音時間: {{ formatDuration() }}
      </div>
    </div>

    <!-- 繰り返し設定 -->
    <div class="form-section">
      <h4>繰り返し設定</h4>
      
      <div class="form-group">
        <label for="repeat-type">繰り返しタイプ</label>
        <select 
          id="repeat-type"
          v-model="formData.repeat_type" 
          @change="onRepeatTypeChange"
          class="form-select"
        >
          <option value="none">単発録音</option>
          <option value="daily">毎日</option>
          <option value="weekly">毎週</option>
          <option value="weekdays">平日のみ</option>
        </select>
      </div>
      
      <div v-if="formData.repeat_type === 'weekly'" class="form-group">
        <label>繰り返し曜日</label>
        <div class="weekdays-selector">
          <label 
            v-for="(day, index) in weekdays" 
            :key="index" 
            class="weekday-label"
          >
            <input 
              v-model="selectedWeekdays" 
              :value="index" 
              type="checkbox" 
              class="weekday-checkbox"
            />
            <span class="weekday-text">{{ day }}</span>
          </label>
        </div>
      </div>
      
      <div v-if="formData.repeat_type !== 'none'" class="repeat-info">
        <p class="info-text">
          <span class="info-icon">ℹ️</span>
          {{ getRepeatDescription() }}
        </p>
      </div>
    </div>

    <!-- 詳細設定 -->
    <div class="form-section">
      <h4>詳細設定</h4>
      
      <div class="form-group">
        <label class="checkbox-label">
          <input 
            v-model="formData.is_active" 
            type="checkbox" 
            class="form-checkbox"
          />
          <span class="checkbox-text">予約を有効にする</span>
        </label>
        <small class="field-help">
          無効にした予約は録音されません。後から有効化できます。
        </small>
      </div>
    </div>

    <!-- バリデーションエラー -->
    <div v-if="errors.length > 0" class="validation-errors">
      <h5>入力エラー:</h5>
      <ul>
        <li v-for="error in errors" :key="error">{{ error }}</li>
      </ul>
    </div>

    <!-- ボタン -->
    <div class="form-actions">
      <button type="button" @click="$emit('cancel')" class="btn-cancel">
        キャンセル
      </button>
      <button type="submit" :disabled="!isValid" class="btn-submit">
        {{ isEditing ? '更新' : '作成' }}
      </button>
    </div>
  </form>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'

export default {
  name: 'ReservationForm',
  props: {
    stations: {
      type: Array,
      default: () => []
    },
    initialData: {
      type: Object,
      default: null
    }
  },
  emits: ['submit', 'cancel'],
  setup(props, { emit }) {
    // フォームデータ
    const formData = ref({
      title: '',
      station_id: '',
      station_name: '',
      repeat_type: 'none',
      repeat_days: null,
      is_active: true
    })
    
    // 日時入力
    const startDate = ref('')
    const startTime = ref('')
    const endDate = ref('')
    const endTime = ref('')
    
    // 週単位繰り返し用
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    const selectedWeekdays = ref([])
    
    // バリデーション
    const errors = ref([])
    
    // 編集モードかどうか
    const isEditing = computed(() => !!props.initialData)
    
    // フォームの妥当性
    const isValid = computed(() => {
      return formData.value.title.trim() &&
             formData.value.station_id &&
             startDate.value &&
             startTime.value &&
             endDate.value &&
             endTime.value &&
             errors.value.length === 0
    })
    
    // 録音時間の計算とフォーマット
    const formatDuration = () => {
      if (!startDate.value || !startTime.value || !endDate.value || !endTime.value) {
        return '--:--'
      }
      
      const start = new Date(`${startDate.value}T${startTime.value}`)
      const end = new Date(`${endDate.value}T${endTime.value}`)
      
      if (end <= start) {
        return '終了時刻は開始時刻より後にしてください'
      }
      
      const diffMs = end - start
      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    }
    
    // 繰り返し設定の説明
    const getRepeatDescription = () => {
      switch (formData.value.repeat_type) {
        case 'daily':
          return '毎日同じ時刻に録音されます。'
        case 'weekly':
          return selectedWeekdays.value.length > 0 
            ? `選択した曜日（${selectedWeekdays.value.map(d => weekdays[d]).join('、')}）に録音されます。`
            : '曜日を選択してください。'
        case 'weekdays':
          return '月曜日から金曜日まで録音されます。'
        default:
          return ''
      }
    }
    
    // 放送局名の更新
    const updateStationName = () => {
      const station = props.stations.find(s => s.id === formData.value.station_id)
      formData.value.station_name = station ? station.name : ''
    }
    
    // 繰り返しタイプ変更時の処理
    const onRepeatTypeChange = () => {
      if (formData.value.repeat_type !== 'weekly') {
        selectedWeekdays.value = []
        formData.value.repeat_days = null
      }
    }
    
    // バリデーション
    const validate = () => {
      errors.value = []
      
      // 必須フィールド
      if (!formData.value.title.trim()) {
        errors.value.push('番組名は必須です')
      }
      
      if (!formData.value.station_id) {
        errors.value.push('放送局は必須です')
      }
      
      if (!startDate.value || !startTime.value) {
        errors.value.push('開始日時は必須です')
      }
      
      if (!endDate.value || !endTime.value) {
        errors.value.push('終了日時は必須です')
      }
      
      // 時刻の妥当性
      if (startDate.value && startTime.value && endDate.value && endTime.value) {
        const start = new Date(`${startDate.value}T${startTime.value}`)
        const end = new Date(`${endDate.value}T${endTime.value}`)
        
        if (end <= start) {
          errors.value.push('終了時刻は開始時刻より後にしてください')
        }
        
        if (start < new Date()) {
          errors.value.push('開始時刻は現在時刻より後にしてください')
        }
      }
      
      // 週単位繰り返しの場合
      if (formData.value.repeat_type === 'weekly' && selectedWeekdays.value.length === 0) {
        errors.value.push('繰り返し曜日を選択してください')
      }
    }
    
    // 日時文字列の変換
    const formatDateTime = (date, time) => {
      return `${date.replace(/-/g, '')}${time.replace(':', '')}00`
    }
    
    // フォーム送信
    const handleSubmit = () => {
      validate()
      
      if (errors.value.length > 0) {
        return
      }
      
      // 週単位繰り返しの場合は曜日配列をJSONで保存
      if (formData.value.repeat_type === 'weekly') {
        formData.value.repeat_days = JSON.stringify(selectedWeekdays.value)
      }
      
      const submissionData = {
        ...formData.value,
        start_time: formatDateTime(startDate.value, startTime.value),
        end_time: formatDateTime(endDate.value, endTime.value)
      }
      
      emit('submit', submissionData)
    }
    
    // 初期データの設定
    const initializeForm = () => {
      if (props.initialData) {
        // 編集モードの場合
        Object.assign(formData.value, props.initialData)
        
        // 日時の分割
        if (props.initialData.start_time) {
          const startStr = props.initialData.start_time
          if (startStr.length >= 12) {
            startDate.value = `${startStr.substring(0, 4)}-${startStr.substring(4, 6)}-${startStr.substring(6, 8)}`
            startTime.value = `${startStr.substring(8, 10)}:${startStr.substring(10, 12)}`
          }
        }
        
        if (props.initialData.end_time) {
          const endStr = props.initialData.end_time
          if (endStr.length >= 12) {
            endDate.value = `${endStr.substring(0, 4)}-${endStr.substring(4, 6)}-${endStr.substring(6, 8)}`
            endTime.value = `${endStr.substring(8, 10)}:${endStr.substring(10, 12)}`
          }
        }
        
        // 週単位繰り返しの曜日復元
        if (props.initialData.repeat_type === 'weekly' && props.initialData.repeat_days) {
          try {
            selectedWeekdays.value = JSON.parse(props.initialData.repeat_days)
          } catch (error) {
            selectedWeekdays.value = []
          }
        }
      } else {
        // 新規作成モードの場合、デフォルト値を設定
        const now = new Date()
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
        
        startDate.value = tomorrow.toISOString().split('T')[0]
        endDate.value = tomorrow.toISOString().split('T')[0]
        startTime.value = '10:00'
        endTime.value = '11:00'
      }
    }
    
    // 監視
    watch([startDate, startTime, endDate, endTime], validate)
    watch(() => formData.value.repeat_type, validate)
    watch(selectedWeekdays, validate, { deep: true })
    
    // 初期化
    onMounted(() => {
      initializeForm()
      validate()
    })
    
    return {
      formData,
      startDate,
      startTime,
      endDate,
      endTime,
      weekdays,
      selectedWeekdays,
      errors,
      isEditing,
      isValid,
      formatDuration,
      getRepeatDescription,
      updateStationName,
      onRepeatTypeChange,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.reservation-form {
  max-width: 600px;
}

.form-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.form-section:last-child {
  border-bottom: none;
}

.form-section h4 {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 1.1rem;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.form-group label.required::after {
  content: ' *';
  color: #dc3545;
}

.form-input, .form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.15s ease-in-out;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}

.duration-info {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9rem;
  color: #495057;
}

.weekdays-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.weekday-label {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.weekday-label:hover {
  background: #e9ecef;
}

.weekday-checkbox {
  margin-right: 0.5rem;
}

.weekday-label:has(.weekday-checkbox:checked) {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.weekday-text {
  white-space: nowrap;
}

.repeat-info {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #e7f3ff;
  border-left: 4px solid #2196f3;
  border-radius: 4px;
}

.info-text {
  margin: 0;
  color: #1565c0;
  font-size: 0.9rem;
}

.info-icon {
  margin-right: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: normal !important;
}

.form-checkbox {
  margin-right: 0.75rem;
  transform: scale(1.2);
}

.checkbox-text {
  color: #495057;
}

.field-help {
  display: block;
  margin-top: 0.25rem;
  color: #6c757d;
  font-size: 0.875rem;
}

.validation-errors {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.validation-errors h5 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
}

.validation-errors ul {
  margin: 0;
  padding-left: 1.5rem;
}

.validation-errors li {
  font-size: 0.875rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-cancel, .btn-submit {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
}

.btn-cancel:hover {
  background: #e9ecef;
}

.btn-submit {
  background: #667eea;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: #5a6fd8;
}

.btn-submit:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .weekdays-selector {
    justify-content: center;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn-cancel, .btn-submit {
    width: 100%;
  }
}
</style>