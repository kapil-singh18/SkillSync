import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, GraduationCap, Star } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Tabs from '../components/ui/Tabs';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import ProgressBar from '../components/ui/ProgressBar';
import TagInput from '../components/ui/TagInput';
import SkillEditor from '../components/ui/SkillEditor';
import AvailabilityGrid from '../components/ui/AvailabilityGrid';
import AvatarUploader from '../components/ui/AvatarUploader';
import useProfileStore from '../store/profileStore';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';

// ── Helpers ───────────────────────────────────────────────────────────────────
const YEAR_OPTIONS = [
  { value: '1st Year', label: '1st Year' },
  { value: '2nd Year', label: '2nd Year' },
  { value: '3rd Year', label: '3rd Year' },
  { value: '4th Year', label: '4th Year' },
  { value: 'Graduate', label: 'Graduate' },
  { value: 'Postgraduate', label: 'Postgraduate' },
];

const TIMEZONE_OPTIONS = [
  { value: '', label: 'Select timezone' },
  { value: 'Asia/Kolkata', label: 'IST (India)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'EST (New York)' },
  { value: 'America/Los_Angeles', label: 'PST (Los Angeles)' },
  { value: 'Europe/London', label: 'GMT (London)' },
  { value: 'Europe/Berlin', label: 'CET (Berlin)' },
  { value: 'Asia/Singapore', label: 'SGT (Singapore)' },
  { value: 'Australia/Sydney', label: 'AEST (Sydney)' },
];

const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const completenessHints = (pct) => {
  if (pct >= 100) return null;
  const hints = [];
  if (pct < 15) hints.push('Add a profile photo');
  if (pct < 25) hints.push('Write a headline');
  if (pct < 35) hints.push('Add a bio');
  if (pct < 50) hints.push('Add 3+ skills');
  if (pct < 65) hints.push('Add your college/course');
  if (pct < 75) hints.push('Add interests');
  if (pct < 85) hints.push('Set your availability');
  return hints[0] || 'Keep filling out your profile!';
};

// ── Profile Tab ───────────────────────────────────────────────────────────────
const ProfileTab = ({ profile, completeness }) => {
  const { updateProfile, uploadAvatar, removeAvatar, changeRole, isSaving } = useProfileStore();
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form from profile
  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name || '',
      headline: profile.headline || '',
      bio: profile.bio || '',
      college: profile.college || '',
      course: profile.course || '',
      yearOfStudy: profile.yearOfStudy || '',
      location: profile.location || '',
      timezone: profile.timezone || '',
      skills: profile.skills || [],
      interests: profile.interests || [],
      learningGoals: profile.learningGoals || [],
      availability: profile.availability || [],
      links: { github: '', linkedin: '', portfolio: '', ...(profile.links || {}) },
      mentorProfile: profile.mentorProfile || {
        expertise: [], yearsOfExperience: 0, mentoringStatement: '', acceptingMentees: true,
      },
    });
    setDirty(false);
  }, [profile]);

  const set = useCallback((field, value) => {
    setForm((f) => {
      const next = { ...f, [field]: value };
      setDirty(!deepEqual(next, {
        name: profile.name || '', headline: profile.headline || '', bio: profile.bio || '',
        college: profile.college || '', course: profile.course || '',
        yearOfStudy: profile.yearOfStudy || '', location: profile.location || '',
        timezone: profile.timezone || '', skills: profile.skills || [],
        interests: profile.interests || [], learningGoals: profile.learningGoals || [],
        availability: profile.availability || [],
        links: { github: '', linkedin: '', portfolio: '', ...(profile.links || {}) },
        mentorProfile: profile.mentorProfile || { expertise: [], yearsOfExperience: 0, mentoringStatement: '', acceptingMentees: true },
      }));
      return next;
    });
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  }, [profile, errors]);

  const setMentor = (field, value) => {
    setForm((f) => ({ ...f, mentorProfile: { ...f.mentorProfile, [field]: value } }));
    setDirty(true);
  };

  const validateLinks = (links) => {
    const errs = {};
    ['github', 'linkedin', 'portfolio'].forEach((k) => {
      if (links[k] && !/^https:\/\/.+/.test(links[k])) {
        errs[`links.${k}`] = `Must be a valid https:// URL or empty`;
      }
    });
    return errs;
  };

  const handleSave = async () => {
    const linkErrs = validateLinks(form.links);
    if (Object.keys(linkErrs).length) { setErrors(linkErrs); return; }

    try {
      await updateProfile(form);
      addToast({ type: 'success', message: 'Profile saved!' });
      setDirty(false);
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to save profile' });
    }
  };

  const handleRoleChange = async (newRole) => {
    try {
      await changeRole(newRole);
      addToast({ type: 'success', message: `Role updated to ${newRole}` });
      setForm((f) => ({ ...f })); // refresh mentor section
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    }
  };

  const handleAvatarUpload = async (file) => {
    try {
      await uploadAvatar(file);
      addToast({ type: 'success', message: 'Avatar updated!' });
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Upload failed' });
    }
  };

  const handleAvatarRemove = async () => {
    try {
      await removeAvatar();
      addToast({ type: 'info', message: 'Avatar removed.' });
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    }
  };

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  if (!form) return <div className="flex flex-col gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;

  const isMentor = profile?.role === 'mentor';

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Completeness card */}
      <Card>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Profile completeness</h2>
            <Badge variant={completeness >= 80 ? 'success' : completeness >= 50 ? 'accent' : 'warning'}>
              {completeness >= 100 ? 'Complete!' : `${completeness}%`}
            </Badge>
          </div>
          <ProgressBar value={completeness} showPercent={false} />
          {completenessHints(completeness) && (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              💡 Next: {completenessHints(completeness)}
            </p>
          )}
        </div>
      </Card>

      {/* Basic Info */}
      <Card>
        <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-4">Basic Info</h2>
        <div className="flex flex-col gap-5">
          <AvatarUploader
            name={profile?.name}
            currentUrl={profile?.avatarUrl}
            onUpload={handleAvatarUpload}
            onRemove={handleAvatarRemove}
            isLoading={isSaving}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="profile-name" label="Full name" value={form.name} onChange={(e) => set('name', e.target.value)} maxLength={60} required />
            <Input id="profile-headline" label="Headline" placeholder="e.g. Full-Stack Dev · React · Node" value={form.headline} onChange={(e) => set('headline', e.target.value)} maxLength={100} />
          </div>
          <Textarea id="profile-bio" label="Bio" placeholder="Tell the community about yourself…" value={form.bio} onChange={(e) => set('bio', e.target.value)} maxLength={500} rows={3} helperText={`${form.bio.length}/500`} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="profile-college" label="College / University" value={form.college} onChange={(e) => set('college', e.target.value)} maxLength={120} />
            <Input id="profile-course" label="Course / Major" value={form.course} onChange={(e) => set('course', e.target.value)} maxLength={120} />
            <Select id="profile-year" label="Year of Study" options={YEAR_OPTIONS} value={form.yearOfStudy} onChange={(e) => set('yearOfStudy', e.target.value)} placeholder="Select year" />
            <Input id="profile-location" label="Location" placeholder="City, Country" value={form.location} onChange={(e) => set('location', e.target.value)} maxLength={80} />
            <Select id="profile-timezone" label="Timezone" options={TIMEZONE_OPTIONS} value={form.timezone} onChange={(e) => set('timezone', e.target.value)} />
          </div>
        </div>
      </Card>

      {/* Skills */}
      <Card>
        <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-4">Skills</h2>
        <SkillEditor value={form.skills} onChange={(v) => set('skills', v)} />
      </Card>

      {/* Interests */}
      <Card>
        <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-4">Interests</h2>
        <TagInput label="Interests" value={form.interests} onChange={(v) => set('interests', v)} maxItems={15} maxLength={40} placeholder="Type an interest and press Enter…" helperText="Add topics you enjoy — used for peer matching" />
      </Card>

      {/* Learning Goals */}
      <Card>
        <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-4">Learning Goals</h2>
        <TagInput label="Goals" value={form.learningGoals} onChange={(v) => set('learningGoals', v)} maxItems={10} maxLength={100} placeholder="e.g. Learn system design…" helperText="What do you want to achieve?" />
      </Card>

      {/* Availability */}
      <Card>
        <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-4">Availability</h2>
        <AvailabilityGrid value={form.availability} onChange={(v) => set('availability', v)} />
      </Card>

      {/* Links */}
      <Card>
        <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-4">Links</h2>
        <div className="flex flex-col gap-4">
          <Input id="profile-github" label="GitHub" placeholder="https://github.com/username" value={form.links.github} onChange={(e) => set('links', { ...form.links, github: e.target.value })} error={errors['links.github']} />
          <Input id="profile-linkedin" label="LinkedIn" placeholder="https://linkedin.com/in/username" value={form.links.linkedin} onChange={(e) => set('links', { ...form.links, linkedin: e.target.value })} error={errors['links.linkedin']} />
          <Input id="profile-portfolio" label="Portfolio" placeholder="https://yoursite.com" value={form.links.portfolio} onChange={(e) => set('links', { ...form.links, portfolio: e.target.value })} error={errors['links.portfolio']} />
        </div>
      </Card>

      {/* Role switch */}
      <Card>
        <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-1">I am a…</h2>
        <p className="text-xs text-[var(--color-muted-foreground)] mb-4">Switch between student and mentor. Mentor profiles can be discovered by students seeking guidance.</p>
        <div className="grid grid-cols-2 gap-3">
          {[{ role: 'student', icon: <GraduationCap size={18} />, label: 'Student', desc: 'Learning & growing' },
            { role: 'mentor', icon: <Star size={18} />, label: 'Mentor', desc: 'Teaching & guiding' }].map((opt) => (
            <button
              key={opt.role}
              type="button"
              onClick={() => profile.role !== opt.role && handleRoleChange(opt.role)}
              aria-pressed={profile.role === opt.role}
              className={[
                'flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
                profile.role === opt.role
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-accent)]/50',
              ].join(' ')}
            >
              {opt.icon}
              <span className="font-semibold text-sm">{opt.label}</span>
              <span className="text-xs opacity-70">{opt.desc}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Mentor details */}
      {isMentor && form.mentorProfile && (
        <Card>
          <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-4">Mentor Details</h2>
          <div className="flex flex-col gap-5">
            <TagInput label="Areas of expertise" value={form.mentorProfile.expertise || []} onChange={(v) => setMentor('expertise', v)} maxItems={10} maxLength={40} placeholder="e.g. Machine Learning, React…" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input id="profile-experience" label="Years of experience" type="number" min={0} max={50} value={form.mentorProfile.yearsOfExperience || 0} onChange={(e) => setMentor('yearsOfExperience', Number(e.target.value))} />
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="accepting-mentees"
                  checked={!!form.mentorProfile.acceptingMentees}
                  onChange={(e) => setMentor('acceptingMentees', e.target.checked)}
                  className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer"
                />
                <label htmlFor="accepting-mentees" className="text-sm text-[var(--color-foreground)] cursor-pointer">
                  Currently accepting mentees
                </label>
              </div>
            </div>
            <Textarea id="mentor-statement" label="Mentoring statement" placeholder="Describe how you mentor, your approach, and what mentees can expect…" value={form.mentorProfile.mentoringStatement || ''} onChange={(e) => setMentor('mentoringStatement', e.target.value)} maxLength={500} rows={4} helperText={`${(form.mentorProfile.mentoringStatement || '').length}/500`} />
          </div>
        </Card>
      )}

      {/* Sticky save bar */}
      {dirty && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-background)] border-t border-[var(--color-border)] px-6 py-3 flex items-center justify-between gap-4 shadow-lg lg:pl-72">
          <p className="text-sm text-[var(--color-muted-foreground)]">You have unsaved changes.</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setForm(null); setTimeout(() => setForm({ name: profile.name || '', headline: profile.headline || '', bio: profile.bio || '', college: profile.college || '', course: profile.course || '', yearOfStudy: profile.yearOfStudy || '', location: profile.location || '', timezone: profile.timezone || '', skills: profile.skills || [], interests: profile.interests || [], learningGoals: profile.learningGoals || [], availability: profile.availability || [], links: { github: '', linkedin: '', portfolio: '', ...(profile.links || {}) }, mentorProfile: profile.mentorProfile || { expertise: [], yearsOfExperience: 0, mentoringStatement: '', acceptingMentees: true } }), 0); setDirty(false); }}>
              Discard
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} loading={isSaving}>
              Save changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Account Tab ───────────────────────────────────────────────────────────────
