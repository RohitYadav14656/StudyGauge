import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Auth.css';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validatePassword = (pwd: string) => {
    return pwd.length >= 8;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post('/api/auth/register', { name, email, password });
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
        window.location.href = '/my-exams';
      } else {
        setError('Registration succeeded, but token missing.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand-badge">StudyGauge Portal</div>
          <h2>Create Account</h2>
          <p>Register to start your preparation tracking</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password (min 8 characters)</label>
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
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
