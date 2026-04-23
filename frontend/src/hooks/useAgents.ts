import { useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { useAgentStore } from '../stores/agentStore'

export function useAgents() {
  const { openPanel, closePanel, startTask, cancelTask, templates, activeTasks, isPanelOpen } = useAgentStore()

  const executeAgent = useMutation({
    mutationFn: async ({ templateId, context }: { templateId: string; context: string }) => {
      const { data } = await api.post('/agents/execute', { templateId, context })
      return data
    },
  })

  return {
    isPanelOpen,
    activeTasks,
    templates,
    openPanel,
    closePanel,
    startTask,
    cancelTask,
    executeAgent,
  }
}