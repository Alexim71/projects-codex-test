import { useEffect, useState, type FormEvent } from 'react'
import './ProjectsPage.css'

type Project = {
  id: string
  name: string
  description: string
}

type ProjectForm = Pick<Project, 'name' | 'description'>
type FormErrors = Partial<Record<keyof ProjectForm, boolean>>
type Language = 'en' | 'ru'

const STORAGE_KEY = 'projects-codex-test:projects'
const LANGUAGE_KEY = 'projects-codex-test:language'

const copy = {
  en: {
    brand: 'Learning Lab', headerLabel: 'PROJECTS', eyebrow: 'YOUR LEARNING SPACE',
    title: 'Projects', intro: 'Explore your ideas, practice new skills, and keep your learning moving.',
    searchLabel: 'Search projects by name', searchPlaceholder: 'Search projects', create: 'Create Project',
    startNew: 'START SOMETHING NEW', createTitle: 'Create a project', closeForm: 'Close project form',
    name: 'Project name', description: 'Description', namePlaceholder: 'e.g. Book review website',
    descriptionPlaceholder: 'What will you learn or build?', requiredName: 'Enter a project name.',
    requiredDescription: 'Enter a project description.', cancel: 'Cancel', save: 'Save project',
    allProjects: 'All projects', projectsToExplore: (count: number) => `${count} project${count === 1 ? '' : 's'} to explore`,
    noProjects: 'No projects found', emptyHint: 'Try a different name, or create a new project to get started.',
    footer: 'Small steps make great projects.', deleteProject: (name: string) => `Delete ${name}`,
    openProject: (name: string) => `Open ${name}`, back: 'Back to projects', detailsEyebrow: 'PROJECT OVERVIEW',
    detailsTitle: 'About this project', descriptionLabel: 'Description', languageLabel: 'Switch language to Russian',
  },
  ru: {
    brand: 'Учебная лаборатория', headerLabel: 'ПРОЕКТЫ', eyebrow: 'ВАШЕ ПРОСТРАНСТВО ДЛЯ ОБУЧЕНИЯ',
    title: 'Проекты', intro: 'Развивайте идеи, осваивайте навыки и продолжайте учиться.',
    searchLabel: 'Поиск проектов по названию', searchPlaceholder: 'Поиск проектов', create: 'Создать проект',
    startNew: 'НАЧНИТЕ НОВЫЙ ПРОЕКТ', createTitle: 'Создать проект', closeForm: 'Закрыть форму проекта',
    name: 'Название проекта', description: 'Описание', namePlaceholder: 'Например, сайт с обзорами книг',
    descriptionPlaceholder: 'Чему вы научитесь или что создадите?', requiredName: 'Введите название проекта.',
    requiredDescription: 'Введите описание проекта.', cancel: 'Отмена', save: 'Сохранить проект',
    allProjects: 'Все проекты', projectsToExplore: (count: number) => `Проектов для изучения: ${count}`,
    noProjects: 'Проекты не найдены', emptyHint: 'Попробуйте другое название или создайте новый проект.',
    footer: 'Большие проекты начинаются с маленьких шагов.', deleteProject: (name: string) => `Удалить проект «${name}»`,
    openProject: (name: string) => `Открыть проект «${name}»`, back: 'Назад к проектам', detailsEyebrow: 'О ПРОЕКТЕ',
    detailsTitle: 'Информация о проекте', descriptionLabel: 'Описание', languageLabel: 'Переключить язык на английский',
  },
} satisfies Record<Language, Record<string, string | ((count: number) => string) | ((name: string) => string)>>

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

