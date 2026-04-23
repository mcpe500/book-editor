import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, FolderTree, Plus } from 'lucide-react'
import { useCreateProject, useProjects } from '../hooks/useProjects'

export default function Home() {
  const { data: projects, isLoading } = useProjects()
  const createProject = useCreateProject()
  const [showModal, setShowModal] = useState(false)
  const [newProjectTitle, setNewProjectTitle] = useState('')

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newProjectTitle.trim()) return

    try {
      const project = await createProject.mutateAsync(newProjectTitle)
      setNewProjectTitle('')
      setShowModal(false)
      window.location.href = `/projects/${project.id}`
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)]">
      <header className="border-b border-slate-200/80 bg-white/80 px-6 py-5 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-700">Book Editor</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Filesystem thesis workspace</h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-sky-700"
          >
            <Plus size={20} />
            New Project
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {isLoading ? (
          <div className="py-12 text-center text-slate-500">Loading...</div>
        ) : projects?.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white/80 px-8 py-16 text-center shadow-sm">
            <FolderTree size={48} className="mx-auto mb-4 text-sky-600" />
            <p className="mb-4 text-slate-600">No project yet. Start one and build the thesis as a modular tree of markdown files.</p>
            <button
              onClick={() => setShowModal(true)}
              className="rounded-full bg-sky-600 px-5 py-3 text-white transition hover:bg-sky-700"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {projects?.map((project) => (
              <div
                key={project.id}
                className="group rounded-[1.6rem] border border-slate-200 bg-white/85 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-lg"
              >
                <Link to={`/projects/${project.id}`} className="block">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{project.slug}</p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-950 transition group-hover:text-sky-700">{project.title}</h3>
                    </div>
                    <div className="rounded-full bg-slate-100 p-3 text-slate-500 transition group-hover:bg-sky-100 group-hover:text-sky-700">
                      <FolderTree size={18} />
                    </div>
                  </div>
                  <p className="mt-6 text-sm text-slate-600">
                    {project.nodeCount} nodes • Updated {new Date(project.updatedAt).toLocaleString()}
                  </p>
                  <div className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-sky-700">
                    Open workspace
                    <ArrowRight size={16} />
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-950">Create project</h2>
            <p className="mt-2 text-sm text-slate-600">A project contains one manifest file, many markdown nodes, assets, rules, and exports.</p>
            <form onSubmit={handleCreate} className="mt-6">
              <input
                type="text"
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                placeholder="Thesis workspace title"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 focus:border-sky-500 focus:outline-none"
                autoFocus
              />
              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-full border border-slate-300 px-4 py-2 text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-slate-950 px-5 py-2 text-white transition hover:bg-sky-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
