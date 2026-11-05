import React, { useEffect, useState } from 'react';
import { getAdminUsers, updateUserRole, deleteAdminUser } from '../../../services/adminService';
import './AdminUsers.css';

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  preferredStudyTime?: string;
  availableDailyHours?: number;
  preparationLevel?: string;
  createdAt: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'admin'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminUsers();
      if (res && res.users) {
        setUsers(res.users);
      } else {
        setUsers([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleRole = async (user: UserItem) => {
    const newRole = user.role === 'admin' ? 'student' : 'admin';
    const confirmMsg = `Are you sure you want to change ${user.name}'s role to ${newRole.toUpperCase()}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setUpdatingId(user._id);
      await updateUserRole(user._id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, role: newRole } : u))
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user role.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (user: UserItem) => {
    if (!window.confirm(`Delete user ${user.name} (${user.email}) permanently?`)) return;

    try {
      setUpdatingId(user._id);
      await deleteAdminUser(user._id);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.name.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }
    return true;
  });

  const totalStudents = users.filter((u) => u.role === 'student').length;
  const totalAdmins = users.filter((u) => u.role === 'admin').length;

  return (
    <div className="admin-users-container">
      <div className="admin-users-header">
        <div>
          <h2>User Accounts & Permissions</h2>
          <p>Inspect registered student accounts, manage administrator privileges, and monitor prep levels.</p>
        </div>

        <button
          onClick={fetchUsers}
          className="btn-save"
          style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
        >
          🔄 Refresh Users
        </button>
      </div>

      <div className="users-stats-row">
        <div className="user-stat-card">
          <span className="label">Total Registered</span>
          <span className="value">{users.length}</span>
        </div>
        <div className="user-stat-card">
          <span className="label">Active Students</span>
          <span className="value" style={{ color: '#38bdf8' }}>
            {totalStudents}
          </span>
        </div>
        <div className="user-stat-card">
          <span className="label">Platform Admins</span>
          <span className="value" style={{ color: '#ef4444' }}>
            {totalAdmins}
          </span>
        </div>
      </div>

      <div className="pyqs-filters-bar">
        <div className="pyqs-filter-item">
          <label>Role Filter:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="pyqs-filter-select"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        <div className="pyqs-filter-item" style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pyqs-search-input"
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">Loading User Records...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="admin-table-container" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <h3 style={{ color: '#f1f5f9', margin: '0 0 0.5rem 0' }}>No Users Found</h3>
          <p style={{ color: '#94a3b8', margin: 0 }}>
            No accounts match the current filter criteria.
          </p>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Prep Level</th>
                <th>Joined Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isWorking = updatingId === u._id;
                return (
                  <tr key={u._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#f8fafc' }}>{u.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{u.email}</div>
                    </td>
                    <td>
                      <span
                        className={`role-badge ${
                          u.role === 'admin' ? 'role-admin' : 'role-student'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className="exam-badge">
                        {u.preparationLevel || 'Beginner'}
                      </span>
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                      {new Date(u.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          disabled={isWorking}
                          onClick={() => handleToggleRole(u)}
                          className="btn-toggle-role"
                          title={`Switch to ${u.role === 'admin' ? 'Student' : 'Admin'}`}
                        >
                          {isWorking
                            ? 'Updating...'
                            : u.role === 'admin'
                            ? 'Demote to Student'
                            : 'Promote to Admin'}
                        </button>
                        <button
                          disabled={isWorking}
                          onClick={() => handleDelete(u)}
                          className="btn-delete-item"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

