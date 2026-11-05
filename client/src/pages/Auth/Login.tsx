import React, { useState } from 'react';
import axios from '../../services/axiosInstance';
import { Link } from 'react-router-dom';
import { isValidEmail } from '../../utils/validators';
import './Auth.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post('/api/auth/login', {
        email,
        password,
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

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-card-top-nav">
          <Link to="/" className="auth-home-btn" title="Return to Home">
            ← Go to Home
          </Link>
        </div>

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
              placeholder="name@example.com"
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

        <div className="auth-footer">
          <div>
            Don't have an account? <Link to="/register">Register</Link>
          </div>
          {/* <div className="auth-footer-home">
            <Link to="/">Back to Homepage</Link>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Login;
