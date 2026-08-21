import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Map,
  ArrowRight,
  Trash2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import useRoadmapStore from '../store/roadmapStore';

const LEVEL_COLORS = {
  beginner: { bg: '#EFF6FF', text: '#2563EB' },
  intermediate: { bg: '#FEF3C7', text: '#D97706' },
  advanced: { bg: '#F3E8FF', text: '#7E22CE' },
};

const Roadmap = () => {
  const {
    roadmaps,
    isLoading,
    isGenerating,
    error,
    fetchRoadmaps,
    createRoadmap,
    deleteRoadmap,
  } = useRoadmapStore();

  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('beginner');

  useEffect(() => {
    fetchRoadmaps();
  }, [fetchRoadmaps]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    try {
      await createRoadmap(topic.trim(), level);
      setTopic('');
    } catch {
      // Error handled by store
    }
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this roadmap?')) {
      await deleteRoadmap(id);
    }
  };

  return (
    <DashboardLayout>
      {/* ── Page Header ──────────────────────────────────────── */}
      <PageHeader
        title="AI Learning Roadmaps"
        subtitle="Generate customized, step-by-step career & skill progression plans."
      />

      {error && (
        <div className="toast toast-error" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* ── Generate Generator Card ─────────────────────────── */}
      <div className="card card-padded" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)',
              flexShrink: 0,
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--color-heading)', margin: 0 }}>
              Generate a New Roadmap
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', margin: '0.125rem 0 0' }}>
              Enter any skill or technology to receive an AI-crafted learning curriculum.
            </p>
          </div>
        </div>

        <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            id="roadmap-topic-input"
            type="text"
            className="form-input"
            style={{ flex: '1 1 280px' }}
            placeholder="e.g. Next.js & TypeScript, Kubernetes, Machine Learning..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isGenerating}
          />
          <select
            id="roadmap-level-select"
            className="form-input form-select"
            style={{ width: '160px' }}
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            disabled={isGenerating}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <button
            id="roadmap-generate-btn"
            type="submit"
            className="btn btn-primary"
            disabled={isGenerating || !topic.trim()}
            style={{ minWidth: '180px' }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="spin" /> Generating roadmap...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Generate Roadmap
              </>
            )}
          </button>
        </form>
      </div>

      {/* ── Roadmaps Grid ───────────────────────────────────── */}
      <div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-heading)', marginBottom: '1rem' }}>
          Your Roadmaps ({roadmaps.length})
        </h2>

        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {[1, 2, 3].map((n) => (
              <div key={n} className="card skeleton" style={{ height: '180px' }} />
            ))}
          </div>
        ) : roadmaps.length === 0 ? (
          <EmptyState
            icon={Map}
            title="No roadmaps generated yet"
            description="Create your first customized learning roadmap above to track your skill milestones and progress."
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {roadmaps.map((r) => {
              const levelStyle = LEVEL_COLORS[r.level] || LEVEL_COLORS.beginner;
              return (
                <div
                  key={r._id}
                  className="card card-padded"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1.25rem',
                    transition: 'box-shadow 0.2s, transform 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.06)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '';
                    e.currentTarget.style.transform = '';
                  }}
                >
                  {/* Card top */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.625rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: levelStyle.bg,
                          color: levelStyle.text,
                          textTransform: 'capitalize',
                        }}
                      >
                        {r.level}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, r._id)}
                        className="btn btn-ghost btn-icon btn-sm"
                        style={{ color: 'var(--color-muted)' }}
                        title="Delete roadmap"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <h3
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 700,
                        color: 'var(--color-heading)',
                        lineHeight: 1.3,
                        marginBottom: '0.5rem',
                      }}
                    >
                      {r.topic}
                    </h3>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--color-muted)', marginBottom: '0.375rem' }}>
                      <span>Progress</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-heading)' }}>
                        {r.progressPercent || 0}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: '6px',
                        background: 'var(--color-border-sub)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${r.progressPercent || 0}%`,
                          background: (r.progressPercent || 0) === 100 ? '#10B981' : 'var(--color-primary)',
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border-sub)' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
                        {r.completedSteps || 0} of {r.totalSteps || 0} steps
                      </span>
                      <Link
                        to={`/roadmap/${r._id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
                      >
                        View Plan <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Roadmap;
