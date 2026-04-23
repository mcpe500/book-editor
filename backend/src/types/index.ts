export interface Book {
  id: string;
  title: string;
  author?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  settings: BookSettings;
  chapters: Chapter[];
}

export interface BookSettings {
  fontFamily: 'sans' | 'serif' | 'mono';
  fontSize: number;
  lineHeight: number;
  theme: 'light' | 'dark' | 'system';
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Version {
  id: string;
  bookId: string;
  timestamp: string;
  label?: string;
  snapshot: string;
  wordCount: number;
}

export interface AIMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
  options?: AIResponseOption[];
  isStreaming?: boolean;
}

export interface AIResponseOption {
  id: string;
  label: 'A' | 'B' | 'C';
  content: string;
  selected: boolean;
}

export interface CursorRule {
  id: string;
  content: string;
  enabled: boolean;
  createdAt: string;
}

export interface AIConversation {
  id: string;
  bookId: string;
  chapterId: string;
  messages: AIMessage[];
  cursorRules: CursorRule[];
  createdAt: string;
  updatedAt: string;
}

export type AIProviderType = 'nvidia' | 'gemini' | 'openai' | 'anthropic' | 'ollama';

export interface AIProviderConfig {
  id: string;
  provider: AIProviderType;
  name: string;
  apiKey?: string;
  baseUrl?: string;
  model: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MCPServerConfig {
  id: string;
  name: string;
  description?: string;
  transport: 'stdio' | 'http';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  enabled: boolean;
  createdAt: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  providerId: string;
  mcpServerIds: string[];
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  autoApproveTools: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  bookId?: string;
}

export interface AgentRun {
  id: string;
  agentConfigId: string;
  bookId: string;
  chapterId?: string;
  state: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'stopped';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  currentTask?: AgentTask;
  tasks: AgentTask[];
  conversation: Message[];
  context: {
    bookOutline?: string;
    currentChapter?: string;
    selectedText?: string;
  };
}

export interface AgentTask {
  id: string;
  type: 'thinking' | 'tool_call' | 'write' | 'edit' | 'research' | 'review';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'awaiting_approval';
  toolCalls: ToolCallExecution[];
  result?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ToolCallExecution {
  id: string;
  toolName: string;
  arguments: unknown;
  result?: unknown;
  error?: string;
  status: 'pending' | 'executing' | 'approved' | 'rejected' | 'completed' | 'failed';
  approvedBy?: string;
  approvedAt?: string;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  tools?: Tool[];
  toolChoice?: 'auto' | 'none';
}

export interface ChatResponse {
  content: string;
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'length' | 'tool_calls' | 'error';
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface AIProvider {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly supportsTools: boolean;
  readonly supportsVision: boolean;
  readonly maxContextWindow: number;
  chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>;
  streamChat(
    messages: Message[],
    options: ChatOptions,
    onChunk: (chunk: string) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ): Promise<void>;
}

export interface MCPServer {
  id: string;
  name: string;
  description?: string;
  transport: 'stdio' | 'http';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  enabled: boolean;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}