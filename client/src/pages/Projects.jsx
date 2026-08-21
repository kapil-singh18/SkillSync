import { useState, useEffect } from 'react';
import { Plus, X, Users, Briefcase, Zap, AlertCircle, FolderKanban } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import useProjectStore from '../store/projectStore';

// ─── Create Project Modal ─────────────────────────────────────────────────────
const CreateProjectModal = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({ title: '', description: '', type: 'study_project', requiredSkills: [] });
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s || form.requiredSkills.includes(s)) return;
    setForm((prev) => ({ ...prev, requiredSkills: [...prev.requiredSkills, s] }));
    setSkillInput('');
  };

  const removeSkill = (i) =>
    setForm((prev) => ({ ...prev, requiredSkills: prev.requiredSkills.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onCreate({ ...form, title: form.title.trim(), description: form.description.trim() });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div className="card card-padded" style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-heading)' }}>Create a Project / Team</h2>
          <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm"><X size={16} /></button>
        </div>

        {error && <div className="toast toast-error" style={{ marginBottom: '1rem' }}><AlertCircle size={14} /> {error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Project title</label>
            <input
              id="project-title-input"
              className="form-input"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Fullstack Open Study Group"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Type</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {[
                { type: 'study_project', label: 'Study Project', icon: Briefcase },
                { type: 'hackathon_team', label: 'Hackathon Team', icon: Zap },
              ].map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, type }))}
                  style={{
                    flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-lg)',
                    border: form.type === type ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                    background: form.type === type ? 'var(--color-primary-light)' : 'white',
                    color: form.type === type ? 'var(--color-primary)' : 'var(--color-body)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                  }}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description <span style={{ color: 'var(--color-muted)', fontWeight: 400 }}>(optional)</span></label>
            <textarea
              className="form-input"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="What are the goals of this team or project?"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Required skills</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                className="form-input"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                placeholder="e.g. React, Node.js"
                style={{ flex: 1 }}
              />
              <button type="button" onClick={addSkill} className="btn btn-secondary btn-sm">Add</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {form.requiredSkills.map((s, i) => (
                <span key={i} className="chip">
                  {s}
                  <button type="button" onClick={() => removeSkill(i)} className="chip-remove"><X size={12} /></button>
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Project Card ─────────────────────────────────────────────────────────────
const ProjectCard = ({ project, isMine, onJoin }) => {
  const isHackathon = project.type === 'hackathon_team';
  return (
    <div className="card card-padded" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'box-shadow 0.2s, transform 0.15s' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.06)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.transform = '';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.2rem 0.625rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
            background: isHackathon ? '#FEF3C7' : 'var(--color-primary-light)',
            color: isHackathon ? '#D97706' : 'var(--color-primary)',
            marginBottom: '0.5rem',
          }}>
            {isHackathon ? <Zap size={11} /> : <Briefcase size={11} />}
            {isHackathon ? 'Hackathon Team' : 'Study Project'}
          </span>
          <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-heading)', margin: 0, lineHeight: 1.3 }}>
            {project.title}
          </h3>
        </div>
      </div>

      {project.description && (
        <p style={{ fontSize: '0.875rem', color: 'var(--color-body)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {project.description}
        </p>
      )}

      {project.requiredSkills?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {project.requiredSkills.map((s, i) => (
            <span key={i} className="chip chip-gray" style={{ fontSize: '0.75rem' }}>{s}</span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border-sub)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
          <Users size={14} /> {project.members?.length || 1} member{(project.members?.length || 1) !== 1 ? 's' : ''}
        </div>

        {isMine ? (
          <Link to={`/projects/${project._id}`} className="btn btn-secondary btn-sm">
            Open Board →
          </Link>
        ) : (
          <button onClick={() => onJoin(project._id)} className="btn btn-primary btn-sm">
            Join Team
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const Projects = () => {
  const { projects, myProjects, isLoading, fetchProjects, fetchMyProjects, createProject, joinProject, error } = useProjectStore();
  const [tab, setTab] = useState('browse');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchMyProjects();
  }, [fetchProjects, fetchMyProjects]);

  const myProjectIds = new Set(myProjects.map((p) => p._id));

  const handleCreate = async (data) => {
    const p = await createProject(data);
    setShowCreate(false);
    return p;
  };

  const handleJoin = async (id) => {
    await joinProject(id);
    fetchMyProjects();
  };

  return (
    <DashboardLayout>
      {/* ── Page Header ──────────────────────────────────────── */}
      <PageHeader
        title="Projects & Teams"
        subtitle="Form teams, collaborate on study projects, and prepare for hackathons."
        action={
          <button id="create-project-btn" onClick={() => setShowCreate(true)} className="btn btn-primary">
            <Plus size={16} /> New project
          </button>
        }
      />

      {error && <div className="toast toast-error" style={{ marginBottom: '1.5rem' }}><AlertCircle size={14} /> {error}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--color-border-sub)', marginBottom: '1.5rem', gap: '0.25rem' }}>
        {[['browse', 'Browse Projects'], ['mine', 'My Projects']].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '0.625rem 1.25rem', fontWeight: 600, fontSize: '0.9rem',
            color: tab === t ? 'var(--color-primary)' : 'var(--color-muted)',
            borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent',
            background: 'transparent', cursor: 'pointer', border: 'none',
            marginBottom: '-2px',
          }}>
            {label}
            <span style={{ marginLeft: '0.5rem', padding: '0.125rem 0.5rem', borderRadius: '9999px', background: tab === t ? 'var(--color-primary-light)' : 'var(--color-border-sub)', color: tab === t ? 'var(--color-primary)' : 'var(--color-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
              {t === 'browse' ? projects.length : myProjects.length}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card skeleton" style={{ height: '220px' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {(tab === 'browse' ? projects : myProjects).length === 0 ? (
            <div style={{ gridColumn: '1/-1' }}>
              <EmptyState
                icon={FolderKanban}
                title={tab === 'browse' ? 'No open projects yet' : "You haven't joined any projects"}
                description={tab === 'browse' ? 'Be the first to create a team and invite your peers to build together!' : 'Explore open projects or start your own collaborative workspace.'}
                actionLabel={tab === 'browse' ? 'Create Project' : 'Browse Projects'}
                onAction={tab === 'browse' ? () => setShowCreate(true) : () => setTab('browse')}
              />
            </div>
          ) : (
            (tab === 'browse' ? projects : myProjects).map((project) => (
              <ProjectCard key={project._id} project={project} isMine={myProjectIds.has(project._id)} onJoin={handleJoin} />
            ))
          )}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </DashboardLayout>
  );
};

export default Projects;
