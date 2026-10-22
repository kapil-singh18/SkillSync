import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Mail } from 'lucide-react';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { verifyEmail, resendVerification } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);

  const [status, setStatus] = useState('loading'); // loading | success | error
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    let cancelled = false;
    verifyEmail(token)
      .then(() => {
        if (!cancelled) setStatus('success');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;
    setResendLoading(true);
    try {
      await resendVerification(resendEmail);
      setResendSent(true);
      addToast({ type: 'success', message: 'Verification email sent!' });
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    } finally {
      setResendLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-[var(--color-muted-foreground)]">Verifying your email…</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        <div className="w-14 h-14 rounded-xl bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 flex items-center justify-center">
          <CheckCircle size={28} className="text-[var(--color-success)]" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">Email verified!</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Your email has been verified successfully. You can now log in to your account.
          </p>
        </div>
        <Link to="/login">
          <Button variant="primary" size="md">Go to sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
      <div className="w-14 h-14 rounded-xl bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 flex items-center justify-center">
        <XCircle size={28} className="text-[var(--color-danger)]" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">Verification failed</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          This link is invalid or has expired. Request a new verification email below.
        </p>
      </div>
      {resendSent ? (
        <p className="text-sm text-[var(--color-success)]">
          ✓ A new verification email has been sent. Check your inbox.
        </p>
      ) : (
        <form onSubmit={handleResend} className="w-full flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)] pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="email"
                placeholder="your@email.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                aria-label="Email address for resend"
                required
                className="h-10 w-full rounded-lg pl-9 pr-3 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] transition-colors duration-150"
              />
            </div>
            <Button type="submit" variant="primary" size="md" loading={resendLoading}>
              Resend
            </Button>
          </div>
        </form>
      )}
      <Link to="/login" className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-accent)] transition-colors duration-150">
        Back to sign in
      </Link>
    </div>
  );
};

export default VerifyEmail;
