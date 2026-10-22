import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';

const ForgotPassword = () => {
  const { forgotPassword, isLoading } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    if (!email) return 'Email is required';
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Please enter a valid email';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Something went wrong' });
    }
  };

  if (submitted) {
    return (
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        <div className="w-14 h-14 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 flex items-center justify-center">
          <CheckCircle size={28} className="text-[var(--color-accent)]" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">Check your inbox</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            If that email is registered, we've sent a reset link. It expires in 30 minutes.
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
            Check your spam folder if you don't see it.
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
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">Forgot password?</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <Input
          id="forgot-email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          error={error}
          required
        />
        <Button
          id="forgot-submit"
          type="submit"
          variant="primary"
          size="md"
          loading={isLoading}
          className="w-full"
        >
          Send reset link
        </Button>
      </form>
      <p className="text-center text-sm text-[var(--color-muted-foreground)]">
        Remember it?{' '}
        <Link to="/login" className="text-[var(--color-accent)] hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default ForgotPassword;
