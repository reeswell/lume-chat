import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, watch } from 'vue'

type ThemeMode = 'dark' | 'light'

function applyDocumentTheme(mode: ThemeMode): void {
  document.documentElement.dataset.theme = mode
  document.documentElement.style.colorScheme = mode
}

export const useThemeStore = defineStore('theme', () => {
  const mode = useLocalStorage<ThemeMode>('chat-theme', 'dark')
  const isDark = computed(() => mode.value === 'dark')
  const label = computed(() => (isDark.value ? '深色模式' : '浅色模式'))
  const nextLabel = computed(() => (isDark.value ? '切换浅色' : '切换深色'))

  watch(mode, applyDocumentTheme, { immediate: true })

  function setMode(nextMode: ThemeMode): void {
    mode.value = nextMode
  }

  function toggle(): void {
    mode.value = isDark.value ? 'light' : 'dark'
  }

  function init(): void {
    applyDocumentTheme(mode.value)
  }

  return { mode, isDark, label, nextLabel, setMode, toggle, init }
})
