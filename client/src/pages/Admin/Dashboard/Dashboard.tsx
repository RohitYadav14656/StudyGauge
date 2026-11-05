import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../../../services/adminService';
import './Dashboard.css';

interface DashboardStats {
  totalUsers: number;
  totalExams: number;
  totalSubjects: number;
  totalTopics: number;
  totalPYQs: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="admin-loading">Loading Dashboard...</div>;
  }

  if (error) {
    return <div className="admin-error">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Dashboard Overview</h2>
        <p>Welcome to the StudyGauge Admin Console. Monitor database entities, manage syllabus structures, and control question banks.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon users-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div className="stat-details">
            <h3>Total Users</h3>
            <p className="stat-value">{stats?.totalUsers || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon exams-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div className="stat-details">
            <h3>Total Exams</h3>
            <p className="stat-value">{stats?.totalExams || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon subjects-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="stat-details">
            <h3>Total Subjects</h3>
            <p className="stat-value">{stats?.totalSubjects || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon topics-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="stat-details">
            <h3>Total Topics</h3>
            <p className="stat-value">{stats?.totalTopics || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pyqs-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-details">
            <h3>Total PYQs</h3>
            <p className="stat-value">{stats?.totalPYQs || 0}</p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <h3 style={{ color: '#f1f5f9', fontSize: '1.25rem', marginBottom: '1rem' }}>
          ⚡ Fast Operations & Content Hub
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <Link
            to="/admin/syllabus"
            style={{
              textDecoration: 'none',
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '5px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            <div style={{ fontSize: '1.5rem' }}>📚</div>
            <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem' }}>Syllabus Architecture</h4>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
              Inspect and configure full hierarchical syllabus (Subjects → Topics → Subtopics) with student view preview.
            </p>
            <span style={{ color: 'var(--color-accent)', fontSize: '0.8rem', fontWeight: 700, marginTop: '0.5rem' }}>
              Open Syllabus Manager →
            </span>
          </Link>

          <Link
            to="/admin/pyqs"
            style={{
              textDecoration: 'none',
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '5px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            <div style={{ fontSize: '1.5rem' }}>📝</div>
            <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem' }}>Question Bank (PYQs)</h4>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
              Create multiple-choice questions, set correct options, configure difficulty, and write step-by-step solutions.
            </p>
            <span style={{ color: 'var(--color-accent)', fontSize: '0.8rem', fontWeight: 700, marginTop: '0.5rem' }}>
              Manage Question Bank →
            </span>
          </Link>

          <Link
            to="/admin/users"
            style={{
              textDecoration: 'none',
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '5px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            <div style={{ fontSize: '1.5rem' }}>👥</div>
            <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem' }}>User Accounts & Roles</h4>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
              Inspect all registered accounts, promote/demote administrator privileges, and monitor student preparation levels.
            </p>
            <span style={{ color: 'var(--color-accent)', fontSize: '0.8rem', fontWeight: 700, marginTop: '0.5rem' }}>
              Manage User Accounts →
            </span>
          </Link>

          <Link
            to="/admin/exams"
            style={{
              textDecoration: 'none',
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '5px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            <div style={{ fontSize: '1.5rem' }}>🎯</div>
            <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem' }}>Exams Catalog</h4>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
              Add competitive exams (GATE, CAT, UPSC, JEE, NEET) and configure undergraduate/postgraduate levels.
            </p>
            <span style={{ color: 'var(--color-accent)', fontSize: '0.8rem', fontWeight: 700, marginTop: '0.5rem' }}>
              Manage Exams →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
