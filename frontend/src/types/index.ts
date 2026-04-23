export interface BookSettings {
  fontFamily: 'sans' | 'serif' | 'mono'
  fontSize: number
  lineHeight: number
  theme: 'light' | 'dark' | 'system'
}

export interface Chapter {
  id: string
  title: string
  order: number
  content: string
  createdAt: string
  updatedAt: string
}

export interface Book {
  id: string
  title: string
  author?: string
  description?: string
  createdAt: string
  updatedAt: string
  settings: BookSettings
  chapters: Chapter[]
}

export interface Version {
  id: string
  bookId: string
  timestamp: string
  label?: string
  snapshot: string
  wordCount: number
}

export interface AIResponseOption {
  id: string
  label: 'A' | 'B' | 'C'
  content: string
  selected: boolean
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  options?: AIResponseOption[]
  isStreaming?: boolean
}

export interface CursorRule {
  id: string
  content: string
  enabled: boolean
  createdAt: string
}

export interface AIConversation {
  id: string
  bookId: string
  chapterId: string
  messages: AIMessage[]
  cursorRules: CursorRule[]
  createdAt: string
  updatedAt: string
}

export interface UserSettings {
  defaultFontFamily: 'sans' | 'serif' | 'mono'
  defaultFontSize: number
  defaultLineHeight: number
  theme: 'light' | 'dark' | 'system'
  aiProvider: 'nvidia'
  nvidiaApiKey?: string
  autoSaveInterval: number
  mcpServers: MCPServerConfig[]
}

export interface MCPServerConfig {
  id: string
  name: string
  command: string
  args: string[]
  enabled: boolean
}

export interface BookSummary {
  id: string
  title: string
  updatedAt: string
  chapterCount: number
  wordCount: number
}

export type ProjectExportFormat = 'markdown' | 'zip' | 'docx' | 'pdf'

export interface ProjectRuleSet {
  mustFollow: string[]
  mustNotFollow: string[]
  terminology: string[]
  memoryNotes: string[]
  styleProfile: string
}

export interface ProjectNode {
  id: string
  title: string
  slug: string
  parentId: string | null
  children: string[]
  contentFile: string
  collapsed: boolean
  createdAt: string
  updatedAt: string
}

export interface ProjectManifest {
  id: string
  title: string
  slug: string
  rootNodeIds: string[]
  nodes: Record<string, ProjectNode>
  rules: ProjectRuleSet
  exportProfiles: {
    defaultDocxTemplate?: string
    defaultPdfEngine?: string
  }
  createdAt: string
  updatedAt: string
}

export interface ProjectSummary {
  id: string
  title: string
  slug: string
  nodeCount: number
  updatedAt: string
}

export interface ProjectTreeResponse {
  manifest: ProjectManifest
}

export interface ProjectNodeDocument {
  node: ProjectNode
  content: string
  ancestry: ProjectNode[]
}

export interface ReviseProjectResponse {
  content: string
  providerId: string
}
