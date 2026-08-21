import { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  Loader2,
  FileCheck,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import useAssessmentStore from '../store/assessmentStore';
import useUserStore from '../store/userStore';

const DIFFICULTY_COLORS = {
  beginner: { bg: '#EFF6FF', text: '#2563EB' },
  intermediate: { bg: '#FEF3C7', text: '#D97706' },
  advanced: { bg: '#F3E8FF', text: '#7E22CE' },
};

const Assessments = () => {
  const {
    currentAssessment,
    attemptResult,
    history,
    isLoading,
    isGenerating,
    isSubmitting,
    error,
    generateAssessment,
    submitAssessment,
    fetchHistory,
    resetAssessment,
    clearError,
  } = useAssessmentStore();

  const { fetchProfile } = useUserStore();

  const [tab, setTab] = useState('take'); // 'take' | 'history'
  const [skillName, setSkillName] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [qIndex]: optionIndex }

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleStart = async (e) => {
    e.preventDefault();
    if (!skillName.trim()) return;
    clearError();
    setSelectedAnswers({});
    try {
      await generateAssessment({ skillName: skillName.trim(), difficulty });
    } catch {
      // Handled in store
    }
  };

  const handleOptionSelect = (qIndex, optionIndex) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qIndex]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!currentAssessment) return;
    clearError();

    const answersPayload = currentAssessment.questions.map((_, idx) => ({
      questionIndex: idx,
      selectedOptionIndex: selectedAnswers[idx] ?? -1,
    }));

    try {
      await submitAssessment(currentAssessment._id, answersPayload);
      fetchProfile(); // Refresh points/skills in userStore
    } catch {
      // Handled in store
    }
  };

  const allAnswered =
    currentAssessment &&
    currentAssessment.questions.every(
      (_, idx) => selectedAnswers[idx] !== undefined
    );

  return (
    <DashboardLayout>
      {/* ── Page Header ─────────────────────────────────────── */}
      <PageHeader
        title="Skill Assessments"
        subtitle="Test your technical proficiency, level up your profile, and earn points."
      />

      {error && (
        <div className="toast toast-error" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--color-border-sub)', marginBottom: '1.5rem', gap: '0.25rem' }}>
        {[
          ['take', 'Assessment Center'],
          ['history', `Past Attempts (${history.length})`],
        ].map(([t, label]) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              if (t === 'history') resetAssessment();
            }}
            style={{
              padding: '0.625rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: tab === t ? 'var(--color-primary)' : 'var(--color-muted)',
              borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
              border: 'none',
              marginBottom: '-2px',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'take' ? (
        attemptResult ? (
          /* ── Results View ──────────────────────────────────── */
          <div className="card card-padded" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <div
              style={{
                width: '4rem',
                height: '4rem',
                borderRadius: '50%',
                background: attemptResult.passed ? '#ECFDF5' : '#FEF2F2',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              {attemptResult.passed ? (
                <CheckCircle2 size={32} color="#10B981" />
              ) : (
                <XCircle size={32} color="#EF4444" />
              )}
            </div>

            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-heading)', marginBottom: '0.5rem' }}>
              {attemptResult.passed ? 'Assessment Passed! 🎉' : 'Keep Practicing!'}
            </h2>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
              You scored {attemptResult.score} out of {attemptResult.totalQuestions} questions ({attemptResult.percentage}%)
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                background: 'var(--color-page-bg)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-xl)',
                marginBottom: '1.5rem',
                textAlign: 'left',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600 }}>POINTS EARNED</span>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  +{attemptResult.pointsEarned} pts
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600 }}>SKILL LEVEL</span>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-heading)', textTransform: 'capitalize' }}>
                  {attemptResult.skillLevelUpdated
                    ? `Upgraded to ${attemptResult.newLevel}!`
                    : 'Unchanged'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={resetAssessment}
                className="btn btn-primary"
              >
                <RotateCcw size={15} /> Take Another Assessment
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAssessment();
                  setTab('history');
                }}
                className="btn btn-outline"
              >
                View History
              </button>
            </div>
          </div>
        ) : currentAssessment ? (
          /* ── Quiz Question Interface ───────────────────────── */
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <div className="card card-padded" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span
                  style={{
                    padding: '0.2rem 0.625rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    background: DIFFICULTY_COLORS[currentAssessment.difficulty]?.bg,
                    color: DIFFICULTY_COLORS[currentAssessment.difficulty]?.text,
                  }}
                >
                  {currentAssessment.difficulty}
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-heading)', marginTop: '0.375rem', textTransform: 'capitalize' }}>
                  {currentAssessment.skillName} Assessment
                </h2>
              </div>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)', fontWeight: 500 }}>
                {Object.keys(selectedAnswers).length} of {currentAssessment.questions.length} answered
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {currentAssessment.questions.map((q, qIdx) => (
                <div key={q._id || qIdx} className="card card-padded">
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                    <span
                      style={{
                        width: '1.75rem',
                        height: '1.75rem',
                        borderRadius: '50%',
                        background: selectedAnswers[qIdx] !== undefined ? 'var(--color-primary)' : 'var(--color-border-sub)',
                        color: selectedAnswers[qIdx] !== undefined ? 'white' : 'var(--color-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {qIdx + 1}
                    </span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-heading)', lineHeight: 1.5 }}>
                      {q.questionText}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', paddingLeft: '2.5rem' }}>
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedAnswers[qIdx] === optIdx;
                      return (
                        <label
                          key={optIdx}
                          onClick={() => handleOptionSelect(qIdx, optIdx)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-lg)',
                            border: isSelected ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                            background: isSelected ? 'var(--color-primary-light)' : 'white',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <input
                            type="radio"
                            name={`question-${qIdx}`}
                            checked={isSelected}
                            onChange={() => handleOptionSelect(qIdx, optIdx)}
                            style={{ accentColor: 'var(--color-primary)' }}
                          />
                          <span style={{ fontSize: '0.9rem', color: isSelected ? 'var(--color-heading)' : 'var(--color-body)', fontWeight: isSelected ? 500 : 400 }}>
                            {opt}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', marginBottom: '2rem' }}>
                <button
                  type="button"
                  onClick={resetAssessment}
                  className="btn btn-outline"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  id="submit-quiz-btn"
                  type="button"
                  onClick={handleSubmitQuiz}
                  className="btn btn-primary btn-lg"
                  disabled={isSubmitting || !allAnswered}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Scoring...
                    </>
                  ) : (
                    'Submit Assessment'
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Start Assessment Card ─────────────────────────── */
          <div className="card" style={{ padding: '1.75rem', maxWidth: '600px', margin: '0 auto' }}>
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
                }}
              >
                <Sparkles size={20} color="var(--color-primary)" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-heading)' }}>
                  Start a Skill Assessment
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
                  5 AI-generated multiple choice questions to validate your abilities.
                </p>
              </div>
            </div>

            <form onSubmit={handleStart} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Skill or Technology</label>
                <input
                  id="assessment-skill-input"
                  type="text"
                  className="form-input"
                  placeholder="e.g. JavaScript, Python, Docker, SQL..."
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  disabled={isGenerating}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Difficulty</label>
                <select
                  id="assessment-difficulty-select"
                  className="form-input form-select"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  disabled={isGenerating}
                >
                  <option value="beginner">Beginner (Foundations & Core syntax)</option>
                  <option value="intermediate">Intermediate (Patterns & Practical problem solving)</option>
                  <option value="advanced">Advanced (Architecture, Concurrency & Optimization)</option>
                </select>
              </div>

              <div
                style={{
                  background: 'var(--color-page-bg)',
                  padding: '0.875rem 1rem',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '0.8125rem',
                  color: 'var(--color-muted)',
                  lineHeight: 1.5,
                }}
              >
                💡 Passing score is <strong>60%</strong> (+10 pts). Scoring <strong>80%+</strong> upgrades your profile skill level automatically!
              </div>

              <button
                id="assessment-start-btn"
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={isGenerating || !skillName.trim()}
                style={{ justifyContent: 'center', marginTop: '0.25rem' }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Generating Assessment...
                  </>
                ) : (
                  <>
                    Start Assessment <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        )
      ) : (
        /* ── History View ────────────────────────────────────── */
        <div>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[1, 2, 3].map((n) => (
                <div key={n} className="card skeleton" style={{ height: '80px' }} />
              ))}
            </div>
          ) : history.length === 0 ? (
            <EmptyState
              icon={FileCheck}
              title="No assessment attempts yet"
              description="Take your first skill quiz to establish your verified skill proficiency on your profile."
              actionLabel="Take Assessment"
              onAction={() => setTab('take')}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {history.map((att) => {
                const diffStyle =
                  DIFFICULTY_COLORS[att.difficulty] ||
                  DIFFICULTY_COLORS.beginner;
                return (
                  <div
                    key={att._id}
                    className="card"
                    style={{
                      padding: '1.25rem 1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div
                        style={{
                          width: '2.5rem',
                          height: '2.5rem',
                          borderRadius: '50%',
                          background: att.passed ? '#ECFDF5' : '#FEF2F2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {att.passed ? (
                          <CheckCircle2 size={18} color="#10B981" />
                        ) : (
                          <XCircle size={18} color="#EF4444" />
                        )}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-heading)', textTransform: 'capitalize' }}>
                            {att.skillName}
                          </h3>
                          <span
                            style={{
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              textTransform: 'capitalize',
                              background: diffStyle.bg,
                              color: diffStyle.text,
                            }}
                          >
                            {att.difficulty}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                          Completed on {new Date(att.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-heading)' }}>
                          {att.score}/{att.totalQuestions} ({att.percentage}%)
                        </div>
                        <div style={{ fontSize: '0.75rem', color: att.passed ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 600 }}>
                          {att.passed ? `Passed (+${att.pointsEarned} pts)` : 'Failed'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Assessments;
