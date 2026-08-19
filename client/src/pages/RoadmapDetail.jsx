import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  BookOpen,
  CheckCircle2,
  Circle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import useRoadmapStore from '../store/roadmapStore';

const LEVEL_COLORS = {
  beginner: { bg: '#EFF6FF', text: '#2563EB' },
  intermediate: { bg: '#FEF3C7', text: '#D97706' },
  advanced: { bg: '#F3E8FF', text: '#7E22CE' },
};

const RoadmapDetail = () => {
  const { id } = useParams();
  const { activeRoadmap, isLoading, error, fetchRoadmapById, toggleStep } =
    useRoadmapStore();

  useEffect(() => {
    fetchRoadmapById(id);
  }, [id, fetchRoadmapById]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card skeleton" style={{ height: '140px' }} />
          <div className="card skeleton" style={{ height: '400px' }} />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !activeRoadmap) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-error)' }}>
          <AlertCircle size={18} /> {error || 'Roadmap not found'}
        </div>
      </DashboardLayout>
    );
  }

  const levelStyle =
    LEVEL_COLORS[activeRoadmap.level] || LEVEL_COLORS.beginner;
  const isAllComplete = activeRoadmap.progressPercent === 100;

  return (
    <DashboardLayout>
      {/* ── Back button ──────────────────────────────────────── */}
      <Link
        to="/roadmap"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          color: 'var(--color-muted)',
          fontSize: '0.875rem',
          marginBottom: '1.25rem',
          textDecoration: 'none',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-heading)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}
      >
        <ArrowLeft size={15} /> Back to all roadmaps
      </Link>

      {/* ── Roadmap Header Card ──────────────────────────────── */}
      <div className="card card-padded" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
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
                {activeRoadmap.level}
              </span>
              {isAllComplete && (
                <span
                  style={{
                    padding: '0.2rem 0.625rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: '#ECFDF5',
                    color: '#065F46',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <CheckCircle2 size={13} /> Completed
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-heading)', textTransform: 'capitalize' }}>
              {activeRoadmap.topic} Roadmap
            </h1>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {activeRoadmap.completedSteps} of {activeRoadmap.totalSteps} steps completed ({activeRoadmap.progressPercent}%)
            </p>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              fontWeight: 700,
              fontSize: '1rem',
            }}
          >
            {activeRoadmap.progressPercent}%
          </div>
        </div>

        {/* Big Progress Bar */}
        <div
          style={{
            height: '8px',
            borderRadius: '9999px',
            background: 'var(--color-border-sub)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${activeRoadmap.progressPercent}%`,
              background: isAllComplete ? 'var(--color-success)' : 'var(--color-primary)',
              borderRadius: '9999px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* ── Vertical Timeline Stepper ────────────────────────── */}
      <div style={{ position: 'relative', paddingLeft: '1rem' }}>
        {/* Connecting Vertical Line */}
        <div
          style={{
            position: 'absolute',
            top: '2rem',
            bottom: '2rem',
            left: '2.375rem',
            width: '2px',
            background: 'var(--color-border)',
            zIndex: 1,
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', zIndex: 2 }}>
          {activeRoadmap.steps.map((step, idx) => {
            const isCompleted = step.completed;
            return (
              <div key={step._id || idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                {/* Step Indicator Node */}
                <button
                  type="button"
                  onClick={() => toggleStep(activeRoadmap._id, step._id)}
                  style={{
                    width: '2.75rem',
                    height: '2.75rem',
                    borderRadius: '50%',
                    background: isCompleted ? 'var(--color-primary)' : 'white',
                    border: isCompleted ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                    color: isCompleted ? 'white' : 'var(--color-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  }}
                  title={isCompleted ? 'Mark step incomplete' : 'Mark step complete'}
                >
                  {isCompleted ? <CheckCircle2 size={18} /> : <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{idx + 1}</span>}
                </button>

                {/* Step Content Card */}
                <div
                  className="card"
                  style={{
                    flex: 1,
                    padding: '1.5rem',
                    borderLeft: isCompleted ? '4px solid var(--color-primary)' : '1px solid var(--color-border-sub)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.625rem' }}>
                    <h3
                      style={{
                        fontSize: '1.0625rem',
                        fontWeight: 700,
                        color: isCompleted ? 'var(--color-heading)' : 'var(--color-heading)',
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        opacity: isCompleted ? 0.8 : 1,
                      }}
                    >
                      {step.title}
                    </h3>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: 'var(--color-muted)',
                        background: 'var(--color-page-bg)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <Clock size={13} /> {step.estimatedTime}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.9rem', color: 'var(--color-body)', lineHeight: 1.6, marginBottom: '1rem' }}>
                    {step.description}
                  </p>

                  {/* Resources */}
                  {step.resources && step.resources.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--color-border-sub)', paddingTop: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '0.5rem' }}>
                        <BookOpen size={13} /> Recommended Resources:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                        {step.resources.map((res, i) => (
                          <span key={i} className="chip chip-gray" style={{ fontSize: '0.75rem' }}>
                            {res}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RoadmapDetail;
