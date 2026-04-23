# Handoff: Architecture Planning Session

**Date:** 2026-04-16
**Session:** Planning migration from SvelteKit to React + Vite + Express
**Status:** Architecture spec written, ready for implementation

---

## 1. What Was Done

### 1.1 Research Phase
- Read all spec files: `001.book-editor.md`, `002.ai-chat-feature.md`, `003.bug-analysis-and-fixes.md`
- Read all prompts: `INSTRUCTIONS.md`, `CAVEMAN.md`, `BEHAVIOUR.md`
- Read `notes/RULES_TO_FOLLOW.md`
- Confirmed understanding of Book Editor requirements

### 1.2 Architecture Decision

| Component | Decision | Rationale |
|-----------|----------|-----------|
| Frontend | React 19 + Vite 5 + TypeScript | User preference, modern tooling |
| Backend | Express.js + TypeScript | Mature, stable ecosystem |
| Database | JSON files (data/books/, data/versions/, data/conversations/) | User requirement: "folder main json file only" |
| File Storage | Local filesystem (uploads/) | User requirement: "filestorage juga file saja" |
| Auth | None | Single-user app, MVP scope |
| PDF Export | Deferred | Heavy dependencies (puppeteer 300MB+) |

### 1.3 Documentation Created
- `spec/004.architecture-planning.md` - Comprehensive architecture spec containing:
  - System diagram and data flow
  - Frontend tech stack and folder structure
  - Backend tech stack and folder structure
  - Data models (Book, Chapter, Version, AIConversation)
  - API endpoints design
  - AI integration details (NVIDIA API proxy, streaming)
  - Dependencies list
  - 9-phase implementation plan
  - Testing checklist

---

## 2. Key Decisions

### 2.1 Data Storage Strategy

**Books:** One JSON file per book at `data/books/{bookId}.json`
- Contains book metadata + embedded chapters array
- Atomic writes via temp file + rename

**Versions:** Separate JSON files at `data/versions/{bookId}/{versionId}.json`
- Full book snapshot serialized as JSON string

**AI Conversations:** Separate JSON files at `data/conversations/{bookId}/{chapterId}.json`
- One conversation per chapter

### 2.2 AI Streaming

Backend proxies to NVIDIA API with streaming response.
Frontend receives SSE-style chunks and renders in real-time.
Response format: 2-3 options labeled A, B, C for user selection.

### 2.3 No Auth Decision

Single-user app. No JWT, no session, no user table.
All data in shared folders (data/, uploads/).

---

## 3. File Structure

```
book-editor/
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── components/       # Layout, Editor, Preview, Outline, AI, Settings
│   │   ├── hooks/           # useBooks, useChapters, useEditor, useAI, useSettings
│   │   ├── stores/          # Zustand stores (bookStore, editorStore, settingsStore, aiStore)
│   │   ├── lib/             # api, markdown, latex, export, utils
│   │   ├── types/           # TypeScript interfaces
│   │   └── pages/           # Home, Editor, History
│   └── package.json
├── backend/                  # Express API
│   ├── src/
│   │   ├── routes/          # books, chapters, versions, assets, ai, export
│   │   ├── services/        # bookService, versionService, aiService, exportService
│   │   ├── middleware/      # errorHandler, upload
│   │   ├── types/          # TypeScript interfaces
│   │   └── utils/          # jsonFile, uuid
│   ├── data/               # JSON database
│   │   ├── books/
│   │   ├── versions/
│   │   └── conversations/
│   ├── uploads/            # Static assets
│   └── package.json
└── spec/                    # Architecture spec + existing specs
```

---

## 4. Implementation Phases

| Phase | Duration | Tasks |
|-------|----------|-------|
| 1 | Day 1 | Project scaffolding |
| 2 | Day 2-3 | Book CRUD |
| 3 | Day 3-4 | Chapter management |
| 4 | Day 5-7 | Editor + Preview |
| 5 | Day 8 | Auto-save + Version history |
| 6 | Day 9-10 | AI integration |
| 7 | Day 11 | Asset upload |
| 8 | Day 12 | Export (Markdown only) |
| 9 | Day 13-14 | Polish |

**Total Estimate:** 14 days full-time

---

## 5. Next Steps

### Immediate (Day 1)
1. Create `frontend/` with Vite + React + TypeScript
2. Create `backend/` with Express + TypeScript
3. Setup basic folder structures
4. Test connectivity between frontend and backend

### Short-term (Week 1)
1. Complete Book CRUD
2. Complete Chapter management
3. Implement three-panel layout

### Medium-term (Week 2)
1. Editor + Preview with CodeMirror
2. AI chat integration
3. Version history

---

## 6. Dependencies

### Frontend
- react 19, react-dom 19
- @codemirror/* (6 packages)
- marked 15, katex 0.16, highlight.js 11
- zustand 5, axios 1, lucide-react
- vite 5, tailwindcss 4, typescript 5

### Backend
- express 4, cors 2, multer 1
- dotenv 16, uuid 10
- TypeScript 5, nodemon, tsx

---

## 7. Notes for Implementation

1. **JSON Atomic Writes:** Always write to temp file then rename to ensure atomicity
2. **AI Streaming:** Use ReadableStream + TextDecoder for SSE-style chunks
3. **CodeMirror Setup:** Use @codemirror/lang-markdown for syntax highlighting
4. **KaTeX Integration:** Custom marked extension for $...$ and $$...$$
5. **Auto-save:** Debounce 30 seconds, clear timer on content change

---

## 8. Deferred Items

| Item | Reason | Alternative |
|------|--------|-------------|
| PDF Export | Heavy deps (puppeteer 300MB+) | Markdown export only |
| Drag-drop reorder | Complex UI | Manual reorder |
| Service worker/offline | MVP scope | Future enhancement |
| Real-time collaboration | MVP scope | Future enhancement |

---

## 9. Files Reference

| File | Purpose |
|------|---------|
| `spec/001.book-editor.md` | Original full spec (SvelteKit) |
| `spec/002.ai-chat-feature.md` | AI feature spec |
| `spec/003.bug-analysis-and-fixes.md` | Bug analysis of SvelteKit version |
| `spec/004.architecture-planning.md` | NEW: React + Vite + Express architecture |
| `spec/prompts/INSTRUCTIONS.md` | System instructions |
| `spec/prompts/BEHAVIOUR.md` | Behavioral guidelines |
| `spec/prompts/CAVEMAN.md` | Communication mode |
| `spec/notes/RULES_TO_FOLLOW.md` | Writing rules |

---

_Handoff Version: 1.0.0_
