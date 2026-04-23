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
    const response = await saveProjectRules(projectId, rulesDraft)
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
    <div className="h-screen overflow-hidden bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef6ff_100%)] text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 px-5 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <Link to="/" className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-700">
                Workspaces
              </Link>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{manifest.slug}</span>
            </div>
            <h1 className="mt-2 truncate text-2xl font-semibold text-slate-950">{manifest.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => void handleExport('markdown')} className="header-action"><Download size={16} />Markdown</button>
            <button onClick={() => void handleExport('zip')} className="header-action"><Download size={16} />ZIP</button>
            <button onClick={() => void handleExport('docx')} className="header-action"><Download size={16} />DOCX</button>
            <button onClick={() => void handleExport('pdf')} className="header-action"><Download size={16} />PDF</button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-89px)]">
        <aside className="flex w-[300px] flex-col border-r border-slate-200 bg-white/70">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FolderTree size={16} />
              Outline
            </div>
            <button onClick={() => void handleAddNode(null)} className="rounded-full bg-slate-950 p-2 text-white transition hover:bg-sky-700">
              <FilePlus2 size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-auto px-2 py-3">
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

        <main className="flex-1 overflow-hidden">
          <div className="grid h-full grid-cols-[minmax(0,1fr)_360px]">
            <div className="overflow-auto px-8 py-6">
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

            <aside className="flex h-full flex-col border-l border-slate-200 bg-slate-950 text-slate-100">
              <div className="border-b border-slate-800 px-5 py-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Project Rules</h2>
              </div>
              <div className="flex-1 overflow-auto px-5 py-5">
                {rulesDraft && (
                  <div className="space-y-4">
                    <RuleEditor
                      label="Must Follow"
                      value={rulesDraft.mustFollow.join('\n')}
                      onChange={(value) => {
                        setRulesDirty(true)
                        setRulesDraft({ ...rulesDraft, mustFollow: splitLines(value) })
                      }}
                    />
                    <RuleEditor
                      label="Must Not Follow"
                      value={rulesDraft.mustNotFollow.join('\n')}
                      onChange={(value) => {
                        setRulesDirty(true)
                        setRulesDraft({ ...rulesDraft, mustNotFollow: splitLines(value) })
                      }}
                    />
                    <RuleEditor
                      label="Terminology"
                      value={rulesDraft.terminology.join('\n')}
                      onChange={(value) => {
                        setRulesDirty(true)
                        setRulesDraft({ ...rulesDraft, terminology: splitLines(value) })
                      }}
                    />
                    <RuleEditor
                      label="Memory Notes"
                      value={rulesDraft.memoryNotes.join('\n')}
                      onChange={(value) => {
                        setRulesDirty(true)
                        setRulesDraft({ ...rulesDraft, memoryNotes: splitLines(value) })
                      }}
                    />
                    <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Style Profile
                      <input
                        value={rulesDraft.styleProfile}
                        onChange={(event) => {
                          setRulesDirty(true)
                          setRulesDraft({ ...rulesDraft, styleProfile: event.target.value })
                        }}
                        className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                      />
                    </label>
                    <button
                      onClick={() => void handleSaveRules()}
                      disabled={!rulesDirty}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-sky-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-700"
                    >
                      <Save size={16} />
                      Save Rules
                    </button>
                  </div>
                )}

                <div className="mt-10 rounded-[1.5rem] border border-slate-800 bg-slate-900/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <Bot size={16} />
                    AI Wingman
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    {selection?.text ? 'Current selection will be sent with project rules and section context.' : 'No selection. AI will revise the active section content.'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => void handleAIRevise('Make this more academic and concise.')} className="preset-chip">Academic</button>
                    <button onClick={() => void handleAIRevise('Fix grammar and tighten flow.')} className="preset-chip">Grammar</button>
                    <button onClick={() => void handleAIRevise('Paraphrase without changing meaning.')} className="preset-chip">Paraphrase</button>
                  </div>
                  <textarea
                    value={aiInstruction}
                    onChange={(event) => setAiInstruction(event.target.value)}
                    placeholder="Custom instruction for revise..."
                    className="mt-4 h-28 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                  <button
                    onClick={() => void handleAIRevise()}
                    disabled={!activeNodeId || aiLoading}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                  >
                    <WandSparkles size={16} />
                    {aiLoading ? 'Revising...' : 'Revise'}
                  </button>
                  {aiResult && (
                    <Fragment>
                      <div
                        className="prose prose-invert mt-4 max-w-none rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm"
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
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}

function splitLines(value: string) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean)
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
        className={`group flex items-center gap-1 rounded-2xl px-2 py-1.5 ${activeNodeId === nodeId ? 'bg-sky-100 text-sky-800' : 'text-slate-700 hover:bg-slate-100'}`}
        style={{ marginLeft: `${depth * 14}px` }}
      >
        <button onClick={() => onToggle(nodeId)} className="rounded p-1 text-slate-400 hover:bg-white">
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
        <button onClick={() => onSelect(nodeId)} className="min-w-0 flex-1 truncate text-left text-sm font-medium">
          {node.title}
        </button>
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button onClick={() => onAddChild(nodeId)} className="rounded p-1 hover:bg-white" title="Add child"><FilePlus2 size={14} /></button>
          <button onClick={() => onRename(nodeId, node.title)} className="rounded p-1 hover:bg-white" title="Rename"><Pencil size={14} /></button>
          <button onClick={() => onDelete(nodeId)} className="rounded p-1 hover:bg-white" title="Delete"><Trash2 size={14} /></button>
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
    <section className={`rounded-[1.8rem] border px-6 py-5 shadow-sm transition ${active ? 'border-sky-300 bg-white shadow-lg' : 'border-slate-200 bg-white/80'}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Depth {depth + 1}</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">{node.title}</h2>
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
            className="min-h-[280px] w-full resize-y rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4 font-mono text-sm leading-7 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
          />
          <div
            className="preview-content prose max-w-none rounded-[1.4rem] border border-slate-200 bg-white px-5 py-4"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        </div>
      )}
    </section>
  )
}

interface RuleEditorProps {
  label: string
  value: string
  onChange: (value: string) => void
}

function RuleEditor({ label, value, onChange }: RuleEditorProps) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-24 w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
      />
    </label>
  )
}
