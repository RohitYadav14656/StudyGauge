import React, { useState, useEffect } from 'react';
import axios from '../../services/axiosInstance';
import { Link } from 'react-router-dom';
import './Auth.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.removeItem('token');
  }, []);

  const handleSubmit = async (e?: React.FormEvent, customCreds?: { email: string; pass: string }) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    const loginEmail = customCreds ? customCreds.email : email;
    const loginPass = customCreds ? customCreds.pass : password;

    try {
      const res = await axios.post('/api/auth/login', {
        email: loginEmail,
        password: loginPass,
      });
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
        window.location.href = '/dashboard';
      } else {
        setError('Login failed: Token not received.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoStudentLogin = () => {
    setEmail('student@example.com');
    setPassword('password123');
    handleSubmit(undefined, { email: 'student@example.com', pass: 'password123' });
  };

  const handleDemoAdminLogin = () => {
    setEmail('admin@study-gauge.com');
    setPassword('admin123456');
    handleSubmit(undefined, { email: 'admin@study-gauge.com', pass: 'admin123456' });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand-badge">StudyGauge Portal</div>
          <h2>Welcome Back</h2>
          <p>Sign in to your account</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="auth-btn-submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ margin: '1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>OR QUICK DEMO</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={handleDemoStudentLogin}
            className="auth-demo-btn"
          >
            Demo Student Account
          </button>
          <button
            type="button"
            onClick={handleDemoAdminLogin}
            className="auth-demo-btn"
          >
            Demo Admin Account
          </button>
        </div>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
