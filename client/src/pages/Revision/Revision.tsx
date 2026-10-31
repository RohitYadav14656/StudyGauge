import React, { useState, useEffect } from 'react';
import {
  revisionService,
  RevisionDueItem,
} from '../../services/revisionService';
import { Link } from 'react-router-dom';

const Revision: React.FC = () => {
  const [revisions, setRevisions] = useState<RevisionDueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const fetchRevisions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await revisionService.getDueRevisions();
      if (res && res.revisions) {
        setRevisions(res.revisions);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading spaced revisions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevisions();
  }, []);

  const handleMarkComplete = async (rev: RevisionDueItem) => {
    try {
      setCompletingId(rev._id);
      const topicIdStr = typeof rev.topicId === 'string' ? rev.topicId : rev.topicId._id;
      await revisionService.logRevision({
        topicId: topicIdStr,
        isCompleted: true,
      });

      setRevisions((prev) => prev.filter((r) => r._id !== rev._id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record revision completion.');
    } finally {
      setCompletingId(null);
    }
  };

  const getStageLabel = (stage: number) => {
    const intervals = [1, 3, 7, 14, 30];
    const days = intervals[stage] || 30;
    return `Stage ${stage + 1} (${days} days interval)`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-700 rounded-xl text-xs font-semibold mb-2">
            <span>🔄</span> Spaced Revision
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Topic Revision
          </h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">
            Review topics at set intervals (1, 3, 7, 14, and 30 days) to retain concepts long-term.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/study-tracker" className="sg-btn-secondary text-sm">
            ⏱️ Log Revision Study
          </Link>
          <Link to="/planner" className="sg-btn-primary text-sm">
            📅 View Daily Planner
          </Link>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-8 ">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Spaced Intervals Roadmap
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { stage: 'Stage 1', interval: '1 Day', label: 'Immediate Recall', bg: '#EEF2FF', text: '#4F46E5' },
            { stage: 'Stage 2', interval: '3 Days', label: 'Early Reinforcement', bg: '#F0FDFA', text: '#0D9488' },
            { stage: 'Stage 3', interval: '7 Days', label: 'Medium-Term Memory', bg: '#FFFBEB', text: '#F59E0B' },
            { stage: 'Stage 4', interval: '14 Days', label: 'Consolidation', bg: '#EEF2FF', text: '#4F46E5' },
            { stage: 'Stage 5', interval: '30 Days', label: 'Permanent Mastery', bg: '#F0FDFA', text: '#0D9488' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl border border-slate-100 flex flex-col justify-between"
              style={{ backgroundColor: item.bg }}
            >
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase">{item.stage}</span>
                <span className="text-xs font-extrabold" style={{ color: item.text }}>
                  +{item.interval}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 mt-2">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 ">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-900">Revisions Due Today & Overdue</h3>
            <span className="sg-badge sg-badge-amber">
              {revisions.length} Pending
            </span>
          </div>

          <button onClick={fetchRevisions} className="text-xs font-bold text-indigo-600 hover:underline">
            🔄 Refresh Queue
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-xl "></div>
            <p className="text-slate-500 text-sm">Checking spaced interval due dates...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl text-center">
            {error}
          </div>
        ) : revisions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">✅</div>
            <h4 className="text-base font-bold text-slate-800">You're All Caught Up!</h4>
            <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
              No revisions are due right now. Mark completed topics in your syllabus or finish study sessions to schedule automatic spaced intervals.
            </p>
            <Link to="/my-exams" className="sg-btn-primary mt-4 inline-block text-sm">
              Explore Syllabus Topics
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {revisions.map((rev) => {
              const topicName = typeof rev.topicId === 'string' ? rev.topicName || 'Topic' : rev.topicId.name;
              const subjName = typeof rev.topicId === 'object' && rev.topicId.subjectId ? rev.topicId.subjectId.name : rev.subjectName || '';
              const isOverdue = rev.status === 'OVERDUE' || (rev.daysOverdue && rev.daysOverdue > 0);

              return (
                <div key={rev._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className={`text-xl ${isOverdue ? 'text-red-500' : 'text-amber-500'}`}>
                      {isOverdue ? '⚠️' : '🔔'}
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{topicName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {subjName && <span className="font-semibold text-slate-700">{subjName} • </span>}
                        <span>{getStageLabel(rev.stage || 0)}</span>
                        {rev.revisionCount > 0 && <span> • Revised {rev.revisionCount} time(s)</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`sg-badge ${isOverdue ? 'sg-badge-red' : 'sg-badge-amber'}`}>
                      {isOverdue ? `Overdue by ${rev.daysOverdue || 1}d` : 'Due Today'}
                    </span>

                    <button
                      onClick={() => handleMarkComplete(rev)}
                      disabled={completingId === rev._id}
                      className="sg-btn-primary text-xs py-2 px-4 -none disabled:opacity-50"
                    >
                      {completingId === rev._id ? 'Saving...' : '✓ Mark Revised'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Revision;

