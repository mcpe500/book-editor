import { create } from 'zustand'

interface AgentTask {
  id: string
  title: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  result?: string
  error?: string
}

interface AgentState {
  isPanelOpen: boolean
  activeTasks: AgentTask[]
  templates: AgentTemplate[]
}

interface AgentTemplate {
  id: string
  name: string
  description: string
  systemPrompt: string
}

interface AgentStore extends AgentState {
  openPanel: () => void
  closePanel: () => void
  startTask: (templateId: string, context: string) => Promise<void>
  cancelTask: (taskId: string) => void
}

export const useAgentStore = create<AgentStore>((set) => ({
  isPanelOpen: false,
  activeTasks: [],
  templates: [
    {
      id: 'grammar',
      name: 'Grammar Check',
      description: 'Check and fix grammar errors',
      systemPrompt: 'You are a grammar checking assistant...',
    },
    {
      id: 'outline',
      name: 'Generate Outline',
      description: 'Generate chapter outline',
      systemPrompt: 'You are an outline generation assistant...',
    },
    {
      id: 'summarize',
      name: 'Summarize',
      description: 'Summarize content',
      systemPrompt: 'You are a summarization assistant...',
    },
  ],

  openPanel: () => set({ isPanelOpen: true }),
  closePanel: () => set({ isPanelOpen: false }),

  startTask: async (templateId: string, _context: string) => {
    const task: AgentTask = {
      id: crypto.randomUUID(),
      title: `Task ${templateId}`,
      status: 'running',
      progress: 0,
    }
    set((state) => ({ activeTasks: [...state.activeTasks, task] }))
  },

  cancelTask: (taskId: string) => {
    set((state) => ({
      activeTasks: state.activeTasks.filter((t) => t.id !== taskId),
    }))
  },
}))