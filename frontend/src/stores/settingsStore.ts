import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserSettings, MCPServerConfig } from '../types'

interface SettingsState {
  settings: UserSettings
}

interface SettingsStore extends SettingsState {
  updateSettings: (settings: Partial<UserSettings>) => void
  addMCPServer: (server: Omit<MCPServerConfig, 'id'>) => void
  updateMCPServer: (id: string, server: Partial<MCPServerConfig>) => void
  removeMCPServer: (id: string) => void
  toggleMCPServer: (id: string) => void
}

const defaultSettings: UserSettings = {
  defaultFontFamily: 'sans',
  defaultFontSize: 16,
  defaultLineHeight: 1.75,
  theme: 'light',
  aiProvider: 'nvidia',
  autoSaveInterval: 30000,
  mcpServers: [],
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,

      updateSettings: (newSettings: Partial<UserSettings>) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      addMCPServer: (server: Omit<MCPServerConfig, 'id'>) =>
        set((state) => ({
          settings: {
            ...state.settings,
            mcpServers: [
              ...state.settings.mcpServers,
              { ...server, id: crypto.randomUUID() },
            ],
          },
        })),

      updateMCPServer: (id: string, server: Partial<MCPServerConfig>) =>
        set((state) => ({
          settings: {
            ...state.settings,
            mcpServers: state.settings.mcpServers.map((s) =>
              s.id === id ? { ...s, ...server } : s
            ),
          },
        })),

      removeMCPServer: (id: string) =>
        set((state) => ({
          settings: {
            ...state.settings,
            mcpServers: state.settings.mcpServers.filter((s) => s.id !== id),
          },
        })),

      toggleMCPServer: (id: string) =>
        set((state) => ({
          settings: {
            ...state.settings,
            mcpServers: state.settings.mcpServers.map((s) =>
              s.id === id ? { ...s, enabled: !s.enabled } : s
            ),
          },
        })),
    }),
    {
      name: 'book-editor-settings',
    }
  )
)