function readProjectRoute(): string | null {
  const match = window.location.hash.match(/^#\/projects\/(.+)$/)
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return null
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
  const [language, setLanguage] = useState<Language>(() => window.localStorage.getItem(LANGUAGE_KEY) === 'ru' ? 'ru' : 'en')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(readProjectRoute)
  const t = copy[language]

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
    } catch {
      // The page remains usable when browser storage is unavailable or full.
    }
  }, [projects])

  useEffect(() => {
    try {
      window.localStorage.setItem(LANGUAGE_KEY, language)
    } catch {
      // Language selection remains usable when browser storage is unavailable or full.
    }
  }, [language])

  useEffect(() => {
    const syncRoute = () => setSelectedProjectId(readProjectRoute())
    window.addEventListener('hashchange', syncRoute)
    window.addEventListener('popstate', syncRoute)
    return () => {
      window.removeEventListener('hashchange', syncRoute)
      window.removeEventListener('popstate', syncRoute)
    }
  }, [])

  const normalizedQuery = query.trim().toLowerCase()
  const filteredProjects = normalizedQuery
    ? projects.filter((project) => project.name.toLowerCase().includes(normalizedQuery))
    : projects
  const selectedProject = projects.find((project) => project.id === selectedProjectId)

  function resetForm() {
    setForm({ name: '', description: '' })
    setErrors({})
    setIsFormOpen(false)
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: FormErrors = {}
    if (!form.name.trim()) nextErrors.name = true
    if (!form.description.trim()) nextErrors.description = true
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const newProject = {
      id: makeProjectId(),
      name: form.name.trim(),
      description: form.description.trim(),
    }
    setProjects((current) => [newProject, ...current])
    setQuery('')
    resetForm()
  }

  function updateField(field: keyof ProjectForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    if (value.trim()) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function openProject(project: Project) {
    window.history.pushState(null, '', `${window.location.pathname}${window.location.search}#/projects/${encodeURIComponent(project.id)}`)
    setSelectedProjectId(project.id)
  }

  function deleteProject(projectId: string) {
    setProjects((current) => current.filter((project) => project.id !== projectId))
  }

  function showProjectList() {
    window.history.pushState(null, '', `${window.location.pathname}${window.location.search}#/`)
    setSelectedProjectId(null)
  }

  return (
    <main className="projects-page">
      <header className="page-header">
        <div className="brand-mark" aria-hidden="true">P</div>
        <span className="brand-name">{t.brand}</span>
        <span className="header-label">{t.headerLabel}</span>
        <button
          className="language-toggle"
          type="button"
          onClick={() => setLanguage((current) => current === 'en' ? 'ru' : 'en')}
          aria-label={t.languageLabel}
          title={t.languageLabel}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3a14 14 0 0 1 0 18m0-18a14 14 0 0 0 0 18" />
          </svg>
          <span>{language.toUpperCase()}</span>
        </button>
      </header>

      {selectedProject ? (
        <section className="projects-content project-page" aria-labelledby="page-title">
          <button className="back-button" type="button" onClick={showProjectList}>
            <span aria-hidden="true">←</span> {t.back}
          </button>
          <div className="intro detail-intro">
            <p className="eyebrow">{t.detailsEyebrow}</p>
            <h1 id="page-title">{selectedProject.name}</h1>
          </div>
          <article className="project-info-card">
            <h2>{t.detailsTitle}</h2>
            <h3>{t.descriptionLabel}</h3>
            <p>{selectedProject.description}</p>
          </article>
        </section>
      ) : (
        <section className="projects-content" aria-labelledby="page-title">
          <div className="intro">
            <p className="eyebrow">{t.eyebrow}</p>
            <h1 id="page-title">{t.title}</h1>
            <p className="intro-copy">{t.intro}</p>
          </div>

          <div className="project-toolbar">
            <label className="search-box">
              <span className="search-icon" aria-hidden="true">⌕</span>
              <span className="visually-hidden">{t.searchLabel}</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.searchPlaceholder}
              />
            </label>
            <button className="button button-primary create-button" type="button" onClick={() => setIsFormOpen(true)}>
              <span aria-hidden="true">＋</span> {t.create}
            </button>
          </div>

          {isFormOpen && (
            <section className="form-panel" aria-labelledby="form-title">
              <div className="form-heading">
                <div>
                  <p className="eyebrow">{t.startNew}</p>
                  <h2 id="form-title">{t.createTitle}</h2>
                </div>
                <button className="icon-button" type="button" onClick={resetForm} aria-label={t.closeForm}>×</button>
              </div>
              <form onSubmit={handleSave} noValidate>
                <div className="field">
                  <label htmlFor="project-name">{t.name}</label>
                  <input
                    id="project-name"
                    autoFocus
                    value={form.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'project-name-error' : undefined}
                    placeholder={t.namePlaceholder}
                  />
                  {errors.name && <p className="field-error" id="project-name-error">{t.requiredName}</p>}
                </div>
                <div className="field">
                  <label htmlFor="project-description">{t.description}</label>
                  <textarea
                    id="project-description"
                    rows={4}
                    value={form.description}
                    onChange={(event) => updateField('description', event.target.value)}
                    aria-invalid={Boolean(errors.description)}
                    aria-describedby={errors.description ? 'project-description-error' : undefined}
                    placeholder={t.descriptionPlaceholder}
                  />
                  {errors.description && <p className="field-error" id="project-description-error">{t.requiredDescription}</p>}
                </div>
                <div className="form-actions">
                  <button className="button button-secondary" type="button" onClick={resetForm}>{t.cancel}</button>
                  <button className="button button-primary" type="submit">{t.save}</button>
                </div>
              </form>
            </section>
          )}

          <div className="list-heading">
            <div>
              <h2>{t.allProjects}</h2>
              <p>{t.projectsToExplore(projects.length)}</p>
            </div>
          </div>

          {filteredProjects.length > 0 ? (
            <ul className="project-list">
              {filteredProjects.map((project, index) => (
                <li className="project-card" key={project.id}>
                  <button className="project-card-link" type="button" onClick={() => openProject(project)} aria-label={t.openProject(project.name)}>
                    <span className={`project-symbol symbol-${index % 3}`} aria-hidden="true">
                      {['✳', '◈', '↗'][index % 3]}
                    </span>
                    <span className="project-details">
                      <span className="project-title">{project.name}</span>
                      <span className="project-description">{project.description}</span>
                    </span>
                    <span className="project-arrow" aria-hidden="true">→</span>
                  </button>
                  <button className="delete-button" type="button" onClick={() => deleteProject(project.id)} aria-label={t.deleteProject(project.name)} title={t.deleteProject(project.name)}>
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M8 6V4h8v2m3 0-.9 14H5.9L5 6m4 4v6m6-6v6" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state" role="status">
              <span className="empty-icon" aria-hidden="true">⌕</span>
              <h3>{t.noProjects}</h3>
              <p>{t.emptyHint}</p>
            </div>
          )}
        </section>
      )}
      <footer className="page-footer">{t.footer}</footer>
    </main>
  )
}

export default ProjectsPage

