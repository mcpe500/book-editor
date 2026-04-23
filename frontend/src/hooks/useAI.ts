import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useAIStore } from '../stores/aiStore'
import type { AIConversation } from '../types'

export function useAI() {
  const queryClient = useQueryClient()
  const {
    isOpen,
    isStreaming,
    currentConversation,
    streamingContent,
    togglePanel,
    sendMessage,
    cancelStreaming,
    insertOption,
    addCursorRule,
    updateCursorRule,
    removeCursorRule,
    toggleCursorRule,
    loadConversation,
    clearCurrentConversation,
  } = useAIStore()

  const sendChatMessage = useMutation({
    mutationFn: async ({ bookId, chapterId, message }: { bookId: string; chapterId: string; message: string }) => {
      const { data } = await api.post<AIConversation>(`/books/${bookId}/chapters/${chapterId}/ai`, { message })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] })
    },
  })

  return {
    isOpen,
    isStreaming,
    currentConversation,
    streamingContent,
    togglePanel,
    sendMessage,
    cancelStreaming,
    insertOption,
    addCursorRule,
    updateCursorRule,
    removeCursorRule,
    toggleCursorRule,
    loadConversation,
    clearCurrentConversation,
    sendChatMessage,
  }
}