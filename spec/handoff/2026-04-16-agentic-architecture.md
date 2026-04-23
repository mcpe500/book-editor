# Handoff: Agentic Book Editor Architecture Session

**Date:** 2026-04-16
**Session:** Planning Agentic Book Editor with Multi-Provider AI + MCP
**Status:** Architecture spec complete, ready for implementation

---

## 1. What Was Done

### 1.1 Requirements Analysis
- User requested: AI not just for chat, but "agentic" capabilities
- User requested: Multi-provider support (NVIDIA, Google Gemma, etc.)
- User requested: MCP support (Model Context Protocol)

### 1.2 Architecture Design

Created comprehensive architecture for **Agentic Book Editor**:

| Component | Decision |
|-----------|----------|
| Multi-Provider AI | NVIDIA, Gemini, OpenAI, Anthropic, Ollama |
| MCP Integration | Built-in (book-tools, web-tools) + External (stdio) |
| Agent System | 4 default templates (Research, Writing, Review, Format) |
| Tool Calling | MCP-based standardized function calls |
| Autonomy | Semi-autonomous (approval required for writes) |
| Security | API key encryption, file sandboxing, rate limiting |

### 1.3 Documentation Created
- `spec/005.agentic-architecture.md` - Complete agentic architecture spec

---

## 2. Key Decisions Made

### 2.1 Multi-Provider AI Layer

**Provider Interface:**
```typescript
interface AIProvider {
  id, name, displayName
  supportsTools, supportsVision, maxContextWindow
  chat(messages, options): Promise<ChatResponse>
  streamChat(messages, options, onChunk): Promise<void>
}
```

**Implementations:**
- `NvidiaProvider` - minimax-m2.7, limited tool support
- `GeminiProvider` - gemini-2.0-flash/pro, full tool support
- `OpenAIProvider` - gpt-4-turbo, full tool support
- `AnthropicProvider` - claude-opus-4, full tool support
- `OllamaProvider` - local models via localhost:11434

### 2.2 MCP Integration

**MCP Client:**
- Supports stdio and http transports
- Connects to external MCP servers
- Tool execution with result parsing

**Built-in MCPs:**
1. `book-tools` - getBookOutline, getChapterContent, updateChapterContent, createChapter, deleteChapter, searchBook, insertText, replaceText, getWordCount
2. `web-tools` - searchWeb, fetchUrl, extractContent

### 2.3 Agent System

**AgentConfig:**
- providerId, mcpServerIds, systemPrompt
- temperature, maxTokens
- autoApproveTools (whitelist)

**AgentRun:**
- State machine: pending → running → paused/completed/failed/stopped
- Tasks array with tool call executions
- Conversation history

**Agent Engine:**
- Main loop: get AI response → handle tool calls → wait for approval → execute
- Context building with book outline, current chapter, selected text

**Default Templates:**
1. Research Agent (Gemini) - web-tools, book-tools
2. Writing Agent (OpenAI) - book-tools
3. Review Agent (Anthropic) - book-tools
4. Format Agent (OpenAI) - book-tools

### 2.4 Approval Workflow

Tool calls require approval UNLESS in autoApproveTools whitelist:
- `web-tools.searchWeb` - auto-approved
- `book-tools.getBookOutline` - auto-approved
- `book-tools.updateChapterContent` - requires approval

---

## 3. File Structure

```
backend/src/services/
├── ai/
│   ├── providers/
│   │   ├── base.ts           # AIProvider interface
│   │   ├── nvidia.ts
│   │   ├── gemini.ts
│   │   ├── openai.ts
│   │   ├── anthropic.ts
│   │   └── ollama.ts
│   └── providerManager.ts     # Provider registry
├── mcp/
│   ├── client.ts             # MCP client
│   ├── executor.ts           # Tool execution
│   └── servers/
│       ├── book-tools.ts     # Built-in book tools
│       └── web-tools.ts      # Built-in web tools
└── agents/
    ├── agent.ts              # Types
    ├── agentEngine.ts        # Core agent logic
    └── templates.ts          # Default templates

data/
├── ai-providers.json         # Provider configs
├── mcp-servers.json          # MCP server configs
└── agents/
    └── {bookId}/
        ├── configs.json
        └── runs/
            └── {runId}.json
```

---

## 4. API Endpoints

