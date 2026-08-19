import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading, clearError } = useAuthStore();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    clearError();
    setError('');
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Email and password are required.');
      return;
    }

    try {
      await login(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-center">
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/skillsync.svg" alt="SkillSync" style={{ height: '36px', width: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto 1.25rem' }} />
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--color-heading)', marginBottom: '0.375rem' }}>
            Welcome back
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9375rem' }}>
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '2rem' }}>
          {/* Error */}
          {error && (
            <div className="toast toast-error" id="login-error-banner" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">Email address</label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password" className="form-label">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
              style={{ width: '100%', marginTop: '0.25rem', justifyContent: 'center' }}
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', color: 'var(--color-muted)', fontSize: '0.875rem' }}>
          Don't have an account?{' '}
          <Link to="/register" id="login-register-link"
            style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
