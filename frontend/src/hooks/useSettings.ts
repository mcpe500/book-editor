import { useCallback } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import type { UserSettings } from '../types'

export function useSettings() {
  const { settings, updateSettings, addMCPServer, updateMCPServer, removeMCPServer, toggleMCPServer } = useSettingsStore()

  const updateTheme = useCallback((theme: UserSettings['theme']) => {
    updateSettings({ theme })
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [updateSettings])

  return {
    settings,
    updateSettings,
    updateTheme,
    addMCPServer,
    updateMCPServer,
    removeMCPServer,
    toggleMCPServer,
  }
}