### AI Providers
- `GET /api/ai/providers` - List providers
- `POST /api/ai/providers` - Add provider
- `PUT /api/ai/providers/:id` - Update
- `DELETE /api/ai/providers/:id` - Remove
- `POST /api/ai/providers/:id/test` - Test connection

### MCP Servers
- `GET /api/mcp/servers` - List servers
- `POST /api/mcp/servers` - Add server
- `PUT /api/mcp/servers/:id` - Update
- `DELETE /api/mcp/servers/:id` - Remove
- `GET /api/mcp/servers/:id/tools` - List tools

### Agent Configs
- `GET /api/books/:id/agents` - List for book
- `POST /api/books/:id/agents` - Create
- `PUT /api/agents/:id` - Update
- `DELETE /api/agents/:id` - Delete

### Agent Runs
- `GET /api/books/:id/agent-runs` - List
- `POST /api/books/:id/agent-runs` - Start
- `GET /api/agent-runs/:rid` - Get details
- `POST /api/agent-runs/:rid/pause` - Pause
- `POST /api/agent-runs/:rid/resume` - Resume
- `POST /api/agent-runs/:rid/stop` - Stop

### Tool Approvals
- `GET /api/agent-runs/:rid/pending-approvals` - Pending
- `POST /api/tool-calls/:tcid/approve` - Approve
- `POST /api/tool-calls/:tcid/reject` - Reject

---

## 5. Security

### API Key Encryption
```typescript
// Uses AES-256-GCM
// ENCRYPTION_KEY from environment variable
encryptApiKey(apiKey: string): string  // iv:authTag:encrypted
decryptApiKey(encrypted: string): string
```

### File Sandbox
- File tools restricted to project `./data/` directory
- Path traversal prevention

### Rate Limiting
- Per-provider limits (e.g., NVIDIA: 30/min, Gemini: 60/min)

---

## 6. Implementation Phases

| Phase | Duration | Tasks |
|-------|----------|-------|
| 1 | Day 1-3 | Multi-Provider Foundation |
| 2 | Day 4-5 | Additional Providers |
| 3 | Day 6-7 | MCP Infrastructure |
| 4 | Day 8-10 | Agent System |
| 5 | Day 11-12 | Agent UI |
| 6 | Day 13-14 | Polish & Testing |

**Total:** ~14 days

---

## 7. Dependencies

### Backend Additions
```json
{
  "dependencies": {
    "express": "^4.21.0",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "dotenv": "^16.4.0",
    "uuid": "^10.0.0"
  }
}
```

---

## 8. Frontend Changes Needed

### New Components
- `AgentPanel.tsx` - Main agent interface
- `AgentTaskView.tsx` - Task monitoring
- `ToolCallApproval.tsx` - Approval modal
- `AIProviderSettings.tsx` - Provider config
- `MCPServerSettings.tsx` - MCP config
- `AgentConfigModal.tsx` - Create/edit agent

### Store Updates
- `agentStore.ts` - Agent state management
- `aiStore.ts` - Update for multi-provider

---

## 9. Notes for Implementation

1. **Provider Selection:** User should be able to select provider per agent or per chat
2. **MCP Discovery:** External MCP servers announce tools on connect
3. **Tool Naming:** Use `serverName.toolName` format (e.g., `book-tools.getChapterContent`)
4. **Streaming:** AI responses should stream token-by-token for UX
5. **State Persistence:** Agent runs should persist to JSON for recovery

---

## 10. Deferred Items

| Item | Reason |
|------|--------|
| Vision support | Not needed for MVP |
| Image generation | Complex, defer |
| Claude integration | API changes, wait for stable |

---

## 11. Files Reference

| File | Purpose |
|------|---------|
| `spec/001.book-editor.md` | Original full spec |
| `spec/002.ai-chat-feature.md` | Basic AI chat spec |
| `spec/003.bug-analysis-and-fixes.md` | Bug analysis |
| `spec/004.architecture-planning.md` | React + Express architecture |
| `spec/005.agentic-architecture.md` | **NEW: Agentic architecture** |
| `spec/prompts/INSTRUCTIONS.md` | System instructions |
| `spec/prompts/BEHAVIOUR.md` | Behavioral guidelines |
| `spec/prompts/CAVEMAN.md` | Communication mode |
| `spec/notes/RULES_TO_FOLLOW.md` | Writing rules |

---

_Handoff Version: 1.0.0_
