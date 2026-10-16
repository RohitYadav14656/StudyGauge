import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import NotificationBell from '../../components/NotificationBell/NotificationBell';
import './MainLayout.css';

interface User {
  name: string;
  email: string;
  role: string;
}

const MainLayout: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) {
        setUser(null);
        return;
      }
      try {
        const res = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data);
      } catch (err) {
        // Token invalid or expired
        localStorage.removeItem('token');
        setUser(null);
      }
    };

    fetchUserData();
  }, [token]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsDropdownOpen(false);
    navigate('/login');
  };

  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="main-layout">
      {/* Header / Navbar */}
      <header className="main-header">
        <div className="header-container">
          
          {/* Logo & Brand */}
          <Link to={token ? "/my-exams" : "/"} className="header-brand">
            <div className="brand-icon">⚡</div>
            <span className="brand-name">StudyGauge</span>
            <span className="brand-badge">PRO</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="header-nav">
            <NavLink to="/my-exams" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">📚</span> My Exams
            </NavLink>
            <NavLink to="/study-tracker" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">⏱️</span> Study Tracker
            </NavLink>
            <NavLink to="/goals" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">🎯</span> Goals
            </NavLink>
            <NavLink to="/planner" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">📅</span> Planner
            </NavLink>
            <NavLink to="/mock-tests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">📝</span> Mock Tests
            </NavLink>
            <NavLink to="/pyqs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">🧠</span> PYQs
            </NavLink>
            <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">📈</span> Analytics
            </NavLink>
          </nav>

          {/* Right Header Utilities */}
          <div className="header-actions">
            {token ? (
              <>
                <NotificationBell />

                {/* User Menu Dropdown */}
                <div className="user-menu-container" ref={dropdownRef}>
                  <button 
                    className={`user-profile-btn ${isDropdownOpen ? 'open' : ''}`}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <div className="user-avatar">{getUserInitials(user?.name)}</div>
                    <span className="user-name">{user?.name || 'Account'}</span>
                    <span className="dropdown-chevron">▼</span>
                  </button>

                  {isDropdownOpen && (
                    <div className="user-dropdown-menu">
                      <div className="dropdown-header-info">
                        <div className="dropdown-user-name">{user?.name || 'Student Aspirant'}</div>
                        <div className="dropdown-user-email">{user?.email || ''}</div>
                        <span className={`dropdown-user-role ${user?.role === 'admin' ? 'admin' : 'student'}`}>
                          {user?.role === 'admin' ? '🛡️ Admin' : '🎓 Student'}
                        </span>
                      </div>

                      <Link 
                        to="/profile" 
                        className="dropdown-item" 
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        ⚙️ Profile & Settings
                      </Link>

                      <Link 
                        to="/activity-timeline" 
                        className="dropdown-item" 
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        📜 Activity Timeline
                      </Link>

                      <Link 
                        to="/notifications" 
                        className="dropdown-item" 
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        🔔 Notifications Center
                      </Link>

                      {user?.role === 'admin' && (
                        <Link 
                          to="/admin" 
                          className="dropdown-item" 
                          onClick={() => setIsDropdownOpen(false)}
                          style={{ color: '#fb7185' }}
                        >
                          🛡️ Admin Dashboard
                        </Link>
                      )}

                      <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '0.4rem 0' }} />

                      <button className="dropdown-item logout" onClick={handleLogout}>
                        🚪 Log Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="auth-actions">
                <Link to="/login" className="btn-login">Log In</Link>
                <Link to="/register" className="btn-register">Get Started</Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button 
              className="mobile-toggle-btn"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label="Toggle navigation"
            >
              {isMobileOpen ? '✕' : '☰'}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        <div className={`mobile-nav-drawer ${isMobileOpen ? 'open' : ''}`}>
          <NavLink to="/my-exams" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            📚 My Exams Hub
          </NavLink>
          <NavLink to="/study-tracker" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            ⏱️ Study Tracker
          </NavLink>
          <NavLink to="/goals" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            🎯 Goals & Targets
          </NavLink>
          <NavLink to="/planner" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            📅 Study Planner
          </NavLink>
          <NavLink to="/mock-tests" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            📝 Mock Test Logs
          </NavLink>
          <NavLink to="/pyqs" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            🧠 PYQ Practice
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            📈 Analytics & Insights
          </NavLink>
          <NavLink to="/activity-timeline" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            📜 Activity Timeline
          </NavLink>

          <div className="mobile-divider" />

          {token ? (
            <>
              <NavLink to="/profile" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                ⚙️ User Profile
              </NavLink>
              {user?.role === 'admin' && (
                <NavLink to="/admin" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`} style={{ color: '#fb7185' }}>
                  🛡️ Admin Panel
                </NavLink>
              )}
              <button 
                onClick={handleLogout}
                className="mobile-nav-item"
                style={{ color: '#f87171', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
              >
                🚪 Log Out
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
              <Link to="/login" className="btn-login" style={{ textAlign: 'center' }}>Log In</Link>
              <Link to="/register" className="btn-register" style={{ textAlign: 'center' }}>Get Started</Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Page Content */}
      <main className="main-content-body">
        <Outlet />
      </main>

      {/* Modern Footer */}
      <footer className="main-footer">
        <div className="footer-container">
          <div className="footer-grid">
            
            <div className="footer-col-brand">
              <div className="header-brand">
                <div className="brand-icon">⚡</div>
                <span className="brand-name">StudyGauge</span>
              </div>
              <p>
                An adaptive, intelligent competitive exam preparation & tracking platform designed to help students maximize focus, master syllabi, and clear exams.
              </p>
              <div className="system-status">
                <span className="status-dot"></span>
                <span>All Systems Operational</span>
              </div>
            </div>

            <div>
              <h4 className="footer-col-title">Preparation Tools</h4>
              <ul className="footer-links">
                <li><Link to="/my-exams" className="footer-link">My Exams & Syllabi</Link></li>
                <li><Link to="/study-tracker" className="footer-link">Study Timer & Sessions</Link></li>
                <li><Link to="/planner" className="footer-link">Daily Auto-Planner</Link></li>
                <li><Link to="/goals" className="footer-link">Target & Goal Setting</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="footer-col-title">Practice & Analytics</h4>
              <ul className="footer-links">
                <li><Link to="/mock-tests" className="footer-link">Mock Test Manager</Link></li>
                <li><Link to="/pyqs" className="footer-link">PYQ Practice Module</Link></li>
                <li><Link to="/analytics" className="footer-link">Performance Analytics</Link></li>
                <li><Link to="/activity-timeline" className="footer-link">Activity Log</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="footer-col-title">Account & Platform</h4>
              <ul className="footer-links">
                <li><Link to="/profile" className="footer-link">Profile Settings</Link></li>
                <li><Link to="/notifications" className="footer-link">Notification Center</Link></li>
                <li><Link to="/admin" className="footer-link">Admin Portal</Link></li>
                <li><Link to="/login" className="footer-link">Student Login</Link></li>
              </ul>
            </div>

          </div>

          <div className="footer-bottom">
            <div>&copy; {new Date().getFullYear()} StudyGauge. Empowering Exam Aspirants.</div>
            <div className="footer-bottom-links">
              <span className="footer-bottom-link">Privacy Policy</span>
              <span className="footer-bottom-link">Terms of Service</span>
              <span className="footer-bottom-link">Support & FAQs</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
