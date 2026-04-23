import { useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { useSettingsStore } from '../stores/settingsStore'

export function useProviders() {
  const { settings, updateSettings } = useSettingsStore()

  const testNVIDIAConnection = useMutation({
    mutationFn: async (apiKey: string) => {
      const { data } = await api.post('/providers/nvidia/test', { apiKey })
      return data
    },
  })

  return {
    currentProvider: settings.aiProvider,
    nvidiaApiKey: settings.nvidiaApiKey,
    updateSettings,
    testNVIDIAConnection,
  }
}