import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, X, AlertCircle, Users } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import useProjectStore from '../store/projectStore';
import useAuthStore from '../store/authStore';

const getInitials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

const STATUSES = ['todo', 'in_progress', 'done'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const STATUS_COLORS = {
  todo: { bg: '#F3F4F6', text: '#374151' },
  in_progress: { bg: '#EFF6FF', text: '#2563EB' },
  done: { bg: '#F0FDF4', text: '#15803D' },
};

// ─── Add Task Modal ───────────────────────────────────────────────────────────
const AddTaskModal = ({ projectId, members, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onCreate({ projectId, title: title.trim(), description: description.trim(), assignedTo: assignedTo || undefined });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-heading)' }}>Add task</h2>
          <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Description <span style={{ color: 'var(--color-muted)', fontWeight: 400 }}>(optional)</span></label>
            <textarea className="form-input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add details…" style={{ resize: 'vertical' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Assign to</label>
            <select className="form-input form-select" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading || !title.trim()}>{loading ? 'Adding…' : 'Add task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Task Card ────────────────────────────────────────────────────────────────
const TaskCard = ({ task, onUpdate, onDelete }) => {
  const [status, setStatus] = useState(task.status);

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    await onUpdate(task._id, { status: newStatus });
  };

  return (
    <div className="card" style={{
      padding: '1rem', marginBottom: '0.625rem',
      border: '1px solid var(--color-border-sub)',
      transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, color: 'var(--color-heading)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
            {task.title}
          </p>
          {task.description && (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', lineHeight: 1.4, marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {task.description}
            </p>
          )}
        </div>
        <button onClick={() => onDelete(task._id)} className="btn btn-ghost btn-icon btn-sm" title="Delete task" style={{ flexShrink: 0, opacity: 0.5 }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.5)}>
          <X size={13} />
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        {task.assignedTo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <div className="avatar avatar-sm" style={{ width: '1.5rem', height: '1.5rem', fontSize: '0.6rem' }}>
              {getInitials(task.assignedTo.name)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{task.assignedTo.name}</span>
          </div>
        )}
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          style={{
            padding: '0.2rem 0.5rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 600,
            border: 'none', cursor: 'pointer', outline: 'none', appearance: 'none',
            background: STATUS_COLORS[status].bg, color: STATUS_COLORS[status].text,
          }}
        >
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>
    </div>
  );
};

// ─── Task Column ──────────────────────────────────────────────────────────────
const TaskColumn = ({ status, tasks, members, onUpdate, onDelete }) => (
  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
      <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-heading)' }}>
        {STATUS_LABELS[status]}
      </h3>
      <span style={{
        padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
        background: STATUS_COLORS[status].bg, color: STATUS_COLORS[status].text,
      }}>
        {tasks.length}
      </span>
    </div>
    <div style={{ background: 'var(--color-page-bg)', borderRadius: 'var(--radius-xl)', padding: '0.75rem', flex: 1, minHeight: '120px' }}>
      {tasks.length === 0
        ? <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', textAlign: 'center', paddingTop: '1rem' }}>No tasks</p>
        : tasks.map((t) => <TaskCard key={t._id} task={t} members={members} onUpdate={onUpdate} onDelete={onDelete} />)
      }
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { activeProject, tasks, isLoading, error, fetchProjectById, createTask, updateTask, deleteTask } = useProjectStore();
  const [showAddTask, setShowAddTask] = useState(false);

  useEffect(() => {
    fetchProjectById(id);
  }, [id, fetchProjectById]);

  const isMember = activeProject?.members?.some((m) => m.user._id === user?._id);
  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="skeleton" style={{ height: '140px', borderRadius: 'var(--radius-2xl)' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
            {[1, 2, 3].map((n) => <div key={n} className="skeleton" style={{ height: '300px', borderRadius: 'var(--radius-2xl)' }} />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !activeProject) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-error)' }}>
          <AlertCircle size={18} />{error || 'Project not found'}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Back link */}
      <Link to="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-muted)', fontSize: '0.875rem', marginBottom: '1.25rem', textDecoration: 'none' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-heading)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}>
        <ArrowLeft size={15} /> Back to projects
      </Link>

      {/* Project header */}
      <div className="card card-padded" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
              <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-heading)' }}>{activeProject.title}</h1>
              <span style={{ padding: '0.2rem 0.625rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, background: '#F0FDF4', color: '#15803D' }}>{activeProject.status}</span>
            </div>
            {activeProject.description && <p style={{ color: 'var(--color-muted)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '0.875rem' }}>{activeProject.description}</p>}
            {(activeProject.requiredSkills || []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {activeProject.requiredSkills.map((s, i) => <span key={i} className="chip chip-gray" style={{ fontSize: '0.75rem' }}>{s}</span>)}
              </div>
            )}
          </div>
          {isMember && (
            <button id="add-task-btn" onClick={() => setShowAddTask(true)} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
              <Plus size={14} /> Add task
            </button>
          )}
        </div>

        {/* Members */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border-sub)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
            <Users size={14} color="var(--color-muted)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-heading)' }}>Members ({activeProject.members?.length})</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {activeProject.members?.map((m) => (
              <div key={m.user._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="avatar avatar-sm">{getInitials(m.user.name)}</div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-heading)', lineHeight: 1 }}>{m.user.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)', textTransform: 'capitalize' }}>{m.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {STATUSES.map((s) => (
          <TaskColumn
            key={s}
            status={s}
            tasks={tasksByStatus[s] || []}
            members={activeProject.members || []}
            onUpdate={updateTask}
            onDelete={deleteTask}
          />
        ))}
      </div>

      {showAddTask && (
        <AddTaskModal
          projectId={id}
          members={activeProject.members || []}
          onClose={() => setShowAddTask(false)}
          onCreate={createTask}
        />
      )}
    </DashboardLayout>
  );
};

export default ProjectDetail;
