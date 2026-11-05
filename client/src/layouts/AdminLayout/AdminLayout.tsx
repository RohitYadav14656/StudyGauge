import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './AdminLayout.css';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <h2>StudyGauge <span>Admin</span></h2>
        </div>
        
        <nav className="admin-nav">
          <ul>
            <li>
              <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'active' : '')}>
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/syllabus" className={({ isActive }) => (isActive ? 'active' : '')}>
                Syllabus
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/exams" className={({ isActive }) => (isActive ? 'active' : '')}>
                Exams
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/subjects" className={({ isActive }) => (isActive ? 'active' : '')}>
                Subjects
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/topics" className={({ isActive }) => (isActive ? 'active' : '')}>
                Topics
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/pyqs" className={({ isActive }) => (isActive ? 'active' : '')}>
                PYQs
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/users" className={({ isActive }) => (isActive ? 'active' : '')}>
                Users
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header-title">
            <h3>Admin Panel</h3>
          </div>
          <div className="admin-header-actions">
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
            <button className="btn-portal" onClick={() => navigate('/')}>
              Student Portal
            </button>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
