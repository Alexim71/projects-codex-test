import { useEffect, useMemo, useState, type FormEvent } from 'react'
import './ProjectsPage.css'

type Project = {
  id: string
  name: string
  description: string
}

type ProjectForm = Pick<Project, 'name' | 'description'>
type FormErrors = Partial<ProjectForm>

const STORAGE_KEY = 'projects-codex-test:projects'

const sampleProjects: Project[] = [
  {
    id: 'sample-portfolio',
    name: 'Personal Portfolio',
    description: 'Build a responsive portfolio to introduce yourself and showcase your work.',
  },
  {
    id: 'sample-weather',
    name: 'Weather Dashboard',
    description: 'Practice presenting forecast information with clear cards and useful visual cues.',
  },
  {
    id: 'sample-tasks',
    name: 'Study Planner',
    description: 'Organize learning goals into a simple weekly plan and track your progress.',
  },
]

function readProjects(): Project[] {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return sampleProjects

    const parsed: unknown = JSON.parse(saved)
    if (!Array.isArray(parsed)) return sampleProjects

    return parsed.filter(
      (item): item is Project =>
        typeof item === 'object' &&
        item !== null &&
        'id' in item && typeof item.id === 'string' &&
        'name' in item && typeof item.name === 'string' &&
        'description' in item && typeof item.description === 'string',
    )
  } catch {
    return sampleProjects
  }
}

function makeProjectId() {
  return globalThis.crypto?.randomUUID?.() ?? `project-${Date.now()}`
}

function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(readProjects)
  const [query, setQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState<ProjectForm>({ name: '', description: '' })
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
    } catch {
      // The page remains usable when browser storage is unavailable or full.
    }
  }, [projects])

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    if (!normalizedQuery) return projects
    return projects.filter((project) =>
      project.name.toLocaleLowerCase().includes(normalizedQuery),
    )
  }, [projects, query])

  function resetForm() {
    setForm({ name: '', description: '' })
    setErrors({})
    setIsFormOpen(false)
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: FormErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Enter a project name.'
    if (!form.description.trim()) nextErrors.description = 'Enter a project description.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setProjects((current) => [
      { id: makeProjectId(), name: form.name.trim(), description: form.description.trim() },
      ...current,
    ])
    resetForm()
  }

  function updateField(field: keyof ProjectForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    if (value.trim()) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  return (
    <main className="projects-page">
      <header className="page-header">
        <div className="brand-mark" aria-hidden="true">P</div>
        <span className="brand-name">Learning Lab</span>
        <span className="header-label">PROJECTS</span>
      </header>

      <section className="projects-content" aria-labelledby="page-title">
        <div className="intro">
          <p className="eyebrow">YOUR LEARNING SPACE</p>
          <h1 id="page-title">Projects</h1>
          <p className="intro-copy">Explore your ideas, practice new skills, and keep your learning moving.</p>
        </div>

        <div className="project-toolbar">
          <label className="search-box">
            <span className="search-icon" aria-hidden="true">⌕</span>
            <span className="visually-hidden">Search projects by name</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects"
            />
          </label>
          <button className="button button-primary create-button" type="button" onClick={() => setIsFormOpen(true)}>
            <span aria-hidden="true">＋</span> Create Project
          </button>
        </div>

        {isFormOpen && (
          <section className="form-panel" aria-labelledby="form-title">
            <div className="form-heading">
              <div>
                <p className="eyebrow">START SOMETHING NEW</p>
                <h2 id="form-title">Create a project</h2>
              </div>
              <button className="icon-button" type="button" onClick={resetForm} aria-label="Close project form">×</button>
            </div>
            <form onSubmit={handleSave} noValidate>
              <div className="field">
                <label htmlFor="project-name">Project name</label>
                <input
                  id="project-name"
                  autoFocus
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'project-name-error' : undefined}
                  placeholder="e.g. Book review website"
                />
                {errors.name && <p className="field-error" id="project-name-error">{errors.name}</p>}
              </div>
              <div className="field">
                <label htmlFor="project-description">Description</label>
                <textarea
                  id="project-description"
                  rows={4}
                  value={form.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby={errors.description ? 'project-description-error' : undefined}
                  placeholder="What will you learn or build?"
                />
                {errors.description && <p className="field-error" id="project-description-error">{errors.description}</p>}
              </div>
              <div className="form-actions">
                <button className="button button-secondary" type="button" onClick={resetForm}>Cancel</button>
                <button className="button button-primary" type="submit">Save project</button>
              </div>
            </form>
          </section>
        )}

        <div className="list-heading">
          <div>
            <h2>All projects</h2>
            <p>{projects.length} {projects.length === 1 ? 'project' : 'projects'} to explore</p>
          </div>
        </div>

        {filteredProjects.length > 0 ? (
          <ul className="project-list">
            {filteredProjects.map((project, index) => (
              <li className="project-card" key={project.id}>
                <span className={`project-symbol symbol-${index % 3}`} aria-hidden="true">
                  {['✳', '◈', '↗'][index % 3]}
                </span>
                <div className="project-details">
                  <h3>{project.name}</h3>
                  <p>{project.description}</p>
                </div>
                <span className="project-arrow" aria-hidden="true">→</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state" role="status">
            <span className="empty-icon" aria-hidden="true">⌕</span>
            <h3>No projects found</h3>
            <p>Try a different name, or create a new project to get started.</p>
          </div>
        )}
      </section>
      <footer className="page-footer">Small steps make great projects.</footer>
    </main>
  )
}

export default ProjectsPage
