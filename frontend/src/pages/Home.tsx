import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Clock, Files, FolderTree, Plus, Sparkles, X } from 'lucide-react'
import { useCreateProject, useProjects } from '../hooks/useProjects'

export default function Home() {
  const { data: projects, isLoading } = useProjects()
  const createProject = useCreateProject()
  const [showModal, setShowModal] = useState(false)
  const [newProjectTitle, setNewProjectTitle] = useState('')

  const projectCount = projects?.length ?? 0
  const totalNodes = projects?.reduce((sum, project) => sum + project.nodeCount, 0) ?? 0
  const latestProject = projects?.[0]

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    const title = newProjectTitle.trim()
    if (!title) return

    try {
      const project = await createProject.mutateAsync(title)
      setNewProjectTitle('')
      setShowModal(false)
      window.location.href = `/projects/${project.id}`
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  return (
    <div className="app-surface min-h-screen text-slate-950">
      <header className="px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link to="/" className="group flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/15 transition group-hover:-translate-y-0.5">
              <BookOpen size={21} />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.28em] text-slate-950">BOOK EDITOR</p>
              <p className="hidden text-xs text-slate-500 sm:block">Filesystem thesis workspace</p>
            </div>
          </Link>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200"
          >
            <Plus size={18} />
            New Project
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-12 pt-4 sm:px-8 lg:pb-16">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
          <div className="glass-panel overflow-hidden rounded-[2rem] p-7 sm:p-9 lg:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              <Sparkles size={14} />
              Thesis command center
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">
              Write structured thesis drafts without losing the file tree.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Build chapters as modular markdown nodes, keep rules beside the draft, revise with AI, and export the whole workspace when it is ready.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-sky-700/20 transition hover:-translate-y-0.5 hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200"
              >
                Create thesis workspace
                <ArrowRight size={18} />
              </button>
              {latestProject && (
                <Link
                  to={`/projects/${latestProject.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/75 px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-sky-700"
                >
                  Continue latest
                  <ArrowRight size={18} />
                </Link>
              )}
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <Metric icon={Files} label="Projects" value={projectCount.toString()} />
              <Metric icon={FolderTree} label="Markdown nodes" value={totalNodes.toString()} />
              <Metric icon={Clock} label="Latest update" value={latestProject ? formatDate(latestProject.updatedAt) : 'No activity'} />
            </div>
          </div>

          <aside className="glass-panel rounded-[2rem] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Workflow</p>
            <div className="mt-5 space-y-4">
              <WorkflowStep number="01" title="Outline first" description="Split the thesis into sections and reorder nodes as the argument changes." />
              <WorkflowStep number="02" title="Draft beside preview" description="Edit markdown while seeing the rendered result in the same workspace." />
              <WorkflowStep number="03" title="Rules stay attached" description="Keep terminology, style, and memory notes close to every AI revision." />
            </div>
          </aside>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Library</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">Your workspaces</h2>
            </div>
            <p className="text-sm text-slate-500">{projectCount} project{projectCount === 1 ? '' : 's'} available</p>
          </div>

          {isLoading ? (
            <div className="glass-panel rounded-[1.75rem] px-6 py-14 text-center text-slate-500">Loading workspaces...</div>
          ) : projectCount === 0 ? (
            <EmptyState onCreate={() => setShowModal(true)} />
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {projects?.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="group glass-panel block rounded-[1.75rem] p-5 transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-2xl hover:shadow-sky-950/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{project.slug}</p>
                      <h3 className="mt-3 line-clamp-2 text-xl font-semibold tracking-[-0.025em] text-slate-950 transition group-hover:text-sky-700">
                        {project.title}
                      </h3>
                    </div>
                    <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-sky-50 text-sky-700 transition group-hover:bg-sky-600 group-hover:text-white">
                      <FolderTree size={20} />
                    </div>
                  </div>
                  <div className="mt-8 flex items-center justify-between border-t border-slate-200/70 pt-4 text-sm">
                    <span className="font-medium text-slate-600">{project.nodeCount} nodes</span>
                    <span className="text-slate-400">{formatDate(project.updatedAt)}</span>
                  </div>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
                    Open workspace
                    <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowModal(false)
          }}
        >
          <div className="w-full max-w-lg rounded-[2rem] border border-white/60 bg-white p-6 shadow-2xl shadow-slate-950/25 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">New workspace</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">Create project</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Give the thesis a clear workspace title. The app will create the manifest and first markdown tree.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close create project dialog"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-7 space-y-5">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Project title</span>
                <input
                  type="text"
                  value={newProjectTitle}
                  onChange={(event) => setNewProjectTitle(event.target.value)}
                  placeholder="Example: Analisis Keamanan IoT"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-950 shadow-inner shadow-slate-950/[0.02] outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  autoFocus
                />
              </label>

              {createProject.isError && (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">Failed to create project. Please try again.</p>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newProjectTitle.trim() || createProject.isPending}
                  className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-slate-950/15 transition hover:bg-sky-700 disabled:bg-slate-300 disabled:shadow-none"
                >
                  {createProject.isPending ? 'Creating...' : 'Create workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value))
}

interface MetricProps {
  icon: typeof Files
  label: string
  value: string
}

function Metric({ icon: Icon, label, value }: MetricProps) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/65 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        <Icon size={14} />
        {label}
      </div>
      <p className="mt-3 truncate text-2xl font-semibold tracking-[-0.03em] text-slate-950">{value}</p>
    </div>
  )
}

interface WorkflowStepProps {
  number: string
  title: string
  description: string
}

function WorkflowStep({ number, title, description }: WorkflowStepProps) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/60 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-950 text-xs font-bold text-white">{number}</span>
        <h3 className="font-semibold text-slate-950">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  )
}

interface EmptyStateProps {
  onCreate: () => void
}

function EmptyState({ onCreate }: EmptyStateProps) {
  return (
    <div className="glass-panel editor-grid-bg overflow-hidden rounded-[2rem] p-6 sm:p-10">
      <div className="mx-auto max-w-2xl rounded-[1.75rem] border border-slate-200/70 bg-white/82 p-8 text-center shadow-xl shadow-slate-950/5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-slate-950 text-white shadow-xl shadow-slate-950/20">
          <FolderTree size={30} />
        </div>
        <h3 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-slate-950">No project yet</h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-600">
          Start with one thesis workspace. You can add chapters, rules, notes, AI revisions, and exports after the tree is created.
        </p>
        <button
          onClick={onCreate}
          className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-sky-700/20 transition hover:-translate-y-0.5 hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200"
        >
          Create first project
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  )
}
