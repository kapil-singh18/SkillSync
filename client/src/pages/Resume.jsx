import { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FolderKanban,
  BarChart3,
  X,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import useResumeStore from '../store/resumeStore';

const LEVEL_COLORS = {
  beginner: { bg: '#ECFDF5', color: '#059669', label: 'Beginner' },
  intermediate: { bg: '#EFF6FF', color: '#2563EB', label: 'Intermediate' },
  advanced: { bg: '#FEF3C7', color: '#D97706', label: 'Advanced' },
};

const PRIORITY_COLORS = {
  high: { bg: '#FEE2E2', color: '#DC2626' },
  medium: { bg: '#FEF3C7', color: '#D97706' },
  low: { bg: '#F3F4F6', color: '#6B7280' },
};

const Resume = () => {
  const { analysis, isAnalyzing, error, analyzeResume, clearAnalysis } = useResumeStore();
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File must be under 5 MB');
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      await analyzeResume(selectedFile);
    } catch (err) {
      console.error(err);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    clearAnalysis();
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <DashboardLayout>
      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-heading)' }}>
          Resume Analyzer
        </h1>
        <p style={{ color: 'var(--color-muted)', marginTop: '0.25rem', fontSize: '0.9375rem' }}>
          Upload your resume for AI-powered skill analysis and project recommendations.
        </p>
      </div>

      {/* ── Upload Section ──────────────────────────────────── */}
      {!analysis && (
        <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-xl)',
              padding: '3rem 2rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? 'var(--color-primary-light)' : 'var(--color-page-bg)',
              transition: 'all 0.2s',
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              onChange={(e) => handleFile(e.target.files[0])}
              style={{ display: 'none' }}
              id="resume-file-input"
            />
            <Upload size={32} color={dragOver ? 'var(--color-primary)' : 'var(--color-muted)'} style={{ margin: '0 auto 0.75rem' }} />
            <div style={{ fontWeight: 600, color: 'var(--color-heading)', marginBottom: '0.375rem' }}>
              {selectedFile ? selectedFile.name : 'Drop your PDF resume here'}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
              {selectedFile
                ? `${(selectedFile.size / 1024).toFixed(1)} KB — Click to change`
                : 'or click to browse (PDF, max 5 MB)'}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.25rem' }}>
            <button
              id="resume-analyze-btn"
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={!selectedFile || isAnalyzing}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.625rem 1.5rem' }}
            >
              {isAnalyzing ? <Loader2 size={16} className="spin" /> : <BarChart3 size={16} />}
              {isAnalyzing ? 'Analyzing…' : 'Analyze Resume'}
            </button>
            {selectedFile && !isAnalyzing && (
              <button
                className="btn"
                onClick={reset}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.625rem 1rem', background: 'var(--color-card)',
                  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)',
                  cursor: 'pointer', color: 'var(--color-muted)', fontSize: '0.875rem',
                }}
              >
                <X size={14} /> Clear
              </button>
            )}
          </div>

          {error && (
            <div style={{ marginTop: '1rem', color: '#DC2626', fontSize: '0.875rem', textAlign: 'center' }}>
              {error}
            </div>
          )}
        </div>
      )}

      {/* ── Analysis Results ────────────────────────────────── */}
      {analysis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Overall assessment */}
          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="var(--color-primary)" /> Overall Assessment
              </h2>
              <button
                onClick={reset}
                className="btn btn-sm"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.25rem',
                  background: 'var(--color-card)', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)', cursor: 'pointer', color: 'var(--color-muted)',
                  padding: '0.375rem 0.75rem', fontSize: '0.75rem',
                }}
              >
                <Upload size={12} /> New upload
              </button>
            </div>
            <p style={{ color: 'var(--color-body)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
              {analysis.overallAssessment}
            </p>
          </div>

          {/* Identified Skills */}
          {analysis.identifiedSkills?.length > 0 && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-heading)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} color="#059669" /> Identified Skills
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {analysis.identifiedSkills.map((skill, i) => {
                  const lvl = LEVEL_COLORS[skill.level] || LEVEL_COLORS.beginner;
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                        padding: '0.375rem 0.75rem', borderRadius: '9999px',
                        background: lvl.bg, border: `1px solid ${lvl.color}22`,
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: lvl.color }}>
                        {skill.name}
                      </span>
                      <span style={{ fontSize: '0.625rem', color: lvl.color, opacity: 0.7 }}>
                        {lvl.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Skill Gaps */}
          {analysis.skillGaps?.length > 0 && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-heading)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} color="#D97706" /> Skill Gaps
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {analysis.skillGaps.map((gap, i) => {
                  const pri = PRIORITY_COLORS[gap.priority] || PRIORITY_COLORS.medium;
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                        padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)',
                        background: 'var(--color-page-bg)',
                      }}
                    >
                      <span
                        style={{
                          padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.625rem',
                          fontWeight: 600, background: pri.bg, color: pri.color, flexShrink: 0,
                          marginTop: '0.125rem',
                        }}
                      >
                        {gap.priority}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                          {gap.skill}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '0.125rem' }}>
                          {gap.reason}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Project Recommendations */}
          {analysis.projectRecommendations?.length > 0 && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-heading)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FolderKanban size={18} color="var(--color-primary)" /> Recommended Projects
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
                {analysis.projectRecommendations.map((proj, i) => {
                  const diff = LEVEL_COLORS[proj.difficulty] || LEVEL_COLORS.beginner;
                  return (
                    <div
                      key={i}
                      style={{
                        padding: '1.25rem', borderRadius: 'var(--radius-xl)',
                        border: '1px solid var(--color-border)', background: 'var(--color-page-bg)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-heading)' }}>
                          {proj.title}
                        </div>
                        <span
                          style={{
                            padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.625rem',
                            fontWeight: 600, background: diff.bg, color: diff.color, flexShrink: 0,
                          }}
                        >
                          {diff.label}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', lineHeight: 1.5, marginBottom: '0.625rem' }}>
                        {proj.description}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {proj.skills?.map((s) => (
                          <span
                            key={s}
                            style={{
                              padding: '0.125rem 0.4rem', borderRadius: '9999px', fontSize: '0.625rem',
                              fontWeight: 500, background: 'var(--color-primary-light)',
                              color: 'var(--color-primary)',
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Career Suggestions */}
          {analysis.careerSuggestions?.length > 0 && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-heading)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lightbulb size={18} color="#D97706" /> Career Suggestions
              </h2>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {analysis.careerSuggestions.map((s, i) => (
                  <li key={i} style={{ fontSize: '0.9375rem', color: 'var(--color-body)', lineHeight: 1.5 }}>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Resume;
