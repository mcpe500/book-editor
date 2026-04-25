import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Bot,
  ChevronDown,
  ChevronRight,
  Download,
  FilePlus2,
  FolderTree,
  GripVertical,
  Pencil,
  Save,
  Trash2,
  WandSparkles,
} from 'lucide-react'
import { saveAs } from 'file-saver'
import { renderMarkdown } from '../lib/markdown'
import {
  createProjectNode,
  deleteProjectNode,
  exportProject,
  fetchNodeDocument,
  moveProjectNode,
  persistNodeContent,
  renameProjectNode,
  reviseProject,
  saveProjectRules,
  useProjectTree,
} from '../hooks/useProjects'
import type { ProjectManifest, ProjectNode, ProjectNodeDocument, ProjectRuleSet } from '../types'

type SelectionState = {
  nodeId: string
  start: number
  end: number
  text: string
} | null

export default function Editor() {
  const { projectId = '' } = useParams<{ projectId: string }>()
  const { data, isLoading } = useProjectTree(projectId)
  const [manifest, setManifest] = useState<ProjectManifest | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  const [nodeDocuments, setNodeDocuments] = useState<Record<string, ProjectNodeDocument>>({})
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [selection, setSelection] = useState<SelectionState>(null)
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null)
  const [rulesDraft, setRulesDraft] = useState<ProjectRuleSet | null>(null)
  const [rulesDirty, setRulesDirty] = useState(false)
  const [aiInstruction, setAiInstruction] = useState('')
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const draftsRef = useRef<Record<string, string>>({})
  const docsRef = useRef<Record<string, ProjectNodeDocument>>({})

  useEffect(() => {
    if (!data?.manifest) return
    setManifest(data.manifest)
    setRulesDraft(data.manifest.rules)
    setExpandedIds(new Set(Object.keys(data.manifest.nodes)))
    setActiveNodeId((current) => current ?? data.manifest.rootNodeIds[0] ?? null)
  }, [data?.manifest])

  useEffect(() => {
    draftsRef.current = drafts
  }, [drafts])

  useEffect(() => {
    docsRef.current = nodeDocuments
  }, [nodeDocuments])

  useEffect(() => {
    if (!activeNodeId) return
    void ensureNodeLoaded(activeNodeId)
  }, [activeNodeId])

  const visibleNodes = useMemo(() => {
    if (!manifest) return []
    const rows: Array<{ node: ProjectNode; depth: number }> = []
    const visit = (nodeId: string, depth: number) => {
      const node = manifest.nodes[nodeId]
      if (!node) return
      rows.push({ node, depth })
      if (!expandedIds.has(nodeId)) return
      node.children.forEach((childId) => visit(childId, depth + 1))
    }
    manifest.rootNodeIds.forEach((nodeId) => visit(nodeId, 0))
    return rows
  }, [expandedIds, manifest])

  async function ensureNodeLoaded(nodeId: string) {
    if (!projectId || nodeDocuments[nodeId]) return
    const document = await fetchNodeDocument(projectId, nodeId)
    setNodeDocuments((prev) => ({ ...prev, [nodeId]: document }))
    setDrafts((prev) => (prev[nodeId] !== undefined ? prev : { ...prev, [nodeId]: document.content }))
  }

  async function flushNode(nodeId: string) {
    if (!projectId) return
    const content = draftsRef.current[nodeId]
    const current = docsRef.current[nodeId]
    if (content === undefined || !current || content === current.content) return

    setSavingIds((prev) => new Set(prev).add(nodeId))
    try {
      const saved = await persistNodeContent(projectId, nodeId, content)
      setNodeDocuments((prev) => ({ ...prev, [nodeId]: saved }))
      setManifest((prev) => {
        if (!prev) return prev
        const currentNode = prev.nodes[nodeId]
        if (!currentNode) return prev
        return {
          ...prev,
          updatedAt: saved.node.updatedAt,
          nodes: {
            ...prev.nodes,
            [nodeId]: { ...currentNode, updatedAt: saved.node.updatedAt },
          },
        }
      })
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev)
        next.delete(nodeId)
        return next
      })
    }
  }

  function scheduleSave(nodeId: string) {
    const existingTimer = timersRef.current[nodeId]
    if (existingTimer) {
      clearTimeout(existingTimer)
    }
    timersRef.current[nodeId] = setTimeout(() => {
      void flushNode(nodeId)
    }, 1200)
  }

  function handleDraftChange(nodeId: string, content: string) {
    setDrafts((prev) => ({ ...prev, [nodeId]: content }))
    scheduleSave(nodeId)
  }

  async function handleAddNode(parentId: string | null) {
    if (!projectId) return
    const title = window.prompt('New section title')
    if (!title?.trim()) return

    const previousNodeIds = manifest ? new Set(Object.keys(manifest.nodes)) : new Set<string>()
    const response = await createProjectNode(projectId, title.trim(), parentId, null)
    setManifest(response.manifest)
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (parentId) next.add(parentId)
      return next
    })

    const createdNodeId = Object.keys(response.manifest.nodes).find((nodeId) => !previousNodeIds.has(nodeId)) ?? null
    if (createdNodeId) {
      setActiveNodeId(createdNodeId)
      await ensureNodeLoaded(createdNodeId)
    }
  }

  async function handleRenameNode(nodeId: string, currentTitle: string) {
    if (!projectId) return
    const title = window.prompt('Rename section', currentTitle)
    if (!title?.trim() || title.trim() === currentTitle) return
    const response = await renameProjectNode(projectId, nodeId, title.trim())
    setManifest(response.manifest)
  }

  async function handleDeleteNode(nodeId: string) {
    if (!projectId || !window.confirm('Delete this section and all children?')) return
    const response = await deleteProjectNode(projectId, nodeId)
    setManifest(response.manifest)
    setNodeDocuments((prev) => {
      const next = { ...prev }
      delete next[nodeId]
      return next
    })
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[nodeId]
      return next
    })
    if (activeNodeId === nodeId) {
      setActiveNodeId(response.manifest.rootNodeIds[0] ?? null)
    }
  }

  async function handleDrop(targetNodeId: string) {
    if (!projectId || !manifest || !draggedNodeId || draggedNodeId === targetNodeId) return

    const targetNode = manifest.nodes[targetNodeId]
    if (!targetNode) return
    const siblings = targetNode.parentId ? manifest.nodes[targetNode.parentId]?.children ?? [] : manifest.rootNodeIds
    const targetIndex = Math.max(0, siblings.indexOf(targetNodeId) + 1)
    const response = await moveProjectNode(projectId, draggedNodeId, targetNode.parentId, targetIndex)
    setManifest(response.manifest)
    setDraggedNodeId(null)
  }

  async function handleSaveRules() {
    if (!projectId || !rulesDraft) return
    const response = await saveProjectRules(projectId, normalizeRules(rulesDraft))
    setManifest(response.manifest)
    setRulesDraft(response.manifest.rules)
    setRulesDirty(false)
  }

  async function handleAIRevise(preset?: string) {
    if (!projectId || !activeNodeId) return
    const instruction = (preset ?? aiInstruction).trim()
    if (!instruction) return

    await ensureNodeLoaded(activeNodeId)
    setAiLoading(true)
    try {
      const response = await reviseProject(
        projectId,
        activeNodeId,
        instruction,
        selection?.nodeId === activeNodeId ? selection.text : undefined
      )
      setAiResult(response.content)
    } finally {
      setAiLoading(false)
    }
  }

  function applyAIResult(mode: 'replace' | 'insert_below') {
    if (!activeNodeId || !aiResult) return
    const currentContent = draftsRef.current[activeNodeId] ?? ''
    const activeSelection = selection?.nodeId === activeNodeId ? selection : null
    let nextContent = currentContent

    if (mode === 'replace') {
      if (activeSelection && activeSelection.end > activeSelection.start) {
        nextContent = `${currentContent.slice(0, activeSelection.start)}${aiResult}${currentContent.slice(activeSelection.end)}`
      } else {
        nextContent = aiResult
      }
    } else if (activeSelection) {
      nextContent = `${currentContent.slice(0, activeSelection.end)}\n\n${aiResult}${currentContent.slice(activeSelection.end)}`
    } else {
      nextContent = `${currentContent.trimEnd()}\n\n${aiResult}`
    }

    handleDraftChange(activeNodeId, nextContent)
  }

  async function handleExport(format: 'markdown' | 'zip' | 'docx' | 'pdf') {
    if (!projectId) return
    const { blob, filename } = await exportProject(projectId, format)
    saveAs(blob, filename)
  }

  if (isLoading || !manifest) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        Loading workspace...
      </div>
    )
  }

  return (
    <div className="app-surface h-screen overflow-hidden text-slate-900">
      <header className="border-b border-white/70 bg-white/78 px-5 py-4 shadow-sm shadow-slate-950/5 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <Link to="/" className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700 transition hover:text-sky-900">
                Workspaces
              </Link>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">{manifest.slug}</span>
            </div>
            <h1 className="mt-2 truncate text-2xl font-semibold tracking-[-0.03em] text-slate-950">{manifest.title}</h1>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <button onClick={() => void handleExport('markdown')} className="header-action"><Download size={16} />Markdown</button>
            <button onClick={() => void handleExport('zip')} className="header-action"><Download size={16} />ZIP</button>
            <button onClick={() => void handleExport('docx')} className="header-action"><Download size={16} />DOCX</button>
            <button onClick={() => void handleExport('pdf')} className="header-action"><Download size={16} />PDF</button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-89px)] min-h-0">
        <aside className="flex min-h-0 w-[300px] flex-col border-r border-white/70 bg-white/72 shadow-xl shadow-slate-950/5 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FolderTree size={16} />
              Outline
            </div>
            <button onClick={() => void handleAddNode(null)} className="rounded-full bg-slate-950 p-2 text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-sky-700" title="Add root section">
              <FilePlus2 size={16} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
            {manifest.rootNodeIds.map((nodeId) => (
              <TreeNode
                key={nodeId}
                nodeId={nodeId}
                manifest={manifest}
                activeNodeId={activeNodeId}
                expandedIds={expandedIds}
                onToggle={(nodeIdValue) => {
                  setExpandedIds((prev) => {
                    const next = new Set(prev)
                    if (next.has(nodeIdValue)) next.delete(nodeIdValue)
                    else next.add(nodeIdValue)
                    return next
                  })
                }}
                onSelect={(nodeIdValue) => {
                  setActiveNodeId(nodeIdValue)
                  void ensureNodeLoaded(nodeIdValue)
                }}
                onAddChild={(nodeIdValue) => void handleAddNode(nodeIdValue)}
                onRename={(nodeIdValue, title) => void handleRenameNode(nodeIdValue, title)}
                onDelete={(nodeIdValue) => void handleDeleteNode(nodeIdValue)}
                onDragStart={setDraggedNodeId}
                onDrop={(nodeIdValue) => void handleDrop(nodeIdValue)}
              />
            ))}
          </div>
        </aside>

        <main className="min-h-0 flex-1 overflow-hidden">
          <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_minmax(360px,390px)]">
            <div className="editor-grid-bg min-h-0 overflow-y-auto px-6 py-6 lg:px-8">
              <div className="mx-auto max-w-4xl space-y-4">
                {visibleNodes.map(({ node, depth }) => (
                  <SectionCard
                    key={node.id}
                    node={node}
                    depth={depth}
                    active={node.id === activeNodeId}
                    content={drafts[node.id] ?? nodeDocuments[node.id]?.content ?? ''}
                    loading={!nodeDocuments[node.id]}
                    saving={savingIds.has(node.id)}
                    onFocus={() => {
                      setActiveNodeId(node.id)
                      void ensureNodeLoaded(node.id)
                    }}
                    onChange={(value) => handleDraftChange(node.id, value)}
                    onBlur={() => void flushNode(node.id)}
                    onSelection={(start, end, text) => {
                      setSelection({ nodeId: node.id, start, end, text })
                      setActiveNodeId(node.id)
                    }}
                  />
                ))}
              </div>
            </div>

            <aside className="flex h-full min-h-0 flex-col border-l border-slate-800 bg-slate-950 text-slate-100 shadow-2xl shadow-slate-950/25">
              <div className="border-b border-slate-800 bg-slate-950/95 px-5 py-4 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300">Control panel</p>
                    <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-white">Rules & AI</h2>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${rulesDirty ? 'bg-amber-400/12 text-amber-200 ring-1 ring-amber-300/20' : 'bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-300/20'}`}>
                    {rulesDirty ? 'Unsaved' : 'Saved'}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Keep writing constraints close to the draft. Changes are applied to future AI revisions after saving.
                </p>
              </div>
              <div className="control-scroll min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 overscroll-contain">
                {rulesDraft && (
                  <div className="space-y-3">
                    <RuleEditor
                      label="Must Follow"
                      description="Hard requirements the draft and AI must preserve. One rule per line."
                      placeholder="Example: Use Bahasa Indonesia formal akademik"
                      value={rulesDraft.mustFollow.join('\n')}
                      onChange={(value) => {
                        setRulesDirty(true)
                        setRulesDraft({ ...rulesDraft, mustFollow: preserveLines(value) })
                      }}
                    />
                    <RuleEditor
                      label="Must Not Follow"
                      description="Things to avoid, such as banned terms, tone, or formatting mistakes."
                      placeholder="Example: Do not use first-person pronouns"
                      value={rulesDraft.mustNotFollow.join('\n')}
                      onChange={(value) => {
                        setRulesDirty(true)
                        setRulesDraft({ ...rulesDraft, mustNotFollow: preserveLines(value) })
                      }}
                    />
                    <RuleEditor
                      label="Terminology"
                      description="Preferred terms, abbreviations, and naming conventions."
                      placeholder="Example: IoT = Internet of Things"
                      value={rulesDraft.terminology.join('\n')}
                      onChange={(value) => {
                        setRulesDirty(true)
                        setRulesDraft({ ...rulesDraft, terminology: preserveLines(value) })
                      }}
                    />
                    <RuleEditor
                      label="Memory Notes"
                      description="Persistent context for the thesis, advisor notes, or prior decisions."
                      placeholder="Example: Chapter 2 focuses on related work"
                      value={rulesDraft.memoryNotes.join('\n')}
                      onChange={(value) => {
                        setRulesDirty(true)
                        setRulesDraft({ ...rulesDraft, memoryNotes: preserveLines(value) })
                      }}
                    />
                    <label className="block rounded-[1.25rem] border border-slate-800 bg-slate-900/55 p-4">
                      <span className="text-sm font-semibold text-slate-100">Style profile</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">Short writing style instruction used as global tone guidance.</span>
                      <input
                        value={rulesDraft.styleProfile}
                        onChange={(event) => {
                          setRulesDirty(true)
                          setRulesDraft({ ...rulesDraft, styleProfile: event.target.value })
                        }}
                        placeholder="Academic, concise, evidence-driven"
                        className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-400 focus:ring-4 focus:ring-sky-950"
                      />
                    </label>
                  </div>
                )}

                <div className="rounded-[1.5rem] border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-4 shadow-2xl shadow-slate-950/25">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                        <Bot size={16} className="text-sky-300" />
                        AI Wingman
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {selection?.text ? 'Selection mode: only highlighted text is sent with rules and context.' : 'Section mode: revise the active section using saved project rules.'}
                      </p>
                    </div>
                    {selection?.text && (
                      <span className="rounded-full bg-sky-400/10 px-2.5 py-1 text-xs font-semibold text-sky-200 ring-1 ring-sky-300/20">
                        {selection.text.length} chars
                      </span>
                    )}
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button onClick={() => void handleAIRevise('Make this more academic and concise.')} className="preset-chip">Academic</button>
                    <button onClick={() => void handleAIRevise('Fix grammar and tighten flow.')} className="preset-chip">Grammar</button>
                    <button onClick={() => void handleAIRevise('Paraphrase without changing meaning.')} className="preset-chip">Paraphrase</button>
                  </div>
                  <textarea
                    value={aiInstruction}
                    onChange={(event) => setAiInstruction(event.target.value)}
                    placeholder="Custom instruction for revise..."
                    className="mt-4 h-24 w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-400 focus:ring-4 focus:ring-sky-950"
                  />
                  <button
                    onClick={() => void handleAIRevise()}
                    disabled={!activeNodeId || aiLoading}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-sky-100 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
                  >
                    <WandSparkles size={16} />
                    {aiLoading ? 'Revising...' : 'Revise'}
                  </button>
                  {aiResult && (
                    <Fragment>
                      <div
                        className="control-scroll prose prose-invert mt-4 max-h-72 max-w-none overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(aiResult) }}
                      />
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => applyAIResult('replace')} className="flex-1 rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500">Replace</button>
                        <button onClick={() => applyAIResult('insert_below')} className="flex-1 rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-800">Insert Below</button>
                      </div>
                    </Fragment>
                  )}
                </div>
              </div>
              <div className="border-t border-slate-800 bg-slate-950/95 p-4 backdrop-blur">
                <button
                  onClick={() => void handleSaveRules()}
                  disabled={!rulesDraft || !rulesDirty}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-950/30 transition hover:-translate-y-0.5 hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none"
                >
                  <Save size={16} />
                  {rulesDirty ? 'Save Rules' : 'Rules Saved'}
                </button>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}

