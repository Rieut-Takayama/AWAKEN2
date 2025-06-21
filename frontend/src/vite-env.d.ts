/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_BACKEND_PORT: string
  readonly VITE_DEBUG_MODE: string
  readonly VITE_LOG_LEVEL: string
  readonly VITE_TRIAL_KEYS: string
  readonly VITE_UI_SCORE_THRESHOLD_HIGH: string
  readonly VITE_UI_SCORE_THRESHOLD_MEDIUM: string
  readonly VITE_UI_NOTIFICATION_COLOR_HIGH: string
  readonly VITE_UI_NOTIFICATION_COLOR_MEDIUM: string
  readonly VITE_UI_NOTIFICATION_COLOR_LOW: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}