import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import axios from '../../services/axiosInstance';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('study_gauge_theme') === 'dark';
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const token = localStorage.getItem('token');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isLandingPage = location.pathname === '/';

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
      localStorage.setItem('study_gauge_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('study_gauge_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  useEffect(() => {
    if (isAuthPage || !token) {
      setUser(null);
      return;
    }

    let isMounted = true;

    const fetchUserData = async () => {
      try {
        const res = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (isMounted && res.data) {
          setUser(res.data);
        }
      } catch (err: any) {
        if (isMounted) {
          // ONLY clear token if backend explicitly responds with 401 Unauthorized
          if (err.response?.status === 401) {
            localStorage.removeItem('token');
            setUser(null);
          }
        }
      }
    };

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsDropdownOpen(false);
    window.location.href = '/login';
  };

  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (isAuthPage) {
    return (
      <div className="sg-auth-screen-layout">
        <Outlet />
      </div>
    );
  }

  if (!token && isLandingPage) {
    return (
      <div className="sg-public-layout">
        <header className="sg-public-header">
          <div className="sg-public-header-inner">
            <Link to="/" className="sg-brand">
              <span className="sg-brand-icon">S</span>
              <span className="sg-brand-name">StudyGauge</span>
            </Link>

            <nav className="sg-public-nav">
              <Link to="/#features" className="sg-public-nav-link">Features</Link>
              <Link to="/#analytics" className="sg-public-nav-link">Analytics</Link>
              <Link to="/#exams" className="sg-public-nav-link">Exams</Link>
            </nav>

            <div className="sg-public-actions">
              <button
                onClick={toggleTheme}
                className="sg-theme-toggle-btn sg-theme-toggle-desktop"
                title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`}
                aria-label="Toggle theme"
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              <Link to="/login" className="sg-btn-secondary text-sm sg-public-login-btn">
                Log In
              </Link>
              <Link to="/register" className="sg-btn-primary text-sm sg-public-register-btn">
                Register Free
              </Link>
              <button
                className="sg-public-hamburger"
                onClick={() => setIsMobileNavOpen((o) => !o)}
                aria-label={isMobileNavOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileNavOpen}
              >
                {isMobileNavOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>

          {isMobileNavOpen && (
            <>
              <div
                className="sg-public-mobile-backdrop"
                onClick={() => setIsMobileNavOpen(false)}
                aria-hidden="true"
              />
              <div className="sg-public-mobile-menu" role="dialog" aria-label="Mobile navigation">
                <div className="sg-public-mobile-menu-item sg-public-mobile-darkmode">
                  <span>Dark Mode</span>
                  <button
                    onClick={toggleTheme}
                    className="sg-public-mobile-theme-btn"
                    aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {isDarkMode ? '☀️ Light' : '🌙 Dark'}
                  </button>
                </div>
                <Link
                  to="/login"
                  className="sg-btn-secondary sg-public-mobile-action-btn"
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="sg-btn-primary sg-public-mobile-action-btn"
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  Register Free
                </Link>
              </div>
            </>
          )}
        </header>

        <main>
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="sg-app-shell">
      {isSidebarOpen && (
        <div
          className="sg-sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`sg-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sg-sidebar-header">
          <Link to="/dashboard" className="sg-brand">
            <span className="sg-brand-icon">S</span>
            <span className="sg-brand-name">StudyGauge</span>
          </Link>
          <button
            className="sg-sidebar-close-btn"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <div className="sg-sidebar-nav-scroll">
          <div className="sg-nav-section-title">Preparation</div>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `sg-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="sg-nav-icon">📊</span>
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/my-exams"
            className={({ isActive }) => `sg-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="sg-nav-icon">📚</span>
            <span>Exams & Syllabus</span>
          </NavLink>
          <NavLink
            to="/study-tracker"
            className={({ isActive }) => `sg-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="sg-nav-icon">⏱️</span>
            <span>Study Tracker</span>
          </NavLink>
          <NavLink
            to="/planner"
            className={({ isActive }) => `sg-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="sg-nav-icon">📅</span>
            <span>Study Planner</span>
          </NavLink>

          <div className="sg-nav-section-title">Practice & Recall</div>
          <NavLink
            to="/mock-tests"
            className={({ isActive }) => `sg-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="sg-nav-icon">📝</span>
            <span>Mock Tests</span>
          </NavLink>
          <NavLink
            to="/pyqs"
            className={({ isActive }) => `sg-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="sg-nav-icon">📑</span>
            <span>Question Bank</span>
          </NavLink>
          <NavLink
            to="/recommendations"
            className={({ isActive }) => `sg-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="sg-nav-icon">💡</span>
            <span>Recommendations</span>
          </NavLink>
          <NavLink
            to="/revision"
            className={({ isActive }) => `sg-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="sg-nav-icon">🔄</span>
            <span>Spaced Revision</span>
          </NavLink>

          <div className="sg-nav-section-title">Analytics & Tools</div>
          <NavLink
            to="/analytics"
            className={({ isActive }) => `sg-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="sg-nav-icon">📈</span>
            <span>Analytics</span>
          </NavLink>
          <NavLink
            to="/goals"
            className={({ isActive }) => `sg-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="sg-nav-icon">🎯</span>
            <span>Study Goals</span>
          </NavLink>
          <NavLink
            to="/activity-timeline"
            className={({ isActive }) => `sg-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="sg-nav-icon">📜</span>
            <span>Activity Log</span>
          </NavLink>
          <NavLink
            to="/integrations"
            className={({ isActive }) => `sg-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="sg-nav-icon">🔗</span>
            <span>Connected Apps</span>
          </NavLink>
          <NavLink
            to="/notifications"
            className={({ isActive }) => `sg-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="sg-nav-icon">🔔</span>
            <span>Notifications</span>
          </NavLink>

          {user?.role === 'admin' && (
            <>
              <div className="sg-nav-section-title">Admin</div>
              <NavLink
                to="/admin"
                className={({ isActive }) => `sg-nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="sg-nav-icon">🛡️</span>
                <span>Admin Portal</span>
              </NavLink>
            </>
          )}
        </div>

        <div className="sg-sidebar-footer">
          <div className="sg-user-strip">
            <Link to="/profile" className="sg-user-info-link">
              <div className="sg-user-avatar">{getUserInitials(user?.name)}</div>
              <div className="sg-user-details">
                <span className="sg-user-name">{user?.name || 'Student'}</span>
                <span className="sg-user-role">{user?.role === 'admin' ? 'Admin' : 'Student'}</span>
              </div>
            </Link>

            <button
              onClick={toggleTheme}
              className="sg-theme-btn"
              title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>

          <button onClick={handleLogout} className="sg-logout-btn">
            Sign Out
          </button>
        </div>
      </aside>

      <div className="sg-main-wrapper">
        <header className="sg-topbar">
          <div className="sg-topbar-left">
            <button
              className="sg-mobile-toggle"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              ☰
            </button>
            <Link to="/dashboard" className="sg-topbar-brand-mobile">
              <span className="sg-brand-icon-sm">S</span>
              <span className="font-bold text-sm">StudyGauge</span>
            </Link>
          </div>

          <div className="sg-topbar-right">
            <Link to="/my-exams" className="sg-active-exam-pill" title="My Exams & Syllabus">
              <span className="text-xs">📚</span>
              <span className="hidden sm:inline">Exams</span>
            </Link>

            <Link to="/study-tracker" className="sg-timer-quick-btn" title="Focus Timer">
              <span>⏱️</span>
              <span className="hidden sm:inline text-xs font-semibold">Timer</span>
            </Link>

            <div className="sg-topbar-bell-wrapper">
              <NotificationBell />
            </div>

            <button
              onClick={toggleTheme}
              className="sg-theme-toggle-top"
              title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            <div className="sg-profile-dropdown-wrapper" ref={dropdownRef}>
              <button
                className="sg-profile-trigger"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-label="User menu"
              >
                <div className="sg-avatar-sm">{getUserInitials(user?.name)}</div>
                <span className="sg-profile-name">{user?.name || 'Account'}</span>
                <span className="sg-chevron">▼</span>
              </button>

              {isDropdownOpen && (
                <>
                  <div
                    className="sg-dropdown-backdrop"
                    onClick={() => setIsDropdownOpen(false)}
                    aria-label="Close dropdown"
                  />
                  <div className="sg-dropdown-menu">
                    <div className="sg-dropdown-header">
                      <div className="sg-avatar-sm">{getUserInitials(user?.name)}</div>
                      <div className="sg-dropdown-user-info">
                        <div className="sg-dropdown-user-row">
                          <p className="sg-dropdown-user-name">{user?.name || 'Student'}</p>
                          <span className="sg-user-badge">{user?.role === 'admin' ? 'Admin' : 'Student'}</span>
                        </div>
                        <p className="sg-dropdown-user-email">{user?.email || 'Active Account'}</p>
                      </div>
                    </div>

                    <div className="sg-dropdown-theme-row">
                      <span className="sg-dropdown-theme-label">
                        <span>{isDarkMode ? '🌙' : '☀️'}</span>
                        <span>Dark Mode</span>
                      </span>
                      <button
                        onClick={toggleTheme}
                        className="sg-dropdown-theme-btn"
                        type="button"
                        aria-label="Toggle theme"
                      >
                        {isDarkMode ? '☀️ Light' : '🌙 Dark'}
                      </button>
                    </div>

                    <div className="sg-dropdown-nav-mobile">
                      <div className="sg-dropdown-section-label">Preparation</div>
                      <Link
                        to="/dashboard"
                        className="sg-dropdown-item"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <span className="sg-dropdown-item-icon">📊</span>
                        <span>Dashboard</span>
                      </Link>
                      <Link
                        to="/my-exams"
                        className="sg-dropdown-item"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <span className="sg-dropdown-item-icon">📚</span>
                        <span>Exams & Syllabus</span>
                      </Link>
                      <Link
                        to="/study-tracker"
                        className="sg-dropdown-item"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <span className="sg-dropdown-item-icon">⏱️</span>
                        <span>Study Tracker & Timer</span>
                      </Link>
                      <Link
                        to="/planner"
                        className="sg-dropdown-item"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <span className="sg-dropdown-item-icon">📅</span>
                        <span>Study Planner</span>
                      </Link>
                      <Link
                        to="/goals"
                        className="sg-dropdown-item"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <span className="sg-dropdown-item-icon">🎯</span>
                        <span>Study Goals</span>
                      </Link>

                      <div className="sg-dropdown-section-label">Practice & Recall</div>
                      <Link
                        to="/mock-tests"
                        className="sg-dropdown-item"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <span className="sg-dropdown-item-icon">📝</span>
                        <span>Mock Tests</span>
                      </Link>
                      <Link
                        to="/pyqs"
                        className="sg-dropdown-item"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <span className="sg-dropdown-item-icon">📑</span>
                        <span>Question Bank</span>
                      </Link>
                      <Link
                        to="/revision"
                        className="sg-dropdown-item"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <span className="sg-dropdown-item-icon">🔄</span>
                        <span>Spaced Revision</span>
                      </Link>
                      <Link
                        to="/recommendations"
                        className="sg-dropdown-item"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <span className="sg-dropdown-item-icon">💡</span>
                        <span>Recommendations</span>
                      </Link>
                      <Link
                        to="/analytics"
                        className="sg-dropdown-item"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <span className="sg-dropdown-item-icon">📈</span>
                        <span>Analytics</span>
                      </Link>
                      <Link
                        to="/notifications"
                        className="sg-dropdown-item"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <span className="sg-dropdown-item-icon">🔔</span>
                        <span>Notifications</span>
                      </Link>
                    </div>

                    <div className="sg-dropdown-section-label">Account</div>
                    <Link
                      to="/profile"
                      className="sg-dropdown-item"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <span className="sg-dropdown-item-icon">👤</span>
                      <span>Profile & Targets</span>
                    </Link>
                    <Link
                      to="/activity-timeline"
                      className="sg-dropdown-item"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <span className="sg-dropdown-item-icon">📜</span>
                      <span>Activity Log</span>
                    </Link>
                    <Link
                      to="/integrations"
                      className="sg-dropdown-item"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <span className="sg-dropdown-item-icon">🔗</span>
                      <span>Connected Apps</span>
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="sg-dropdown-item"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <span className="sg-dropdown-item-icon">🛡️</span>
                        <span>Admin Portal</span>
                      </Link>
                    )}

                    <div className="sg-dropdown-divider" />
                    <button onClick={handleLogout} className="sg-dropdown-item text-red">
                      <span className="sg-dropdown-item-icon">🚪</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="sg-page-content">
          <Outlet />
        </main>

        <nav className="sg-mobile-bottom-bar" aria-label="Mobile navigation">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `sg-bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="sg-bottom-nav-icon">📊</span>
            <span className="sg-bottom-nav-label">Dashboard</span>
          </NavLink>
          <NavLink
            to="/study-tracker"
            className={({ isActive }) => `sg-bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="sg-bottom-nav-icon">⏱️</span>
            <span className="sg-bottom-nav-label">Tracker</span>
          </NavLink>
          <NavLink
            to="/planner"
            className={({ isActive }) => `sg-bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="sg-bottom-nav-icon">📅</span>
            <span className="sg-bottom-nav-label">Planner</span>
          </NavLink>
          <NavLink
            to="/pyqs"
            className={({ isActive }) => `sg-bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="sg-bottom-nav-icon">📑</span>
            <span className="sg-bottom-nav-label">Questions</span>
          </NavLink>
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="sg-bottom-nav-item"
            aria-label="More menu"
          >
            <span className="sg-bottom-nav-icon">☰</span>
            <span className="sg-bottom-nav-label">Menu</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default MainLayout;
