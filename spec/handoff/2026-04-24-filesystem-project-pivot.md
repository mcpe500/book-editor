# Handoff: Filesystem Project Pivot

**Date:** 2026-04-24  
**Scope:** Replace legacy book/chapter workflow with manifest-driven modular project workflow

## What Changed

### Backend

- Added [backend/src/types/project.ts](/D:/Ivan/TA/document5/book-editor/backend/src/types/project.ts)
- Added [backend/src/services/projectService.ts](/D:/Ivan/TA/document5/book-editor/backend/src/services/projectService.ts)
- Added [backend/src/routes/projects.ts](/D:/Ivan/TA/document5/book-editor/backend/src/routes/projects.ts)
- Registered `/api/projects` in [backend/src/index.ts](/D:/Ivan/TA/document5/book-editor/backend/src/index.ts)

Implemented:

- manifest-first project storage under `backend/data/projects`
- node create/read/update/delete
- node move/reorder
- project rule persistence
- merged markdown generation
- backend export endpoints for markdown/zip/docx/pdf
- AI revise endpoint with project context

### Frontend

- Added [frontend/src/hooks/useProjects.ts](/D:/Ivan/TA/document5/book-editor/frontend/src/hooks/useProjects.ts)
- Replaced [frontend/src/pages/Home.tsx](/D:/Ivan/TA/document5/book-editor/frontend/src/pages/Home.tsx)
- Replaced [frontend/src/pages/Editor.tsx](/D:/Ivan/TA/document5/book-editor/frontend/src/pages/Editor.tsx)
- Updated [frontend/src/App.tsx](/D:/Ivan/TA/document5/book-editor/frontend/src/App.tsx)
- Extended [frontend/src/types/index.ts](/D:/Ivan/TA/document5/book-editor/frontend/src/types/index.ts)
- Updated [frontend/src/index.css](/D:/Ivan/TA/document5/book-editor/frontend/src/index.css)

Implemented:

- project listing/creation
- recursive outline
- stacked section canvas
- per-node autosave
- project rules editor
- AI revise sidebar
- backend export download flow

## Validation Run

- Backend `npm run typecheck`: pass
- Backend `npm run build`: pass
- Frontend `npm run typecheck`: pass
- Frontend `npm run build`: pass

## Important Runtime Notes

- DOCX/PDF export will fail unless `pandoc` is installed and available on PATH.
- ZIP export relies on Windows PowerShell `Compress-Archive`.
- AI revise requires at least one enabled provider in backend provider config.
- Projects are stored in `backend/data/projects/<projectId>`.
- Frontend now has `frontend/.env` and `frontend/.env.example` with `VITE_API_BASE_URL=/api`, and `frontend/.gitignore` ignores local env files.

## Known Gaps

- The current canvas is multi-section, but not yet backed by `react-window`/`react-virtuoso`.
- Only the actively focused node is fetched on demand; this is acceptable for the baseline but not yet tuned for very large projects.
- Drag-drop currently inserts after the drop target within the same parent lane chosen by target context; it is not yet a full placement matrix.
- The UI does not yet expose node-level local rules.
- There is no asset manager UI in the pivot baseline.
- Legacy `/api/books` and older frontend modules still exist in the repo but are no longer the primary path.
- Frontend production bundle is large; Vite reported a chunk-size warning during build.

## Recommended Next Steps

1. Add lazy prefetch or virtualization for visible section cards.
2. Add project settings for Pandoc templates and PDF engine.
3. Add node-level rules and inheritance UI.
4. Decide whether to deprecate or delete legacy `books/chapters` routes and screens.
5. Add integration tests for project CRUD, node saves, AI revise, and export endpoints.
