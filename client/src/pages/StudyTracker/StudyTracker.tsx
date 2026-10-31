import React, { useState, useEffect, useMemo } from 'react';
import { studySessionService, StudySessionData } from '../../services/studySessionService';
import StudyTimer from './StudyTimer';

const StudyTracker = () => {
  const [sessions, setSessions] = useState<StudySessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [filterType, setFilterType] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const [formData, setFormData] = useState<Partial<StudySessionData>>({
    date: new Date().toISOString().split('T')[0],
    startTime: new Date().toISOString().slice(0, 16),
    studyType: 'Lecture',
    durationMinutes: 0,
    notes: '',
  });

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await studySessionService.getAll();
      setSessions(res.data || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let todayTime = 0;
    let weeklyTime = 0;
    let monthlyTime = 0;
    const studyDates = new Set<string>();

    sessions.forEach((session) => {
      const sessionDateStr = new Date(session.date).toISOString().split('T')[0];
      const sessionDate = new Date(sessionDateStr);
      const duration = session.durationMinutes || 0;

      studyDates.add(sessionDateStr);

      if (sessionDateStr === todayStr) todayTime += duration;
      if (sessionDate >= weekAgo) weeklyTime += duration;
      if (sessionDate >= monthAgo) monthlyTime += duration;
    });

    let streak = 0;
    let checkDate = new Date();
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (studyDates.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {

        if (streak === 0 && checkDate.toDateString() === new Date().toDateString()) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }
    }

    return { todayTime, weeklyTime, monthlyTime, streak };
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (filterType && s.studyType !== filterType) return false;
      const dateStr = new Date(s.date).toISOString().split('T')[0];
      if (filterDate && dateStr !== filterDate) return false;
      return true;
    });
  }, [sessions, filterType, filterDate]);

  const handleOpenModal = (session?: StudySessionData) => {
    if (session) {
      setEditingId(session._id || null);
      setFormData({
        date: new Date(session.date).toISOString().split('T')[0],
        startTime: new Date(session.startTime).toISOString().slice(0, 16),
        endTime: session.endTime ? new Date(session.endTime).toISOString().slice(0, 16) : '',
        durationMinutes: session.durationMinutes || 0,
        studyType: session.studyType,
        notes: session.notes || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        startTime: new Date().toISOString().slice(0, 16),
        studyType: 'Lecture',
        durationMinutes: 0,
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingId) {
        await studySessionService.update(editingId, formData);
      } else {
        await studySessionService.create(formData as StudySessionData);
      }
      await fetchSessions();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    try {
      await studySessionService.delete(id);
      await fetchSessions();
    } catch (err: any) {
      alert('Error deleting session');
    }
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const getStudyTypeBadge = (type: string) => {
    switch (type) {
      case 'Lecture':
        return 'sg-badge-indigo';
      case 'Reading':
        return 'sg-badge-teal';
      case 'Practice':
      case 'PYQ':
        return 'sg-badge-amber';
      case 'Mock Test':
        return 'sg-badge-red';
      case 'Revision':
        return 'bg-purple-50 text-purple-700 border border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 ">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-semibold mb-2">
            <span>⏱️</span> Study Tracker
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Study Session Tracker
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Monitor your daily study hours, streaks, and subject focus blocks.
          </p>
        </div>

        <button onClick={() => handleOpenModal()} className="sg-btn-primary text-sm ">
          <span>+</span> Manual Entry
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">
          {error}
        </div>
      )}

      <StudyTimer onSessionSaved={fetchSessions} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl  border border-slate-200 flex flex-col items-center text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Today</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
            {formatDuration(stats.todayTime)}
          </span>
          <span className="text-xs text-slate-400 mt-1">Logged today</span>
        </div>

        <div className="bg-white p-5 rounded-xl  border border-slate-200 flex flex-col items-center text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Last 7 Days</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-teal-600">
            {formatDuration(stats.weeklyTime)}
          </span>
          <span className="text-xs text-slate-400 mt-1">Weekly total</span>
        </div>

        <div className="bg-white p-5 rounded-xl  border border-slate-200 flex flex-col items-center text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Last 30 Days</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {formatDuration(stats.monthlyTime)}
          </span>
          <span className="text-xs text-slate-400 mt-1">Monthly velocity</span>
        </div>

        <div className="bg-white p-5 rounded-xl  border border-slate-200 flex flex-col items-center text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Study Streak</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-500">
            {stats.streak} <span className="text-base font-semibold">days</span>
          </span>
          <span className="text-xs text-slate-400 mt-1">🔥 Current run</span>
        </div>
      </div>

      <div className="bg-white rounded-xl  border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="text-lg font-bold text-slate-900">Logged Study Sessions</h3>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600"
            >
              <option value="">All Types</option>
              <option value="Lecture">Lecture</option>
              <option value="Reading">Reading</option>
              <option value="Practice">Practice</option>
              <option value="PYQ">PYQ</option>
              <option value="Mock Test">Mock Test</option>
              <option value="Revision">Revision</option>
            </select>

            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600"
            />

            {(filterType || filterDate) && (
              <button
                onClick={() => {
                  setFilterType('');
                  setFilterDate('');
                }}
                className="text-xs text-indigo-600 font-bold hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading session history...</div>
        ) : filteredSessions.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            No sessions match the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSessions.map((session) => (
                  <tr key={session._id} className="hover:bg-slate-50/50 ">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {new Date(session.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`sg-badge ${getStudyTypeBadge(session.studyType)}`}>
                        {session.studyType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {session.durationMinutes} mins
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {session.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(session)}
                        className="text-xs font-bold text-indigo-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(session._id!)}
                        className="text-xs font-bold text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md border border-slate-200  p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingId ? 'Edit Study Session' : 'Log Manual Study Session'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-900 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Category
                </label>
                <select
                  value={formData.studyType}
                  onChange={(e) => setFormData({ ...formData, studyType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-900 outline-none focus:border-indigo-600"
                >
                  <option value="Lecture">Lecture</option>
                  <option value="Reading">Reading</option>
                  <option value="Practice">Practice</option>
                  <option value="PYQ">PYQ</option>
                  <option value="Mock Test">Mock Test</option>
                  <option value="Revision">Revision</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.durationMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, durationMinutes: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-900 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-900 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="sg-btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="sg-btn-primary text-xs py-2 px-5 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyTracker;
