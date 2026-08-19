import { useState, useEffect } from 'react';
import { Plus, X, CheckCircle, AlertCircle } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import useUserStore from '../store/userStore';
import useAuthStore from '../store/authStore';

// ─── Constants ─────────────────────────────────────────────────────────────────
const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = ['Morning (8am–12pm)', 'Afternoon (12pm–5pm)', 'Evening (5pm–9pm)', 'Night (9pm–12am)'];

// ─── Reusable sub-components ──────────────────────────────────────────────────

const SectionCard = ({ title, subtitle, children }) => (
  <div className="card" style={{ marginBottom: '1.25rem' }}>
    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border-sub)' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-heading)' }}>{title}</h2>
      {subtitle && <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '0.25rem' }}>{subtitle}</p>}
    </div>
    <div style={{ padding: '1.5rem' }}>{children}</div>
  </div>
);

const ChipTag = ({ label, onRemove }) => (
  <span className="chip">
    {label}
    <button type="button" className="chip-remove" onClick={onRemove} aria-label={`Remove ${label}`}>
      <X size={12} />
    </button>
  </span>
);

const AddChipInput = ({ placeholder, onAdd }) => {
  const [val, setVal] = useState('');

  const submit = () => {
    const trimmed = val.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setVal('');
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
      <input
        type="text"
        value={val}
        placeholder={placeholder}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
        className="form-input"
        style={{ flex: 1, fontSize: '0.875rem' }}
      />
      <button type="button" onClick={submit} className="btn btn-secondary btn-sm">
        <Plus size={15} /> Add
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Profile = () => {
  const { user } = useAuthStore();
  const { profile, fetchProfile, updateProfile, isLoading, isSaving, saveSuccess, error, clearError } = useUserStore();

  // Local form state
  const [bio, setBio] = useState('');
  const [role, setRole] = useState('student');
  const [skills, setSkills] = useState([]);
  const [interests, setInterests] = useState([]);
  const [learningGoals, setLearningGoals] = useState([]);
  const [availability, setAvailability] = useState([]);

  // Skill adder local state
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState('beginner');

  // Availability adder local state
  const [newDay, setNewDay] = useState('Monday');
  const [newTimeSlot, setNewTimeSlot] = useState(TIME_SLOTS[0]);

  // Seed form from fetched profile
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '');
      setRole(profile.role || 'student');
      setSkills(profile.skills || []);
      setInterests(profile.interests || []);
      setLearningGoals(profile.learningGoals || []);
      setAvailability(profile.availability || []);
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    await updateProfile({ bio, role, skills, interests, learningGoals, availability });
  };

  // ── Skills ────
  const addSkill = () => {
    const name = newSkillName.trim();
    if (!name) return;
    if (skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) return;
    setSkills((prev) => [...prev, { name, level: newSkillLevel }]);
    setNewSkillName('');
    setNewSkillLevel('beginner');
  };
  const removeSkill = (i) => setSkills((prev) => prev.filter((_, idx) => idx !== i));

  // ── Interests ──
  const addInterest = (val) => {
    if (interests.map((s) => s.toLowerCase()).includes(val.toLowerCase())) return;
    setInterests((prev) => [...prev, val]);
  };
  const removeInterest = (i) => setInterests((prev) => prev.filter((_, idx) => idx !== i));

  // ── Goals ──
  const addGoal = (val) => {
    if (learningGoals.map((s) => s.toLowerCase()).includes(val.toLowerCase())) return;
    setLearningGoals((prev) => [...prev, val]);
  };
  const removeGoal = (i) => setLearningGoals((prev) => prev.filter((_, idx) => idx !== i));

  // ── Availability ──
  const addSlot = () => {
    const exists = availability.some((a) => a.day === newDay && a.timeSlot === newTimeSlot);
    if (exists) return;
    setAvailability((prev) => [...prev, { day: newDay, timeSlot: newTimeSlot }]);
  };
  const removeSlot = (i) => setAvailability((prev) => prev.filter((_, idx) => idx !== i));

  if (isLoading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="card" style={{ height: '180px' }}>
              <div className="skeleton" style={{ height: '100%', borderRadius: 'var(--radius-2xl)' }} />
            </div>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* ── Page header ──────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-heading)' }}>Your Profile</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
            Keep your profile up-to-date for better match results.
          </p>
        </div>
        <button
          id="profile-save-btn"
          type="button"
          onClick={handleSubmit}
          className="btn btn-primary"
          disabled={isSaving}
          style={{ minWidth: '100px' }}
        >
          {isSaving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {/* ── Toast feedback ───────────────────────────────────── */}
      {saveSuccess && (
        <div className="toast toast-success" style={{ marginBottom: '1.25rem' }}>
          <CheckCircle size={16} /> Profile saved successfully.
        </div>
      )}
      {error && (
        <div className="toast toast-error" style={{ marginBottom: '1.25rem' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} id="profile-form">
        {/* ── Basic Info ──────────────────────────────────────── */}
        <SectionCard title="Basic Info" subtitle="Your public identity on SkillSync">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input className="form-input" type="text" value={user?.name || ''} disabled
                style={{ opacity: 0.7, cursor: 'not-allowed' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                id="profile-role"
                className="form-input form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="student">Student</option>
                <option value="mentor">Mentor</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea
              id="profile-bio"
              className="form-input"
              rows={3}
              placeholder="Tell others a little about yourself…"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={{ resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>
        </SectionCard>

        {/* ── Skills ─────────────────────────────────────────── */}
        <SectionCard title="Skills" subtitle="What can you teach or contribute?">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', minHeight: '2rem' }}>
            {skills.map((s, i) => (
              <span key={i} className="chip">
                {s.name}
                <span
                  style={{
                    marginLeft: '0.25rem',
                    fontSize: '0.7rem',
                    opacity: 0.7,
                    textTransform: 'capitalize',
                  }}
                >
                  · {s.level}
                </span>
                <button type="button" className="chip-remove" onClick={() => removeSkill(i)}>
                  <X size={12} />
                </button>
              </span>
            ))}
            {skills.length === 0 && (
              <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>No skills added yet.</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.875rem' }}>
            <input
              id="profile-skill-name"
              type="text"
              value={newSkillName}
              placeholder="e.g. Python, Machine Learning…"
              onChange={(e) => setNewSkillName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
              className="form-input"
              style={{ flex: 1, fontSize: '0.875rem' }}
            />
            <select
              id="profile-skill-level"
              className="form-input form-select"
              value={newSkillLevel}
              onChange={(e) => setNewSkillLevel(e.target.value)}
              style={{ width: '140px', fontSize: '0.875rem' }}
            >
              {SKILL_LEVELS.map((l) => (
                <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
              ))}
            </select>
            <button type="button" onClick={addSkill} className="btn btn-secondary btn-sm">
              <Plus size={15} /> Add
            </button>
          </div>
        </SectionCard>

        {/* ── Interests ──────────────────────────────────────── */}
        <SectionCard title="Interests" subtitle="Topics you're passionate about">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', minHeight: '2rem' }}>
            {interests.map((item, i) => (
              <ChipTag key={i} label={item} onRemove={() => removeInterest(i)} />
            ))}
            {interests.length === 0 && (
              <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>No interests added yet.</span>
            )}
          </div>
          <AddChipInput placeholder="e.g. Web Dev, AI, Design…" onAdd={addInterest} />
        </SectionCard>

        {/* ── Learning Goals ─────────────────────────────────── */}
        <SectionCard title="Learning Goals" subtitle="What do you want to learn or improve?">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', minHeight: '2rem' }}>
            {learningGoals.map((item, i) => (
              <span key={i} className="chip chip-gray">
                {item}
                <button type="button" className="chip-remove" onClick={() => removeGoal(i)}>
                  <X size={12} />
                </button>
              </span>
            ))}
            {learningGoals.length === 0 && (
              <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>No goals added yet.</span>
            )}
          </div>
          <AddChipInput placeholder="e.g. Learn React, Master SQL…" onAdd={addGoal} />
        </SectionCard>

        {/* ── Availability ───────────────────────────────────── */}
        <SectionCard title="Availability" subtitle="When are you free to study or collaborate?">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.875rem' }}>
            {availability.map((slot, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.5rem 0.875rem',
                  background: 'var(--color-page-bg)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.875rem',
                }}
              >
                <span style={{ color: 'var(--color-heading)', fontWeight: 500 }}>{slot.day}</span>
                <span style={{ color: 'var(--color-muted)' }}>{slot.timeSlot}</span>
                <button type="button" onClick={() => removeSlot(i)} className="btn btn-ghost btn-icon btn-sm">
                  <X size={14} />
                </button>
              </div>
            ))}
            {availability.length === 0 && (
              <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>No slots added yet.</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select
              id="profile-avail-day"
              className="form-input form-select"
              value={newDay}
              onChange={(e) => setNewDay(e.target.value)}
              style={{ width: '140px', fontSize: '0.875rem' }}
            >
              {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select
              id="profile-avail-slot"
              className="form-input form-select"
              value={newTimeSlot}
              onChange={(e) => setNewTimeSlot(e.target.value)}
              style={{ flex: 1, minWidth: '180px', fontSize: '0.875rem' }}
            >
              {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button type="button" onClick={addSlot} className="btn btn-secondary btn-sm">
              <Plus size={15} /> Add slot
            </button>
          </div>
        </SectionCard>
      </form>
    </DashboardLayout>
  );
};

export default Profile;