function preserveLines(value: string) {
  return value.split('\n')
}

function normalizeRuleLines(lines: string[]) {
  return lines.map((line) => line.trim()).filter(Boolean)
}

function normalizeRules(rules: ProjectRuleSet): ProjectRuleSet {
  return {
    ...rules,
    mustFollow: normalizeRuleLines(rules.mustFollow),
    mustNotFollow: normalizeRuleLines(rules.mustNotFollow),
    terminology: normalizeRuleLines(rules.terminology),
    memoryNotes: normalizeRuleLines(rules.memoryNotes),
  }
}

interface TreeNodeProps {
  nodeId: string
  manifest: ProjectManifest
  activeNodeId: string | null
  expandedIds: Set<string>
  onToggle: (nodeId: string) => void
  onSelect: (nodeId: string) => void
  onAddChild: (nodeId: string) => void
  onRename: (nodeId: string, title: string) => void
  onDelete: (nodeId: string) => void
  onDragStart: (nodeId: string | null) => void
  onDrop: (nodeId: string) => void
  depth?: number
}

function TreeNode({
  nodeId,
  manifest,
  activeNodeId,
  expandedIds,
  onToggle,
  onSelect,
  onAddChild,
  onRename,
  onDelete,
  onDragStart,
  onDrop,
  depth = 0,
}: TreeNodeProps) {
  const node = manifest.nodes[nodeId]
  if (!node) return null

  const expanded = expandedIds.has(nodeId)

  return (
    <div>
      <div
        draggable
        onDragStart={() => onDragStart(nodeId)}
        onDragEnd={() => onDragStart(null)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={() => onDrop(nodeId)}
        className={`group flex items-center gap-1 rounded-2xl px-2 py-1.5 transition ${activeNodeId === nodeId ? 'bg-sky-100 text-sky-800 shadow-sm ring-1 ring-sky-200' : 'text-slate-700 hover:bg-slate-100'}`}
        style={{ marginLeft: `${depth * 14}px` }}
      >
        <button onClick={() => onToggle(nodeId)} className="rounded-lg p-1 text-slate-400 transition hover:bg-white hover:text-slate-700">
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
        <button onClick={() => onSelect(nodeId)} className="min-w-0 flex-1 truncate text-left text-sm font-medium">
          {node.title}
        </button>
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button onClick={() => onAddChild(nodeId)} className="rounded-lg p-1 transition hover:bg-white hover:text-sky-700" title="Add child"><FilePlus2 size={14} /></button>
          <button onClick={() => onRename(nodeId, node.title)} className="rounded-lg p-1 transition hover:bg-white hover:text-sky-700" title="Rename"><Pencil size={14} /></button>
          <button onClick={() => onDelete(nodeId)} className="rounded-lg p-1 transition hover:bg-white hover:text-red-600" title="Delete"><Trash2 size={14} /></button>
          <span className="rounded p-1 text-slate-400"><GripVertical size={14} /></span>
        </div>
      </div>
      {expanded && node.children.map((childId) => (
        <TreeNode
          key={childId}
          nodeId={childId}
          manifest={manifest}
          activeNodeId={activeNodeId}
          expandedIds={expandedIds}
          onToggle={onToggle}
          onSelect={onSelect}
          onAddChild={onAddChild}
          onRename={onRename}
          onDelete={onDelete}
          onDragStart={onDragStart}
          onDrop={onDrop}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}

interface SectionCardProps {
  node: ProjectNode
  depth: number
  active: boolean
  content: string
  loading: boolean
  saving: boolean
  onFocus: () => void
  onChange: (value: string) => void
  onBlur: () => void
  onSelection: (start: number, end: number, text: string) => void
}

function SectionCard({
  node,
  depth,
  active,
  content,
  loading,
  saving,
  onFocus,
  onChange,
  onBlur,
  onSelection,
}: SectionCardProps) {
  return (
    <section className={`rounded-[1.8rem] border px-6 py-5 shadow-sm backdrop-blur transition ${active ? 'border-sky-300 bg-white shadow-xl shadow-sky-950/10 ring-4 ring-sky-100/70' : 'border-white/70 bg-white/78 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-950/5'}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Depth {depth + 1}</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-slate-950">{node.title}</h2>
        </div>
        <div className="text-xs text-slate-500">{saving ? 'Saving...' : new Date(node.updatedAt).toLocaleTimeString()}</div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">Loading section content...</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
          <textarea
            value={content}
            onFocus={onFocus}
            onBlur={onBlur}
            onChange={(event) => onChange(event.target.value)}
            onSelect={(event) => {
              const target = event.target as HTMLTextAreaElement
              onSelection(
                target.selectionStart,
                target.selectionEnd,
                target.value.slice(target.selectionStart, target.selectionEnd)
              )
            }}
            className="min-h-[280px] w-full resize-y rounded-[1.4rem] border border-slate-200 bg-slate-50/90 px-4 py-4 font-mono text-sm leading-7 text-slate-900 shadow-inner shadow-slate-950/[0.02] outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
          />
          <div
            className="preview-content prose max-w-none rounded-[1.4rem] border border-slate-200 bg-white px-5 py-4 shadow-inner shadow-slate-950/[0.02]"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        </div>
      )}
    </section>
  )
}

interface RuleEditorProps {
  label: string
  description: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}

function RuleEditor({ label, description, placeholder, value, onChange }: RuleEditorProps) {
  return (
    <label className="block rounded-[1.25rem] border border-slate-800 bg-slate-900/55 p-4 transition focus-within:border-sky-500/70 focus-within:bg-slate-900">
      <span className="text-sm font-semibold text-slate-100">{label}</span>
      <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-3 h-24 w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-400 focus:ring-4 focus:ring-sky-950"
      />
    </label>
  )
}
