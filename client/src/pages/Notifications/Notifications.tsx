import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  notificationService,
  NotificationItem,
  NotificationType,
} from '../../services/notificationService';
import { NotificationBell } from '../../components/NotificationBell/NotificationBell';
import './Notifications.css';

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: string; label: string; color: string; bgColor: string }
> = {
  revision_due:      { icon: '🔄', label: 'Revision Due',      color: '#8b5cf6', bgColor: '#f3e8ff' },
  missed_study_plan: { icon: '⚠️', label: 'Missed Plan',       color: '#ef4444', bgColor: '#fee2e2' },
  goal_progress:     { icon: '🎯', label: 'Goal Progress',     color: '#10b981', bgColor: '#d1fae5' },
  recommendation:    { icon: '💡', label: 'Recommendation',    color: '#f59e0b', bgColor: '#fef3c7' },
  upcoming_exam:     { icon: '📅', label: 'Upcoming Exam',     color: '#3b82f6', bgColor: '#dbeafe' },
  planner_changes:   { icon: '🗓️', label: 'Planner Changes',   color: '#ec4899', bgColor: '#fce7f3' },
  system:            { icon: '🔔', label: 'System Alert',      color: '#6b7280', bgColor: '#f3f4f6' },
};

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Test Modal State
  const [showTestModal, setShowTestModal] = useState(false);
  const [testForm, setTestForm] = useState({
    title: 'Custom Test Notification',
    message: 'This is an in-app test notification trigger.',
    type: 'revision_due' as NotificationType,
    link: '/study-tracker',
  });

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      let isReadParam: boolean | string | undefined = undefined;
      if (statusFilter === 'unread') isReadParam = false;
      if (statusFilter === 'read') isReadParam = true;

      const data = await notificationService.getNotifications({
        page,
        limit: 15,
        isRead: isReadParam,
        type: typeFilter,
      });

      setNotifications(data.notifications || []);
      setTotal(data.total || 0);
      setUnreadCount(data.unreadCount || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load notifications page:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, statusFilter, typeFilter]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      await notificationService.syncNotifications();
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTestNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await notificationService.createTestNotification({
        title: testForm.title,
        message: testForm.message,
        type: testForm.type,
        link: testForm.link,
      });
      setShowTestModal(false);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
  });

  return (
    <div className="notifications-page-container">
      {/* Navigation Bar */}
      <nav className="page-navbar">
        <div className="nav-brand">
          <Link to="/" className="brand-logo">StudyGauge</Link>
          <span className="brand-divider">/</span>
          <span className="page-title-badge">Notifications Center</span>
        </div>

        <div className="nav-actions">
          <Link to="/planner" className="nav-link">Planner</Link>
          <Link to="/study-tracker" className="nav-link">Tracker</Link>
          <Link to="/goals" className="nav-link">Goals</Link>
          <NotificationBell />
        </div>
      </nav>

      {/* Hero Header */}
      <header className="page-hero">
        <div className="hero-content">
          <h1>In-App Notifications</h1>
          <p>
            Stay updated with your automated study reminders, missed plan warnings, goal achievements,
            upcoming exam deadlines, and planner rebalances.
          </p>
        </div>
        <div className="hero-cta-buttons">
          <button className="btn-primary" onClick={handleSync} disabled={syncing}>
            {syncing ? 'Syncing...' : '🔄 Sync Triggers'}
          </button>
          <button className="btn-secondary" onClick={() => setShowTestModal(true)}>
            ➕ Test In-App Notification
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🔔</div>
          <div className="stat-info">
            <span className="stat-value">{total}</span>
            <span className="stat-label">Total Notifications</span>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">📩</div>
          <div className="stat-info">
            <span className="stat-value">{unreadCount}</span>
            <span className="stat-label">Unread Items</span>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-value">{Math.max(0, total - unreadCount)}</span>
            <span className="stat-label">Read Items</span>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">🛡️</div>
          <div className="stat-info">
            <span className="stat-value">Active</span>
            <span className="stat-label">Deduplication Engine</span>
          </div>
        </div>
      </section>

      {/* Filter and Control Bar */}
      <section className="control-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filters-group">
          <div className="status-tabs">
            <button
              className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => { setStatusFilter('all'); setPage(1); }}
            >
              All
            </button>
            <button
              className={`filter-tab ${statusFilter === 'unread' ? 'active' : ''}`}
              onClick={() => { setStatusFilter('unread'); setPage(1); }}
            >
              Unread ({unreadCount})
            </button>
            <button
              className={`filter-tab ${statusFilter === 'read' ? 'active' : ''}`}
              onClick={() => { setStatusFilter('read'); setPage(1); }}
            >
              Read
            </button>
          </div>

          <select
            className="category-dropdown"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All Categories (6 Types)</option>
            <option value="revision_due">🔄 Revision Due</option>
            <option value="missed_study_plan">⚠️ Missed Study Plan</option>
            <option value="goal_progress">🎯 Goal Progress</option>
            <option value="recommendation">💡 Recommendation</option>
            <option value="upcoming_exam">📅 Upcoming Exam</option>
            <option value="planner_changes">🗓️ Planner Changes</option>
          </select>

          {unreadCount > 0 && (
            <button className="mark-all-btn" onClick={handleMarkAllRead}>
              Mark All as Read
            </button>
          )}
        </div>
      </section>

      {/* Main Notifications List */}
      <main className="notifications-list-section">
        {loading ? (
          <div className="loading-state">Loading your notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔕</div>
            <h3>No notifications found</h3>
            <p>You have no notifications matching the selected filters.</p>
          </div>
        ) : (
          <div className="notifications-card-list">
            {filteredNotifications.map((item) => {
              const typeConf = TYPE_CONFIG[item.type] || TYPE_CONFIG.system;
              return (
                <div
                  key={item._id}
                  className={`notification-card ${!item.isRead ? 'unread-card' : ''}`}
                >
                  <div
                    className="card-type-icon"
                    style={{ backgroundColor: typeConf.bgColor, color: typeConf.color }}
                  >
                    {typeConf.icon}
                  </div>

                  <div className="card-main-content">
                    <div className="card-header-row">
                      <span
                        className="type-badge"
                        style={{ backgroundColor: typeConf.bgColor, color: typeConf.color }}
                      >
                        {typeConf.label}
                      </span>
                      <span className="card-timestamp">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <h3 className="card-title">{item.title}</h3>
                    <p className="card-message">{item.message}</p>

                    <div className="card-meta">
                      <span className="channel-pill">In-App Notification</span>
                      {item.dedupKey && (
                        <span className="dedup-pill" title={`Deduplication Key: ${item.dedupKey}`}>
                          Deduplicated
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="card-actions-column">
                    {item.link && (
                      <button
                        className="navigate-btn"
                        onClick={() => {
                          if (!item.isRead) handleMarkAsRead(item._id);
                          navigate(item.link!);
                        }}
                      >
                        Open Feature →
                      </button>
                    )}

                    {!item.isRead ? (
                      <button className="mark-read-btn" onClick={() => handleMarkAsRead(item._id)}>
                        Mark Read
                      </button>
                    ) : (
                      <span className="read-status-text">Read</span>
                    )}

                    <button className="delete-btn" onClick={() => handleDelete(item._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-bar">
            <button
              className="page-nav-btn"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Previous
            </button>
            <span className="page-indicator">
              Page {page} of {totalPages}
            </span>
            <button
              className="page-nav-btn"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next →
            </button>
          </div>
        )}
      </main>

      {/* Test Modal */}
      {showTestModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Create Test In-App Notification</h3>
              <button className="close-modal-btn" onClick={() => setShowTestModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTestNotification} className="modal-form">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  required
                  value={testForm.title}
                  onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Message</label>
                <textarea
                  required
                  rows={3}
                  value={testForm.message}
                  onChange={(e) => setTestForm({ ...testForm, message: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Notification Category (Type)</label>
                <select
                  value={testForm.type}
                  onChange={(e) =>
                    setTestForm({ ...testForm, type: e.target.value as NotificationType })
                  }
                >
                  <option value="revision_due">🔄 Revision Due</option>
                  <option value="missed_study_plan">⚠️ Missed Study Plan</option>
                  <option value="goal_progress">🎯 Goal Progress</option>
                  <option value="recommendation">💡 Recommendation</option>
                  <option value="upcoming_exam">📅 Upcoming Exam</option>
                  <option value="planner_changes">🗓️ Planner Changes</option>
                </select>
              </div>

              <div className="form-group">
                <label>Navigation Link</label>
                <input
                  type="text"
                  value={testForm.link}
                  onChange={(e) => setTestForm({ ...testForm, link: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowTestModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Generate Notification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
