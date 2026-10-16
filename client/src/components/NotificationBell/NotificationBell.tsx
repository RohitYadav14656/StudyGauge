import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  notificationService,
  NotificationItem,
  NotificationType,
} from '../../services/notificationService';
import './NotificationBell.css';

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

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Ignore background errors
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const isReadParam = activeTab === 'unread' ? false : undefined;
      const data = await notificationService.getNotifications({
        limit: 15,
        isRead: isReadParam,
        type: selectedType,
      });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const data = await notificationService.syncNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to sync notifications:', err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, activeTab, selectedType]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      const item = notifications.find((n) => n._id === id);
      if (item && !item.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemClick = (notification: NotificationItem) => {
    if (!notification.isRead) {
      notificationService.markAsRead(notification._id).catch(() => {});
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
      );
    }
    setIsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className={`bell-trigger-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="In-App Notifications"
        aria-label="In-App Notifications"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>

        {unreadCount > 0 && (
          <span className="unread-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-popover">
          {/* Header */}
          <div className="popover-header">
            <div className="header-left">
              <h3>Notifications</h3>
              {unreadCount > 0 && <span className="header-badge">{unreadCount} new</span>}
            </div>

            <div className="header-actions">
              <button
                className="icon-btn"
                onClick={handleSync}
                disabled={syncing}
                title="Check for new notifications"
              >
                <span className={syncing ? 'spinning' : ''}>🔄</span>
              </button>
              {unreadCount > 0 && (
                <button className="text-action-btn" onClick={handleMarkAllRead}>
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="popover-filters">
            <div className="popover-tabs">
              <button
                className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All
              </button>
              <button
                className={`tab-btn ${activeTab === 'unread' ? 'active' : ''}`}
                onClick={() => setActiveTab('unread')}
              >
                Unread
              </button>
            </div>

            <select
              className="type-filter-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="revision_due">🔄 Revision Due</option>
              <option value="missed_study_plan">⚠️ Missed Plan</option>
              <option value="goal_progress">🎯 Goal Progress</option>
              <option value="recommendation">💡 Recommendation</option>
              <option value="upcoming_exam">📅 Upcoming Exam</option>
              <option value="planner_changes">🗓️ Planner Changes</option>
            </select>
          </div>

          {/* List Content */}
          <div className="popover-body">
            {loading ? (
              <div className="popover-state-msg">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="popover-empty">
                <span className="empty-icon">🔕</span>
                <p>No notifications found</p>
              </div>
            ) : (
              <div className="notification-list">
                {notifications.map((item) => {
                  const typeConf = TYPE_CONFIG[item.type] || TYPE_CONFIG.system;
                  return (
                    <div
                      key={item._id}
                      className={`notification-item ${!item.isRead ? 'unread' : ''}`}
                      onClick={() => handleItemClick(item)}
                    >
                      <div
                        className="item-icon-wrapper"
                        style={{ backgroundColor: typeConf.bgColor, color: typeConf.color }}
                      >
                        {typeConf.icon}
                      </div>

                      <div className="item-content">
                        <div className="item-header">
                          <span className="item-title">{item.title}</span>
                          <span className="item-time">{formatTimeAgo(item.createdAt)}</span>
                        </div>
                        <p className="item-message">{item.message}</p>
                      </div>

                      <div className="item-actions">
                        {!item.isRead && (
                          <button
                            className="action-dot-btn"
                            title="Mark as read"
                            onClick={(e) => handleMarkAsRead(item._id, e)}
                          >
                            <span className="blue-dot" />
                          </button>
                        )}
                        <button
                          className="delete-item-btn"
                          title="Delete notification"
                          onClick={(e) => handleDelete(item._id, e)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="popover-footer">
            <button
              className="view-all-btn"
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
            >
              View All Notifications Center →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
