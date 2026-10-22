import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Eye, EyeOff } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';

const strengthHint = (password) => {
  if (!password) return null;
  const hasLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (hasLength && hasLetter && hasNumber) return { level: 'strong', label: 'Strong password' };
  if (hasLength && (hasLetter || hasNumber)) return { level: 'medium', label: 'Add letters and numbers' };
  return { level: 'weak', label: 'At least 8 chars with a letter and number' };
};

const strengthColors = {
  weak: 'bg-[var(--color-danger)]',
  medium: 'bg-[var(--color-warning)]',
  strong: 'bg-[var(--color-success)]',
};

const Register = () => {
  const { register, isLoading } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const hint = strengthHint(form.password);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    else if (form.name.trim().length > 60) e.name = 'Name must be at most 60 characters';
    if (!form.email) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Please enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    else if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(form.password))
      e.password = 'Password must contain at least one letter and one number';
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((ev) => ({ ...ev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      await register({ name: form.name.trim(), email: form.email, password: form.password });
      setSuccess(true);
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Registration failed' });
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        <div className="w-14 h-14 rounded-xl bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 flex items-center justify-center">
          <CheckCircle size={28} className="text-[var(--color-success)]" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">Check your email</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            We sent a verification link to <strong className="text-[var(--color-foreground)]">{form.email}</strong>.
            Click it to activate your account before logging in.
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
            The link expires in 24 hours. Check your spam folder if you don&apos;t see it.
          </p>
        </div>
        <Link to="/login" className="text-sm text-[var(--color-accent)] hover:underline font-medium">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">Create account</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Join SkillSync and start learning together
        </p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <Input
          id="register-name"
          name="name"
          label="Full name"
          type="text"
          placeholder="Alex Johnson"
          autoComplete="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          required
        />
        <Input
          id="register-email"
          name="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          required
        />

        {/* Password with strength indicator */}
        <div className="flex flex-col gap-1.5">
          <div className="relative">
            <Input
              id="register-password"
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 chars, letter + number"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-[34px] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {hint && !errors.password && (
            <div className="flex items-center gap-2">
              <div className="flex gap-1 flex-1">
                {['weak', 'medium', 'strong'].map((level, i) => (
                  <div
                    key={level}
                    className={[
                      'h-1 flex-1 rounded-full transition-all duration-200',
                      i === 0 || (i === 1 && hint.level !== 'weak') || hint.level === 'strong'
                        ? strengthColors[hint.level]
                        : 'bg-[var(--color-border)]',
                    ].join(' ')}
                  />
                ))}
              </div>
              <span className="text-xs text-[var(--color-muted-foreground)] whitespace-nowrap">
                {hint.label}
              </span>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div className="relative">
          <Input
            id="register-confirm-password"
            name="confirmPassword"
            label="Confirm password"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Repeat password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
            className="absolute right-3 top-[34px] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded"
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <Button
          id="register-submit"
          type="submit"
          variant="primary"
          size="md"
          loading={isLoading}
          className="w-full"
        >
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--color-muted-foreground)]">
        Already have an account?{' '}
        <Link to="/login" className="text-[var(--color-accent)] hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default Register;
