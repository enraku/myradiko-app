<template>
  <div class="error-message" :class="type">
    <div class="error-icon">
      <span v-if="type === 'error'">⚠️</span>
      <span v-else-if="type === 'warning'">⚠️</span>
      <span v-else>ℹ️</span>
    </div>
    <div class="error-content">
      <h4 v-if="title" class="error-title">{{ title }}</h4>
      <p class="error-text">{{ message }}</p>
      <button v-if="retryable" @click="$emit('retry')" class="retry-button">
        再試行
      </button>
    </div>
    <button v-if="dismissible" @click="$emit('dismiss')" class="close-button">
      ✕
    </button>
  </div>
</template>

<script>
export default {
  name: 'ErrorMessage',
  props: {
    type: {
      type: String,
      default: 'error',
      validator: value => ['error', 'warning', 'info'].includes(value)
    },
    title: {
      type: String,
      default: ''
    },
    message: {
      type: String,
      required: true
    },
    retryable: {
      type: Boolean,
      default: false
    },
    dismissible: {
      type: Boolean,
      default: true
    }
  },
  emits: ['retry', 'dismiss']
}
</script>

<style scoped>
.error-message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid;
  margin: 16px 0;
}

.error-message.error {
  background-color: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.error-message.warning {
  background-color: #fffbeb;
  border-color: #fed7aa;
  color: #d97706;
}

.error-message.info {
  background-color: #eff6ff;
  border-color: #bfdbfe;
  color: #2563eb;
}

.error-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.error-content {
  flex: 1;
}

.error-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.error-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}

.retry-button {
  margin-top: 12px;
  padding: 8px 16px;
  background-color: currentColor;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.retry-button:hover {
  opacity: 0.8;
}

.close-button {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: currentColor;
  opacity: 0.6;
}

.close-button:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.1);
}
</style>