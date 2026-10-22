import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, resendVerification, isLoading } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);

  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Please enter a valid email';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((ev) => ({ ...ev, [name]: '' }));
    if (unverifiedEmail) setUnverifiedEmail(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    try {
      await login({ email: form.email, password: form.password });
      navigate(from, { replace: true });
    } catch (err) {
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(form.email);
      } else {
        addToast({ type: 'error', message: err.message || 'Login failed' });
      }
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await resendVerification(unverifiedEmail);
      setResendSent(true);
      addToast({ type: 'success', message: 'Verification email sent!' });
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">Welcome back</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Sign in to your SkillSync account
        </p>
      </div>

      {/* Unverified email notice */}
      {unverifiedEmail && (
        <div className="rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 p-4 flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <Mail size={16} className="text-[var(--color-warning)] mt-0.5 flex-shrink-0" aria-hidden="true" />
            <p className="text-sm text-[var(--color-foreground)]">
              Please verify your email address before logging in. Check your inbox for a verification link.
            </p>
          </div>
          {!resendSent ? (
            <Button
              variant="outline"
              size="sm"
              loading={resendLoading}
              onClick={handleResend}
              className="self-start"
            >
              Resend verification email
            </Button>
          ) : (
            <p className="text-xs text-[var(--color-success)]">
              ✓ Verification email sent. Please check your inbox.
            </p>
          )}
        </div>
      )}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <Input
          id="login-email"
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

        <div className="flex flex-col gap-1.5">
          <div className="relative">
            <Input
              id="login-password"
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
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
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-accent)] transition-colors duration-150"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          id="login-submit"
          type="submit"
          variant="primary"
          size="md"
          loading={isLoading}
          className="w-full"
        >
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--color-muted-foreground)]">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-[var(--color-accent)] hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </div>
  );
};

export default Login;
