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

    setFormData((prev) => ({
      ...prev,
      period,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.targetValue) {
      alert('Please fill out all required fields');
      return;
    }
    try {
      setSubmitting(true);
      await goalService.create(formData as GoalData);
      await fetchGoals();
      setIsModalOpen(false);
      setFormData({
        title: '',
        period: activeTab,
        metric: 'study_hours',
        targetValue: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: GoalData['status']) => {
    try {
      await goalService.update(id, { status });
      await fetchGoals();
    } catch (err: any) {
      alert('Error updating goal status');
    }
  };

  const filteredGoals = useMemo(() => {
    return goals.filter((g) => g.period === activeTab);
  }, [goals, activeTab]);

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'study_hours':
        return 'Hours';
      case 'topics_completed':
        return 'Topics';
      case 'pyqs_attempted':
        return 'PYQs';
      case 'mock_tests_completed':
        return 'Tests';
      default:
        return '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 text-slate-900">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 ">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-semibold mb-2">
            <span>🎯</span> Study Goals
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Target Goals & Milestones
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Set daily, weekly, monthly, and long-term targets and monitor real-time completion status.
          </p>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="sg-btn-primary text-sm ">
          <span>+</span> Create Goal
        </button>
      </div>

      <div className="flex bg-white rounded-xl  border border-slate-200 p-1 w-full max-w-md overflow-x-auto">
        {['daily', 'weekly', 'monthly', 'long-term'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-lg capitalize whitespace-nowrap  ${
              activeTab === tab
                ? 'bg-indigo-600 text-white '
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading goals...</div>
      ) : error ? (
        <div className="text-center py-20 text-red-600 bg-red-50 border border-red-200 rounded-xl">
          {error}
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl  border border-slate-200 p-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center text-3xl mb-4 border border-slate-200">
            🎯
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            No {activeTab.replace('-', ' ')} goals yet
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            Create a goal to start tracking your milestone progress against actual prep.
          </p>
          <button onClick={() => setIsModalOpen(true)} className="sg-btn-primary mt-6 text-sm">
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map((goal) => {
            const current = goal.currentValue || 0;
            const target = goal.targetValue;
            let percentage = Math.round((current / target) * 100);
            if (percentage > 100) percentage = 100;

            const isAchieved = goal.status === 'achieved';
            const isFailed = goal.status === 'failed' || goal.status === 'abandoned';

            return (
              <div
                key={goal._id}
                className="bg-white rounded-xl p-6  border border-slate-200 flex flex-col justify-between hover: "
              >
                <div>
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <h3 className="font-bold text-slate-900 text-lg line-clamp-1" title={goal.title}>
                      {goal.title}
                    </h3>
                    <span
                      className={`sg-badge ${
                        isAchieved ? 'sg-badge-teal' : isFailed ? 'sg-badge-red' : 'sg-badge-indigo'
                      }`}
                    >
                      {goal.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-xs font-semibold text-slate-500">
                      <span>Progress</span>
                      <span className="text-slate-900 font-bold">
                        {current} / {target} {getMetricLabel(goal.metric)} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-xl overflow-hidden border border-slate-200">
                      <div
                        className={`h-full rounded-xl   ${
                          isAchieved ? 'bg-teal-600' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1 mb-6">
                    <div>
                      Starts: {new Date(goal.startDate).toLocaleDateString()}
                    </div>
                    <div>
                      Target Date: {new Date(goal.endDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  {goal.status === 'in-progress' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(goal._id!, 'achieved')}
                        className="sg-btn-primary flex-1 text-xs py-2"
                      >
                        ✓ Mark Achieved
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(goal._id!, 'abandoned')}
                        className="px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                      >
                        Abandon
                      </button>
                    </>
                  )}
                  {goal.status !== 'in-progress' && (
                    <button
                      onClick={() => handleUpdateStatus(goal._id!, 'in-progress')}
                      className="sg-btn-secondary w-full text-xs py-2"
                    >
                      Reopen Goal
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md border border-slate-200  p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Create New Goal</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Goal Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete 20 hours of OS & DBMS"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-900 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Timeframe
                  </label>
                  <select
                    value={formData.period}
                    onChange={handlePeriodChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-900 outline-none focus:border-indigo-600"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="long-term">Long-Term</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Target Metric
                  </label>
                  <select
                    value={formData.metric}
                    onChange={(e) => setFormData({ ...formData, metric: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-900 outline-none focus:border-indigo-600"
                  >
                    <option value="study_hours">Study Hours</option>
                    <option value="topics_completed">Topics Done</option>
                    <option value="pyqs_attempted">PYQs Solved</option>
                    <option value="mock_tests_completed">Mock Tests</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Target Value ({getMetricLabel(formData.metric || '')})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.targetValue || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, targetValue: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-900 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-600"
                  />
                </div>
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
                  {submitting ? 'Creating...' : 'Set Goal'}
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
