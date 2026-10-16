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

  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const [formData, setFormData] = useState<Partial<StudySessionData>>({
    date: new Date().toISOString().split('T')[0],
    startTime: new Date().toISOString().slice(0, 16),
    studyType: 'Lecture',
    durationMinutes: 0,
    notes: ''
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

    sessions.forEach(session => {
      const sessionDateStr = new Date(session.date).toISOString().split('T')[0];
      const sessionDate = new Date(sessionDateStr);
      const duration = session.durationMinutes || 0;

      studyDates.add(sessionDateStr);

      if (sessionDateStr === todayStr) todayTime += duration;
      if (sessionDate >= weekAgo) weeklyTime += duration;
      if (sessionDate >= monthAgo) monthlyTime += duration;
    });

    // Calculate Streak
    let streak = 0;
    let checkDate = new Date();
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (studyDates.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If today is not studied yet, but yesterday was, it might still be a streak of yesterday
        if (streak === 0 && dateStr === todayStr) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }
    }

    return { todayTime, weeklyTime, monthlyTime, streak };
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      const dateStr = new Date(session.date).toISOString().split('T')[0];
      if (filterType && session.studyType !== filterType) return false;
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
        notes: session.notes || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        startTime: new Date().toISOString().slice(0, 16),
        studyType: 'Lecture',
        durationMinutes: 0,
        notes: ''
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

  return (
    <div className="min-h-screen bg-slate-950/40 text-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-xl">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Study Tracker
            </h1>
            <p className="text-slate-400 text-sm mt-1">Monitor your daily study hours, streaks, and learning habits.</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>+</span> Add Session
          </button>
        </div>

        {/* Study Timer Component */}
        <StudyTimer onSessionSaved={fetchSessions} />

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 p-5 rounded-2xl shadow-xl border border-slate-800/80 backdrop-blur-xl flex flex-col items-center text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Today</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-400">{formatDuration(stats.todayTime)}</span>
          </div>
          <div className="bg-slate-900/60 p-5 rounded-2xl shadow-xl border border-slate-800/80 backdrop-blur-xl flex flex-col items-center text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">This Week</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-400">{formatDuration(stats.weeklyTime)}</span>
          </div>
          <div className="bg-slate-900/60 p-5 rounded-2xl shadow-xl border border-slate-800/80 backdrop-blur-xl flex flex-col items-center text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">This Month</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400">{formatDuration(stats.monthlyTime)}</span>
          </div>
          <div className="bg-slate-900/60 p-5 rounded-2xl shadow-xl border border-slate-800/80 backdrop-blur-xl flex flex-col items-center text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Streak</span>
            <span className="text-2xl sm:text-3xl font-extrabold flex items-center text-amber-400">
              {stats.streak} <span className="text-lg ml-1">🔥</span>
            </span>
          </div>
        </div>

        {/* Filters & History */}
        <div className="bg-slate-900/60 rounded-2xl shadow-xl border border-slate-800/80 backdrop-blur-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80">
            <h2 className="text-lg font-bold text-slate-100">Study History</h2>
            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              <input 
                type="date" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 focus:border-blue-500 outline-none"
              />
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 focus:border-blue-500 outline-none"
              >
                <option value="">All Types</option>
                <option value="Lecture">Lecture</option>
                <option value="Reading">Reading</option>
                <option value="Practice">Practice</option>
                <option value="PYQ">PYQ</option>
                <option value="Mock Test">Mock Test</option>
                <option value="Revision">Revision</option>
              </select>
            </div>
          </div>

          <div className="p-0">
            {loading ? (
              <div className="p-10 text-center text-slate-400">Loading sessions...</div>
            ) : error ? (
              <div className="p-10 text-center text-rose-400 bg-rose-950/30 border border-rose-800/50 m-5 rounded-xl">{error}</div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-800/60 rounded-2xl flex items-center justify-center mb-4 text-2xl border border-slate-700/50">📚</div>
                <h3 className="text-slate-200 font-semibold text-lg">No sessions recorded</h3>
                <p className="text-slate-400 text-sm mt-1">Add a study session to track your history.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-950/50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800/80">
                      <th className="p-4">Date</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Duration</th>
                      <th className="p-4">Notes</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredSessions.map((s) => (
                      <tr key={s._id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 text-sm">
                          <div className="font-semibold text-slate-200">{new Date(s.date).toLocaleDateString()}</div>
                          <div className="text-xs text-slate-400">
                            {new Date(s.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {s.studyType}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-slate-300 text-sm">
                          {formatDuration(s.durationMinutes || 0)}
                        </td>
                        <td className="p-4 text-xs text-slate-400 max-w-xs truncate">
                          {s.notes || '-'}
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <button onClick={() => handleOpenModal(s)} className="text-blue-400 hover:text-blue-300 text-xs font-semibold mr-3">Edit</button>
                          <button onClick={() => handleDelete(s._id!)} className="text-rose-400 hover:text-rose-300 text-xs font-semibold">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <h3 className="text-lg font-bold text-slate-100">{editingId ? 'Edit Session' : 'Add Study Session'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200 rounded-lg p-1 hover:bg-slate-800">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Date</label>
                <input 
                  type="date" 
                  required
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Start Time</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={formData.startTime}
                    onChange={e => setFormData({...formData, startTime: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Duration (mins)</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    value={formData.durationMinutes}
                    onChange={e => setFormData({...formData, durationMinutes: parseInt(e.target.value) || 0})}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Study Type</label>
                <select 
                  required
                  value={formData.studyType}
                  onChange={e => setFormData({...formData, studyType: e.target.value as any})}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 outline-none text-sm"
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
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Notes</label>
                <textarea 
                  rows={3}
                  value={formData.notes || ''}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 outline-none text-sm resize-none"
                  placeholder="What did you study?"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-700 font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center shadow-lg shadow-blue-500/20"
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
