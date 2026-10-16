import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

interface UserProfile {
  name: string;
  email: string;
  preferredStudyTime: string;
  availableDailyHours: number;
  preparationLevel: string;
  targetInformation: string;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    preferredStudyTime: 'evening',
    availableDailyHours: 2,
    preparationLevel: 'beginner',
    targetInformation: '',
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const res = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile({
          name: res.data.name || '',
          email: res.data.email || '',
          preferredStudyTime: res.data.preferredStudyTime || 'evening',
          availableDailyHours: res.data.availableDailyHours || 0,
          preparationLevel: res.data.preparationLevel || 'beginner',
          targetInformation: res.data.targetInformation || '',
        });
      } catch (err: any) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          setError(err.response?.data?.message || 'Failed to load profile.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: name === 'availableDailyHours' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    // Validation
    if (profile.availableDailyHours < 0 || profile.availableDailyHours > 24) {
      setError('Available daily hours must be between 0 and 24.');
      setSubmitting(false);
      return;
    }
    if (profile.name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      setSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('/api/auth/me', profile, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile({
        name: res.data.name || '',
        email: res.data.email || '',
        preferredStudyTime: res.data.preferredStudyTime || 'evening',
        availableDailyHours: res.data.availableDailyHours || 0,
        preparationLevel: res.data.preparationLevel || 'beginner',
        targetInformation: res.data.targetInformation || '',
      });
      setSuccess('Profile updated successfully!');
      
      // Auto dismiss success message
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h2>My Profile</h2>
          <p>Manage your study preferences and goals</p>
        </div>

        {error && <div className="profile-alert error">{error}</div>}
        {success && <div className="profile-alert success">{success}</div>}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="email">Email Address (Read-only)</label>
            <input
              type="email"
              id="email"
              name="email"
              value={profile.email}
              disabled
              className="disabled-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={profile.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="preferredStudyTime">Preferred Study Time</label>
              <select
                id="preferredStudyTime"
                name="preferredStudyTime"
                value={profile.preferredStudyTime}
                onChange={handleChange}
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
              </select>
            </div>

            <div className="form-group half">
              <label htmlFor="availableDailyHours">Available Daily Hours</label>
              <input
                type="number"
                id="availableDailyHours"
                name="availableDailyHours"
                min="0"
                max="24"
                value={profile.availableDailyHours}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="preparationLevel">Preparation Level</label>
            <div className="custom-select-wrapper">
              <select
                id="preparationLevel"
                name="preparationLevel"
                value={profile.preparationLevel}
                onChange={handleChange}
              >
                <option value="beginner">Beginner - Just starting out</option>
                <option value="intermediate">Intermediate - Some foundation</option>
                <option value="advanced">Advanced - Near ready</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="targetInformation">Target Information (Exam, Goals)</label>
            <textarea
              id="targetInformation"
              name="targetInformation"
              value={profile.targetInformation}
              onChange={handleChange}
              placeholder="E.g., I want to score 99th percentile in CAT 2027"
              rows={4}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate('/my-exams')}>
              Dashboard
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Quick Feature Navigation */}
        <div className="profile-quick-nav">
          <h3>Explore Platform Features</h3>
          <p>Directly jump to any feature from here:</p>

          <div className="quick-nav-grid">
            <button type="button" className="quick-card" onClick={() => navigate('/my-exams')}>
              <span className="quick-icon">📚</span>
              <div className="quick-info">
                <strong>My Exams Hub</strong>
                <span>Manage target exams & syllabus</span>
              </div>
            </button>

            <button type="button" className="quick-card" onClick={() => navigate('/study-tracker')}>
              <span className="quick-icon">⏱️</span>
              <div className="quick-info">
                <strong>Study Tracker</strong>
                <span>Time focused work sessions</span>
              </div>
            </button>

            <button type="button" className="quick-card" onClick={() => navigate('/planner')}>
              <span className="quick-icon">📅</span>
              <div className="quick-info">
                <strong>Study Planner</strong>
                <span>Auto-generated daily schedules</span>
              </div>
            </button>

            <button type="button" className="quick-card" onClick={() => navigate('/goals')}>
              <span className="quick-icon">🎯</span>
              <div className="quick-info">
                <strong>Goal Setting</strong>
                <span>Track preparation milestones</span>
              </div>
            </button>

            <button type="button" className="quick-card" onClick={() => navigate('/mock-tests')}>
              <span className="quick-icon">📝</span>
              <div className="quick-info">
                <strong>Mock Tests</strong>
                <span>Log test performance & analysis</span>
              </div>
            </button>

            <button type="button" className="quick-card" onClick={() => navigate('/analytics')}>
              <span className="quick-icon">📈</span>
              <div className="quick-info">
                <strong>Analytics</strong>
                <span>Visual progress insights</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
