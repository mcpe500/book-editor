# Book Editor Backend - Implementation Specification

**Version:** 3.0.0
**Created:** 2026-04-16
**Phase:** Foundation (Structure Only)

---

## Overview

This document tracks the implementation status of the Book Editor Backend based on specs:
- `spec/004.architecture-planning.md` - Base architecture
- `spec/005.agentic-architecture.md` - Agentic AI + MCP extensions

## Architecture

```
backend/
├── src/
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic
│   │   ├── ai/          # AI provider abstraction
│   │   └── mcp/         # MCP client & executors
│   ├── middleware/       # Express middleware
│   ├── types/           # TypeScript interfaces
│   └── utils/           # Helper utilities
├── data/                 # JSON file storage
│   ├── books/
│   ├── versions/
│   ├── conversations/
│   ├── agents/
│   ├── ai-providers.json
│   └── mcp-servers.json
└── uploads/             # User uploaded files
```

---

## Implementation Status

### Foundation Phase (Current) ✅

- [x] Directory structure created
- [x] package.json with dependencies
- [x] tsconfig.json (ES2022, strict mode)
- [x] .env configuration
- [x] Express app setup (index.ts)
- [x] TypeScript interfaces (types/index.ts)
- [x] Utility functions (jsonFile, uuid, crypto)
- [x] Middleware (errorHandler, upload)
- [x] Route stubs (8 files with TODO comments)
- [x] Service stubs (7 files with TODO comments)
- [x] AI Provider base class and implementations
- [x] AI Provider Manager stub
- [x] MCP Client stub
- [x] MCP Executor stub
- [x] Built-in MCP servers (book-tools, web-tools)
- [x] Data config files (ai-providers.json, mcp-servers.json)
- [x] SPEC.md tracking document

---

## Phase 1: Core CRUD (Not Started)

### Book Operations
- [ ] `GET /api/books` - List all books
- [ ] `POST /api/books` - Create book
- [ ] `GET /api/books/:id` - Get book
- [ ] `PUT /api/books/:id` - Update book
- [ ] `DELETE /api/books/:id` - Delete book

### Chapter Operations
- [ ] `POST /api/books/:id/chapters` - Add chapter
- [ ] `PUT /api/books/:id/chapters/:cid` - Update chapter
- [ ] `DELETE /api/books/:id/chapters/:cid` - Delete chapter
- [ ] `PATCH /api/books/:id/chapters/reorder` - Reorder chapters

### Version Operations
- [ ] `GET /api/books/:id/versions` - List versions
- [ ] `POST /api/books/:id/versions` - Create snapshot
- [ ] `POST /api/books/:id/versions/:vid/restore` - Restore
- [ ] `DELETE /api/books/:id/versions/:vid` - Delete version

### Asset Operations
- [ ] `POST /api/books/:id/upload` - Upload file
- [ ] `DELETE /api/books/:id/assets/:filename` - Delete asset
- [ ] Static file serving for `/uploads`

### Export
- [ ] `GET /api/books/:id/export/markdown` - Export to .md

---

## Phase 2: AI Integration (Not Started)

### AI Chat
- [ ] `POST /api/ai/chat` - Streaming chat endpoint
- [ ] `GET /api/books/:id/ai-conversations` - List conversations
- [ ] `GET /api/books/:id/chapters/:cid/ai` - Get conversation

### AI Providers
- [ ] `GET /api/providers` - List providers
- [ ] `POST /api/providers` - Add provider
- [ ] `PUT /api/providers/:id` - Update provider
- [ ] `DELETE /api/providers/:id` - Delete provider
- [ ] `POST /api/providers/:id/test` - Test connection

### Provider Implementations
- [ ] NVIDIA provider (streaming)
- [ ] Gemini provider (tools support)
- [ ] OpenAI provider (tools support)
- [ ] Anthropic provider (tools support)
- [ ] Ollama provider (local)

---

## Phase 3: MCP Integration (Not Started)

### MCP Servers
- [ ] `GET /api/mcp` - List MCP servers
- [ ] `POST /api/mcp` - Add MCP server
- [ ] `GET /api/mcp/:id` - Get server
- [ ] `PUT /api/mcp/:id` - Update server
- [ ] `DELETE /api/mcp/:id` - Delete server
- [ ] `POST /api/mcp/:id/connect` - Connect
- [ ] `POST /api/mcp/:id/disconnect` - Disconnect
- [ ] `GET /api/mcp/:id/tools` - List tools

### Built-in MCP Servers
- [ ] book-tools implementation
- [ ] web-tools implementation

---

## Phase 4: Agent System (Not Started)

