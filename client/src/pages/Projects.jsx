import { useState, useEffect } from 'react';
import { Plus, X, Users, Briefcase, Zap, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import useProjectStore from '../store/projectStore';
import useAuthStore from '../store/authStore';

const getInitials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

// ─── Create Project Modal ─────────────────────────────────────────────────────
const CreateProjectModal = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({ title: '', description: '', type: 'study_project', requiredSkills: [] });
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s || form.requiredSkills.includes(s)) return;
    setForm((f) => ({ ...f, requiredSkills: [...f.requiredSkills, s] }));
    setSkillInput('');
  };
  const removeSkill = (i) => setForm((f) => ({ ...f, requiredSkills: f.requiredSkills.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    setLoading(true);
    setError('');
    try {
      const p = await onCreate(form);
      onClose(p);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-heading)' }}>Create project</h2>
          <button onClick={() => onClose()} className="btn btn-ghost btn-icon btn-sm"><X size={16} /></button>
        </div>
        {error && <div className="toast toast-error" style={{ marginBottom: '1rem' }}><AlertCircle size={14} />{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Project name" autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What are you building?" style={{ resize: 'vertical' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-input form-select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="study_project">Study Project</option>
              <option value="hackathon_team">Hackathon Team</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Required skills</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.5rem' }}>
              {form.requiredSkills.map((s, i) => (
                <span key={i} className="chip"><span>{s}</span><button type="button" className="chip-remove" onClick={() => removeSkill(i)}><X size={11} /></button></span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input className="form-input" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} placeholder="Add a skill…" style={{ flex: 1, fontSize: '0.875rem' }} />
              <button type="button" onClick={addSkill} className="btn btn-secondary btn-sm"><Plus size={14} /> Add</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => onClose()} className="btn btn-outline btn-sm">Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>{loading ? 'Creating…' : 'Create project'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Project Card ─────────────────────────────────────────────────────────────
const ProjectCard = ({ project, isMine, onJoin }) => {
  const TypeIcon = project.type === 'hackathon_team' ? Zap : Briefcase;
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    setJoining(true);
    try { await onJoin(project._id); } finally { setJoining(false); }
  };

  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'box-shadow 0.2s' }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '')}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
            <TypeIcon size={15} color="var(--color-primary)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, textTransform: 'capitalize' }}>
              {project.type === 'hackathon_team' ? 'Hackathon team' : 'Study project'}
            </span>
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-heading)', marginBottom: '0.375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {project.title}
          </h3>
          {project.description && (
            <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {project.description}
            </p>
          )}
        </div>
        <span style={{ padding: '0.2rem 0.625rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, background: '#F0FDF4', color: '#15803D', flexShrink: 0 }}>
          {project.status}
        </span>
      </div>
      {(project.requiredSkills || []).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {project.requiredSkills.slice(0, 4).map((s, i) => (
            <span key={i} className="chip chip-gray" style={{ fontSize: '0.75rem' }}>{s}</span>
          ))}
          {project.requiredSkills.length > 4 && <span className="chip chip-gray" style={{ fontSize: '0.75rem' }}>+{project.requiredSkills.length - 4}</span>}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-muted)', fontSize: '0.8rem' }}>
          <Users size={13} />
          <span>{project.members?.length} member{project.members?.length !== 1 ? 's' : ''}</span>
        </div>
        {isMine ? (
          <Link to={`/projects/${project._id}`} className="btn btn-secondary btn-sm" id={`project-view-${project._id}`}>View</Link>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={`/projects/${project._id}`} className="btn btn-outline btn-sm">Details</Link>
            <button onClick={handleJoin} disabled={joining} className="btn btn-primary btn-sm" id={`project-join-${project._id}`}>
              {joining ? 'Joining…' : 'Join'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const Projects = () => {
  const { user } = useAuthStore();
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-heading)' }}>Projects</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
            Form teams, build projects, and collaborate.
          </p>
        </div>
        <button id="create-project-btn" onClick={() => setShowCreate(true)} className="btn btn-primary">
          <Plus size={16} /> New project
        </button>
      </div>

      {error && <div className="toast toast-error" style={{ marginBottom: '1.25rem' }}><AlertCircle size={14} /> {error}</div>}

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card skeleton" style={{ height: '220px' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {(tab === 'browse' ? projects : myProjects).length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 2rem', color: 'var(--color-muted)' }}>
              {tab === 'browse' ? 'No open projects yet. Be the first to create one!' : "You haven't joined any projects yet."}
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
