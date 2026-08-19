import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Map,
  ArrowRight,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
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
    generateRoadmap,
    removeRoadmap,
    clearError,
  } = useRoadmapStore();

  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('beginner');

  useEffect(() => {
    fetchRoadmaps();
  }, [fetchRoadmaps]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    clearError();
    try {
      await generateRoadmap({ topic: topic.trim(), level });
      setTopic('');
    } catch {
      // Error state handled in store
    }
  };

  return (
    <DashboardLayout>
      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-heading)' }}>
          AI Learning Roadmaps
        </h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
          Generate customized, step-by-step career & skill progression plans.
        </p>
      </div>

      {error && (
        <div className="toast toast-error" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* ── Generate Generator Card ─────────────────────────── */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
          <div
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={18} color="var(--color-primary)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--color-heading)' }}>
              Generate a New Roadmap
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
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
                <Loader2 size={16} className="animate-spin" /> Generating your roadmap...
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {[1, 2, 3].map((n) => (
              <div key={n} className="card skeleton" style={{ height: '180px' }} />
            ))}
          </div>
        ) : roadmaps.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: '50%',
                background: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Map size={24} color="var(--color-primary)" />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-heading)' }}>
              No roadmaps generated yet
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', maxWidth: '360px' }}>
              Create your first customized learning roadmap above to track your skill development.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {roadmaps.map((r) => {
              const levelStyle = LEVEL_COLORS[r.level] || LEVEL_COLORS.beginner;
              return (
                <div
                  key={r._id}
                  className="card"
                  style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1.25rem',
                    transition: 'box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '')}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.625rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                          background: levelStyle.bg,
                          color: levelStyle.text,
                        }}
                      >
                        {r.level}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeRoadmap(r._id)}
                        className="btn btn-ghost btn-icon btn-sm"
                        style={{ opacity: 0.6 }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.6)}
                        title="Delete roadmap"
                      >
                        <Trash2 size={15} color="var(--color-error)" />
                      </button>
                    </div>

                    <h3
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 700,
                        color: 'var(--color-heading)',
                        marginBottom: '0.375rem',
                        textTransform: 'capitalize',
                      }}
                    >
                      {r.topic}
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
                      {r.completedSteps} of {r.totalSteps} steps completed
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '0.375rem' }}>
                      <span>Progress</span>
                      <span>{r.progressPercent}%</span>
                    </div>
                    <div
                      style={{
                        height: '6px',
                        borderRadius: '9999px',
                        background: 'var(--color-border-sub)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${r.progressPercent}%`,
                          background: r.progressPercent === 100 ? 'var(--color-success)' : 'var(--color-primary)',
                          borderRadius: '9999px',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>

                  {/* View Action Link */}
                  <Link
                    to={`/roadmap/${r._id}`}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    View Roadmap <ArrowRight size={14} />
                  </Link>
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
