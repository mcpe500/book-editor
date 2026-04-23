import { create } from 'zustand'
import api from '../lib/api'
import type { AIConversation, AIMessage, CursorRule } from '../types'

interface AIState {
  isOpen: boolean
  isStreaming: boolean
  currentConversation: AIConversation | null
  conversations: Record<string, AIConversation>
  streamingContent: string
  abortController: AbortController | null
}

interface AIStore extends AIState {
  togglePanel: () => void
  openPanel: () => void
  closePanel: () => void
  sendMessage: (content: string) => Promise<void>
  cancelStreaming: () => void
  insertOption: (content: string) => void
  selectOption: (messageId: string, optionLabel: 'A' | 'B' | 'C') => Promise<void>
  addCursorRule: (content: string) => void
  updateCursorRule: (id: string, content: string) => void
  removeCursorRule: (id: string) => void
  toggleCursorRule: (id: string) => void
  loadConversation: (bookId: string, chapterId: string) => Promise<void>
  clearCurrentConversation: () => void
}

export const useAIStore = create<AIStore>((set, get) => ({
  isOpen: false,
  isStreaming: false,
  currentConversation: null,
  conversations: {},
  streamingContent: '',
  abortController: null,

  togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),

  openPanel: () => set({ isOpen: true }),

  closePanel: () => set({ isOpen: false }),

  sendMessage: async (content: string) => {
    const { currentConversation, abortController } = get()
    if (!currentConversation) return

    if (abortController) {
      abortController.abort()
    }

    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }

    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, userMessage],
      updatedAt: new Date().toISOString(),
    }

    set({
      isStreaming: true,
      streamingContent: '',
      currentConversation: updatedConversation,
      abortController: new AbortController(),
    })

    try {
      const controller = get().abortController
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedConversation.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          cursorRules: updatedConversation.cursorRules,
          bookId: currentConversation.bookId,
          chapterId: currentConversation.chapterId,
        }),
        signal: controller?.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'chunk') {
                fullContent += data.content
                set({ streamingContent: fullContent })
              } else if (data.type === 'done') {
                const assistantMessage: AIMessage = {
                  id: crypto.randomUUID(),
                  role: 'assistant',
                  content: data.content,
                  timestamp: new Date().toISOString(),
                  options: parseResponseOptions(data.content),
                }
                set((state) => ({
                  currentConversation: state.currentConversation
                    ? {
                        ...state.currentConversation,
                        messages: [...state.currentConversation.messages, assistantMessage],
                      }
                    : null,
                  isStreaming: false,
                  streamingContent: '',
                }))
              } else if (data.type === 'error') {
                throw new Error(data.error)
              }
            } catch (parseError) {
              // Skip malformed JSON lines
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        set({ isStreaming: false, streamingContent: '' })
      } else {
        console.error('AI chat error:', error)
        set({ isStreaming: false, streamingContent: '' })
      }
    } finally {
      set({ abortController: null })
    }
  },

  cancelStreaming: () => {
    const { abortController } = get()
    if (abortController) {
      abortController.abort()
    }
    set({ isStreaming: false, streamingContent: '', abortController: null })
  },

  insertOption: (content: string) => {
    // TODO: Insert content at cursor position in editor
    console.log('Insert option:', content)
  },

  selectOption: async (messageId: string, optionLabel: 'A' | 'B' | 'C') => {
    const { currentConversation } = get()
    if (!currentConversation) return

    set((state) => ({
      currentConversation: state.currentConversation
        ? {
            ...state.currentConversation,
            messages: state.currentConversation.messages.map((m) => {
              if (m.id !== messageId || !m.options) return m
              return {
                ...m,
                options: m.options.map((o) => ({ ...o, selected: o.label === optionLabel })),
              }
            }),
          }
        : null,
    }))

    try {
      await api.post(
        `/ai/books/${currentConversation.bookId}/conversations/${currentConversation.id}/select-option`,
        { messageId, optionLabel }
      )
    } catch (error) {
      console.error('Failed to persist option selection:', error)
    }
  },

  addCursorRule: (content: string) => {
    const { currentConversation } = get()
    if (!currentConversation) return

    const newRule: CursorRule = {
      id: crypto.randomUUID(),
      content,
      enabled: true,
      createdAt: new Date().toISOString(),
    }

    set({
      currentConversation: {
        ...currentConversation,
        cursorRules: [...currentConversation.cursorRules, newRule],
      },
    })
  },

  updateCursorRule: (id: string, content: string) => {
    set((state) => ({
      currentConversation: state.currentConversation
        ? {
            ...state.currentConversation,
            cursorRules: state.currentConversation.cursorRules.map((r) =>
              r.id === id ? { ...r, content } : r
            ),
          }
        : null,
    }))
  },

  removeCursorRule: (id: string) => {
    set((state) => ({
      currentConversation: state.currentConversation
        ? {
            ...state.currentConversation,
            cursorRules: state.currentConversation.cursorRules.filter((r) => r.id !== id),
          }
        : null,
    }))
  },

  toggleCursorRule: (id: string) => {
    set((state) => ({
      currentConversation: state.currentConversation
        ? {
            ...state.currentConversation,
            cursorRules: state.currentConversation.cursorRules.map((r) =>
              r.id === id ? { ...r, enabled: !r.enabled } : r
            ),
          }
        : null,
    }))
  },

  loadConversation: async (bookId: string, chapterId: string) => {
    try {
      const { data } = await api.get<AIConversation>(`/ai/books/${bookId}/chapters/${chapterId}/ai`)
      set({ currentConversation: data })
    } catch (error) {
      const conversation: AIConversation = {
        id: crypto.randomUUID(),
        bookId,
        chapterId,
        messages: [],
        cursorRules: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      set({ currentConversation: conversation })
    }
  },

  clearCurrentConversation: () => set({ currentConversation: null, streamingContent: '' }),
}))

function parseResponseOptions(content: string): AIMessage['options'] {
  const optionRegex = new RegExp('(?:^|\\n)([A-C])[\\.,):]\\s*(.+?)(?=(?:\\n[A-C][\\.,):])|$)', 'gi')
  const matches = [...content.matchAll(optionRegex)]
  if (matches.length === 0) return undefined

  return matches.slice(0, 3).map((match) => {
    const label = match[1]
    const optionContent = match[2]
    if (!label || !optionContent) return null
    return {
      id: crypto.randomUUID(),
      label: label.toUpperCase() as 'A' | 'B' | 'C',
      content: optionContent.trim(),
      selected: false,
    }
  }).filter(Boolean) as AIMessage['options']
}