const AccountTab = () => {
  const user = useAuthStore((s) => s.user);
  const { changePassword: changePw } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.currentPassword) e.currentPassword = 'Current password is required';
    if (!form.newPassword) e.newPassword = 'New password is required';
    else if (form.newPassword.length < 8) e.newPassword = 'Must be at least 8 characters';
    else if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(form.newPassword)) e.newPassword = 'Must contain a letter and a number';
    if (form.newPassword !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setIsLoading(true);
    try {
      await changePw({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      addToast({ type: 'success', message: 'Password changed successfully.' });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to change password' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Email info */}
      <Card>
        <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-4">Account info</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-[var(--color-foreground)]">{user?.email}</span>
          <Badge variant={user?.isEmailVerified ? 'success' : 'warning'}>
            {user?.isEmailVerified ? 'Verified' : 'Unverified'}
          </Badge>
        </div>
      </Card>

      {/* Change password */}
      <Card>
        <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-4">Change password</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md" noValidate>
          <Input id="cur-pass" label="Current password" type="password" value={form.currentPassword} onChange={(e) => { setForm((f) => ({ ...f, currentPassword: e.target.value })); setErrors((v) => ({ ...v, currentPassword: '' })); }} error={errors.currentPassword} required />
          <Input id="new-pass" label="New password" type="password" value={form.newPassword} onChange={(e) => { setForm((f) => ({ ...f, newPassword: e.target.value })); setErrors((v) => ({ ...v, newPassword: '' })); }} error={errors.newPassword} required />
          <Input id="confirm-pass" label="Confirm new password" type="password" value={form.confirmPassword} onChange={(e) => { setForm((f) => ({ ...f, confirmPassword: e.target.value })); setErrors((v) => ({ ...v, confirmPassword: '' })); }} error={errors.confirmPassword} required />
          <Button id="change-password-submit" type="submit" variant="primary" size="md" loading={isLoading} className="self-start">
            Update password
          </Button>
        </form>
      </Card>

      {/* Theme note */}
      <Card>
        <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-2">Theme preference</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Toggle between dark and light themes using the <strong>sun/moon icon</strong> in the top bar. Your preference is saved automatically.
        </p>
      </Card>
    </div>
  );
};

// ── Main Profile page ─────────────────────────────────────────────────────────
const Profile = () => {
  const { fetchProfile, profile, completeness, isLoading } = useProfileStore();

  useEffect(() => {
    fetchProfile();
  }, []);

  if (isLoading && !profile) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const tabs = [
    {
      id: 'profile',
      label: 'Profile',
      icon: <User size={14} />,
      content: <ProfileTab profile={profile} completeness={completeness} />,
    },
    {
      id: 'account',
      label: 'Account',
      icon: <Lock size={14} />,
      content: <AccountTab />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My Profile" subtitle="Manage your public profile and account settings" />
      <Tabs tabs={tabs} defaultTab="profile" />
    </div>
  );
};

export default Profile;
