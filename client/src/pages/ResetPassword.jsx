import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Eye, EyeOff } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword, isLoading } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(!token);

  const validate = () => {
    const e = {};
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    else if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(form.password))
      e.password = 'Must contain at least one letter and one number';
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
      await resetPassword({ token, password: form.password });
      setSuccess(true);
    } catch (err) {
      if (err.status === 400) {
        setTokenError(true);
      } else {
        addToast({ type: 'error', message: err.message || 'Something went wrong' });
      }
    }
  };

  if (tokenError) {
    return (
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        <div className="w-14 h-14 rounded-xl bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 flex items-center justify-center">
          <span className="text-2xl" aria-hidden="true">⏱</span>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">Link expired</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            This reset link is invalid or has expired. Reset links are valid for 30 minutes.
          </p>
        </div>
        <Link to="/forgot-password">
          <Button variant="primary" size="md">Request a new link</Button>
        </Link>
        <Link to="/login" className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-accent)] transition-colors duration-150">
          Back to sign in
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        <div className="w-14 h-14 rounded-xl bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 flex items-center justify-center">
          <CheckCircle size={28} className="text-[var(--color-success)]" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">Password reset!</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Your password has been updated successfully. You can now sign in with your new password.
          </p>
        </div>
        <Link to="/login">
          <Button variant="primary" size="md">Sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">Reset password</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Choose a strong new password for your account.
        </p>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <div className="relative">
          <Input
            id="reset-password"
            name="password"
            label="New password"
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
        <div className="relative">
          <Input
            id="reset-confirm-password"
            name="confirmPassword"
            label="Confirm new password"
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
          id="reset-submit"
          type="submit"
          variant="primary"
          size="md"
          loading={isLoading}
          className="w-full"
        >
          Reset password
        </Button>
      </form>
      <p className="text-center text-sm text-[var(--color-muted-foreground)]">
        <Link to="/login" className="text-[var(--color-accent)] hover:underline font-medium">
          Back to sign in
        </Link>
      </p>
    </div>
  );
};

export default ResetPassword;