### Agent Operations
- [ ] `GET /api/agents` - List agents
- [ ] `POST /api/agents` - Create agent
- [ ] `GET /api/agents/:id` - Get agent
- [ ] `PUT /api/agents/:id` - Update agent
- [ ] `DELETE /api/agents/:id` - Delete agent
- [ ] `POST /api/agents/:id/run` - Start run
- [ ] `GET /api/agents/runs/:runId` - Get run status
- [ ] `POST /api/agents/runs/:runId/approve/:toolCallId` - Approve
- [ ] `POST /api/agents/runs/:runId/reject/:toolCallId` - Reject
- [ ] `POST /api/agents/runs/:runId/stop` - Stop

### Agent Engine
- [ ] Task planning
- [ ] Tool orchestration
- [ ] State management
- [ ] Approval workflow
- [ ] Default templates (research, writing, review, format)

---

## Data Models

### Book
```typescript
interface Book {
  id: string;
  title: string;
  author?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  settings: BookSettings;
  chapters: Chapter[];
}
```

### AIProviderConfig
```typescript
interface AIProviderConfig {
  id: string;
  provider: 'nvidia' | 'gemini' | 'openai' | 'anthropic' | 'ollama';
  name: string;
  apiKey?: string;
  baseUrl?: string;
  model: string;
  enabled: boolean;
}
```

### MCPServerConfig
```typescript
interface MCPServerConfig {
  id: string;
  name: string;
  transport: 'stdio' | 'http';
  command?: string;
  args?: string[];
  url?: string;
  enabled: boolean;
}
```

### AgentConfig
```typescript
interface AgentConfig {
  id: string;
  name: string;
  providerId: string;
  mcpServerIds: string[];
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  autoApproveTools: string[];
  enabled: boolean;
}
```

---

## File Structure

```
backend/
├── src/
│   ├── index.ts                     ✅ Foundation
│   ├── routes/
│   │   ├── books.ts                 ✅ Stub
│   │   ├── chapters.ts              ✅ Stub
│   │   ├── versions.ts              ✅ Stub
│   │   ├── assets.ts                ✅ Stub
│   │   ├── ai.ts                    ✅ Stub
│   │   ├── agents.ts                ✅ Stub
│   │   ├── providers.ts             ✅ Stub
│   │   └── mcp.ts                   ✅ Stub
│   ├── services/
│   │   ├── bookService.ts           ✅ Stub
│   │   ├── versionService.ts        ✅ Stub
│   │   ├── conversationService.ts   ✅ Stub
│   │   ├── aiService.ts             ✅ Stub
│   │   ├── exportService.ts         ✅ Stub
│   │   ├── fileService.ts           ✅ Stub
│   │   ├── agentService.ts          ✅ Stub
│   │   ├── ai/
│   │   │   ├── providerManager.ts   ✅ Stub
│   │   │   └── providers/
│   │   │       ├── base.ts          ✅ Base class
│   │   │       ├── nvidia.ts        ✅ Stub
│   │   │       ├── gemini.ts        ✅ Stub
│   │   │       ├── openai.ts        ✅ Stub
│   │   │       ├── anthropic.ts     ✅ Stub
│   │   │       └── ollama.ts        ✅ Stub
│   │   └── mcp/
│   │       ├── client.ts            ✅ Stub
│   │       ├── executor.ts          ✅ Stub
│   │       └── servers/
│   │           ├── book-tools.ts    ✅ Stubs
│   │           └── web-tools.ts     ✅ Stubs
│   ├── middleware/
│   │   ├── errorHandler.ts          ✅ Done
│   │   └── upload.ts                ✅ Done
│   ├── types/
│   │   └── index.ts                 ✅ All interfaces
│   └── utils/
│       ├── jsonFile.ts              ✅ Done
│       ├── uuid.ts                  ✅ Done
│       └── crypto.ts                ✅ Done
├── data/
│   ├── books/                       ✅ Empty dir
│   ├── versions/                    ✅ Empty dir
│   ├── conversations/               ✅ Empty dir
│   ├── agents/                      ✅ Empty dir
│   ├── ai-providers.json            ✅ Empty array
│   └── mcp-servers.json             ✅ Empty array
├── uploads/                         ✅ Empty dir
├── package.json                     ✅ Done
├── tsconfig.json                    ✅ Done
├── .env                             ✅ Done
└── SPEC.md                          ✅ This file
```

---

## Dependencies

### Runtime
- express: ^4.21.0
- cors: ^2.8.5
- multer: ^1.4.5-lts.1
- dotenv: ^16.4.0
- uuid: ^10.0.0

### Development
- typescript: ^5.5.0
- tsx: ^4.19.0
- nodemon: ^3.1.0
- @types/express: ^5.0.0
- @types/multer: ^1.4.12
- @types/node: ^22.0.0
- @types/cors: ^2.8.17
- @types/uuid: ^10.0.0

---

## Notes

- All TODO comments in stubs indicate functionality to be implemented in subsequent phases
- Encryption key (ENCRYPTION_KEY) must be set in production
- Default AI provider can be configured via DEFAULT_AI_PROVIDER env var
- Data storage uses JSON files for simplicity and portability
- MCP integration follows spec 2024-11-05

---

_Last Updated: 2026-04-16_