import React, { useState, useEffect, useMemo } from 'react';
import { goalService, GoalData } from '../../services/goalService';

const Goals = () => {
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'long-term'>('weekly');

  const [formData, setFormData] = useState<Partial<GoalData>>({
    title: '',
    period: 'weekly',
    metric: 'study_hours',
    targetValue: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await goalService.getAll();
      setGoals(res || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  // Update default dates when period changes
  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const period = e.target.value as any;
    const start = new Date();
    const end = new Date();
    
    if (period === 'daily') {
      end.setDate(end.getDate() + 1);
    } else if (period === 'weekly') {
      end.setDate(end.getDate() + 7);
    } else if (period === 'monthly') {
      end.setMonth(end.getMonth() + 1);
    } else if (period === 'long-term') {
      end.setFullYear(end.getFullYear() + 1);
    }

    setFormData(prev => ({
      ...prev,
      period,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await goalService.create(formData as GoalData);
      await fetchGoals();
      setIsModalOpen(false);
      setFormData({
        title: '',
        period: 'weekly',
        metric: 'study_hours',
        targetValue: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await goalService.update(id, { status } as any);
      await fetchGoals();
    } catch (err: any) {
      alert('Error updating goal status');
    }
  };

  const filteredGoals = useMemo(() => {
    return goals.filter(g => g.period === activeTab);
  }, [goals, activeTab]);

  const getMetricLabel = (metric: string) => {
    switch(metric) {
      case 'study_hours': return 'Hours';
      case 'topics_completed': return 'Topics';
      case 'pyqs_attempted': return 'PYQs';
      case 'mock_tests_completed': return 'Tests';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950/40 text-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-xl">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Target Goals
            </h1>
            <p className="text-slate-400 text-sm mt-1">Set preparation targets and monitor real-time completion status.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>+</span> Create Goal
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-900/80 rounded-xl shadow-lg border border-slate-800 p-1 w-full max-w-md overflow-x-auto">
          {['daily', 'weekly', 'monthly', 'long-term'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg capitalize whitespace-nowrap transition-all ${
                activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Goals Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading goals...</div>
        ) : error ? (
          <div className="text-center py-20 text-rose-400 bg-rose-950/30 border border-rose-800/50 rounded-xl">{error}</div>
        ) : filteredGoals.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/60 rounded-2xl shadow-xl border border-slate-800/80 backdrop-blur-xl flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-800/60 rounded-2xl flex items-center justify-center text-2xl mb-4 border border-slate-700/50">🎯</div>
            <h3 className="text-lg font-semibold text-slate-200">No {activeTab.replace('-', ' ')} goals yet</h3>
            <p className="text-slate-400 text-sm mt-1">Create a goal to start tracking your milestone progress.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGoals.map((goal) => {
              const current = goal.currentValue || 0;
              const target = goal.targetValue;
              let percentage = Math.round((current / target) * 100);
              if (percentage > 100) percentage = 100;

              let statusColor = 'bg-blue-500';
              let badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
              if (goal.status === 'achieved') {
                statusColor = 'bg-emerald-500';
                badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
              } else if (goal.status === 'failed' || goal.status === 'abandoned') {
                statusColor = 'bg-rose-500';
                badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
              }

              return (
                <div key={goal._id} className="bg-slate-900/60 rounded-2xl p-6 shadow-xl border border-slate-800/80 backdrop-blur-xl flex flex-col justify-between hover:border-slate-700 transition-all">
                  <div>
                    <div className="flex justify-between items-start mb-4 gap-2">
                      <h3 className="font-bold text-slate-100 text-lg line-clamp-1" title={goal.title}>{goal.title}</h3>
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold capitalize whitespace-nowrap ${badgeColor}`}>
                        {goal.status}
                      </span>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex justify-between text-xs font-semibold mb-2">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-slate-200">{current} / {target} {getMetricLabel(goal.metric)} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                        <div 
                          className={`h-3 rounded-full transition-all duration-1000 ${statusColor}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center mt-3 text-xs text-slate-500 font-medium">
                        <span>Starts: {new Date(goal.startDate).toLocaleDateString()}</span>
                        <span>Ends: {new Date(goal.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {goal.status === 'in-progress' && (
                    <div className="mt-6 pt-4 border-t border-slate-800/80 flex gap-2">
                      {percentage >= 100 ? (
                        <button 
                          onClick={() => handleUpdateStatus(goal._id!, 'achieved')}
                          className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-xl transition-colors"
                        >
                          ✓ Mark Achieved
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUpdateStatus(goal._id!, 'abandoned')}
                          className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                        >
                          Abandon Goal
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <h3 className="text-lg font-bold text-slate-100">Create Target Goal</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200 rounded-lg p-1 hover:bg-slate-800">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Goal Title</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 outline-none text-sm"
                  placeholder="e.g. Complete 5 Mock Tests"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Period</label>
                  <select 
                    required
                    value={formData.period}
                    onChange={handlePeriodChange}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 outline-none text-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="long-term">Long Term</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Metric</label>
                  <select 
                    required
                    value={formData.metric}
                    onChange={e => setFormData({...formData, metric: e.target.value as any})}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 outline-none text-sm"
                  >
                    <option value="study_hours">Study Hours</option>
                    <option value="topics_completed">Topics</option>
                    <option value="pyqs_attempted">PYQs</option>
                    <option value="mock_tests_completed">Mock Tests</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Target Value</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  value={formData.targetValue || ''}
                  onChange={e => setFormData({...formData, targetValue: Number(e.target.value)})}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Start Date</label>
                  <input 
                    type="date" 
                    required
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">End Date</label>
                  <input 
                    type="date" 
                    required
                    value={formData.endDate}
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 outline-none text-xs"
                  />
                </div>
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
                  {submitting ? 'Saving...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
