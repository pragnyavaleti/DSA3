import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Network, LogIn, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import Button from '../components/Button';
import { Input } from '../components/Input';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const { login, resetPassword, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResetMessage('');

    if (!email.trim() || !password.trim()) {
      setError('Please provide both your email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your email address to reset your password.');
      return;
    }
    setError('');
    setIsResetting(true);
    try {
      await resetPassword(email.trim());
      setResetMessage('Password reset instructions sent. Please check your inbox.');
    } catch (err) {
      setError(err.message || 'Unable to send password reset email.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-page)',
        padding: '2rem 1rem'
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '2.25rem 2rem',
          boxShadow: 'var(--shadow-xl)',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.625rem',
              color: 'var(--primary-navy)',
              fontWeight: 800,
              fontSize: '1.25rem',
              fontFamily: 'var(--font-heading)'
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--ch-bronze)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ch-sand)',
                boxShadow: '0 2px 8px rgba(65, 45, 21, 0.4)'
              }}
            >
              <Network size={20} />
            </div>
            <span>AutoSchedule<span style={{ color: 'var(--ch-bronze)' }}>DSA</span></span>
          </Link>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '1rem' }}>
            Welcome Back
          </h2>
          <p style={{ fontFamily: 'var(--font-main)', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Log in to manage and schedule your project tasks
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </div>
        )}

        {/* Reset Success Message */}
        {resetMessage && (
          <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{resetMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            id="login-email"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />

          <Input
            id="login-password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />



          <Button
            type="submit"
            variant="primary"
            loading={loading}
            icon={LogIn}
            style={{ width: '100%', marginBottom: '1.25rem' }}
          >
            Login
          </Button>

          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link
              to="/signup"
              style={{ color: 'var(--accent-blue)', fontWeight: 600 }}
            >
              Create Account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
