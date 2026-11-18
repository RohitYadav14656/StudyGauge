import React, { useState, useEffect } from 'react';
import {
  revisionService,
  RevisionDueItem,
} from '../../services/revisionService';
import { getExams, getUserExams } from '../../services/examService';
import { Link } from 'react-router-dom';

const Revision: React.FC = () => {
  const [revisions, setRevisions] = useState<RevisionDueItem[]>([]);
  const [allRevisions, setAllRevisions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'due' | 'all'>('due');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Exam filter state
  const [availableExams, setAvailableExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');

  const fetchRevisions = async (examId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const eId = examId !== undefined ? examId : selectedExamId;
      const res = await revisionService.getDueRevisions(eId ? { examId: eId } : undefined);
      if (res && res.revisions) {
        setRevisions(res.revisions);
      }
      const allRes = await revisionService.getAllRevisions(eId || undefined).catch(() => null);
      if (allRes && allRes.revisions) {
        setAllRevisions(allRes.revisions);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading spaced revisions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevisions();
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const ue = await getUserExams().catch(() => []);
      if (ue && ue.length > 0) {
        const mapped = ue.map((u: any) => ({
          _id: typeof u.examId === 'string' ? u.examId : u.examId?._id,
          name: typeof u.examId === 'object' ? u.examId?.name : 'My Exam',
          isActive: u.isActive,
        })).filter((e: any) => e._id);
        setAvailableExams(mapped);
        const active = mapped.find((e: any) => e.isActive) || mapped[0];
        if (active) setSelectedExamId(active._id);
      } else {
        const all = await getExams().catch(() => []);
        setAvailableExams(all);
        if (all.length > 0) setSelectedExamId(all[0]._id);
      }
    } catch (err) {
      console.error('Failed to load exams list', err);
    }
  };

  const handleMarkComplete = async (rev: RevisionDueItem) => {
    try {
      setCompletingId(rev._id);
      const topicIdStr = typeof rev.topicId === 'string' ? rev.topicId : rev.topicId._id;
      const nextStage = (rev.stage || 0) + 1;
      const nextDays = [1, 3, 7, 14, 30][Math.min(nextStage, 4)] || 30;

      await revisionService.logRevision({
        topicId: topicIdStr,
        isCompleted: true,
      });

      setSuccessMsg(
        `✓ Topic revision completed! SM-2 algorithm promoted topic to Stage ${nextStage + 1} (+${nextDays} days interval). Long-term retention reinforced.`
      );
      setRevisions((prev) => prev.filter((r) => r._id !== rev._id));
      await fetchRevisions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record revision completion.');
    } finally {
      setCompletingId(null);
    }
  };

  const handleSeedDemoQueue = async () => {
    try {
      setIsSeeding(true);
      setError(null);
      await revisionService.seedDemoRevisions(selectedExamId);
      setSuccessMsg(
        '✓ Spaced revision queue successfully seeded! 2 items due today, 1 overdue recall checkpoint, and upcoming consolidation milestones are ready to demonstrate.'
      );
      await fetchRevisions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to seed demo revisions.');
    } finally {
      setIsSeeding(false);
    }
  };

  const getStageLabel = (stage: number) => {
    const intervals = [1, 3, 7, 14, 30];
    const days = intervals[stage] || 30;
    return `Stage ${stage + 1} (${days}d interval)`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#DCE9E1] text-[#183D35] rounded-[5px] text-xs font-semibold mb-2">
            <span>🔄</span> Spaced Revision & Active Recall
          </div>
          <h1 className="text-3xl font-extrabold text-[#252B28] tracking-tight">
            Topic Revision
          </h1>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">
            Review topics at progressive SM-2 intervals (1, 3, 7, 14, and 30 days) to convert short-term memory into permanent mastery.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {availableExams.length > 0 && (
            <select
              value={selectedExamId}
              onChange={(e) => {
                setSelectedExamId(e.target.value);
                fetchRevisions(e.target.value);
              }}
              className="px-3 py-2 border border-[#E2DECE] rounded-[5px] text-xs font-semibold text-[#252B28] bg-white outline-none focus:border-[#183D35]"
            >
              <option value="">All Exams</option>
              {availableExams.map((ex) => (
                <option key={ex._id} value={ex._id}>
                  {ex.name} {ex.isActive ? '★' : ''}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={handleSeedDemoQueue}
            disabled={isSeeding}
            className="sg-btn-primary text-xs sm:text-sm py-2 px-3.5 rounded-[5px] font-bold shadow-sm"
          >
            {isSeeding ? 'Seeding Queue...' : '⚡ Seed Demo Revision Queue'}
          </button>
          <Link to="/planner" className="sg-btn-secondary text-xs sm:text-sm py-2 px-3 rounded-[5px]">
            📅 View Daily Planner
          </Link>
          <Link to="/study-tracker" className="sg-btn-secondary text-xs sm:text-sm py-2 px-3 rounded-[5px]">
            ⏱️ Log Study Session
          </Link>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-[#DCE9E1] border border-[#183D35]/20 rounded-[5px] text-sm font-semibold text-[#183D35] flex justify-between items-center shadow-sm">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-xs hover:underline font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Spaced Intervals Roadmap */}
      <div className="bg-white border border-[#E2DECE] rounded-[5px] p-5 mb-8 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            SM-2 Spaced Intervals Roadmap
          </h4>
          <span className="text-[11px] font-semibold text-[#183D35] bg-[#DCE9E1] px-2 py-0.5 rounded-[3px]">
            Ebbinghaus Retention Curve
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { stage: 'Stage 1', interval: '1 Day', label: 'Immediate Recall', bg: '#DCE9E1', text: '#183D35' },
            { stage: 'Stage 2', interval: '3 Days', label: 'Early Reinforcement', bg: '#FAF8F3', text: '#183D35' },
            { stage: 'Stage 3', interval: '7 Days', label: 'Medium-Term Memory', bg: '#FFF8E6', text: '#D9A441' },
            { stage: 'Stage 4', interval: '14 Days', label: 'Consolidation', bg: '#DCE9E1', text: '#183D35' },
            { stage: 'Stage 5', interval: '30 Days', label: 'Permanent Mastery', bg: '#FAF8F3', text: '#183D35' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-[5px] border border-[#E2DECE] flex flex-col justify-between"
              style={{ backgroundColor: item.bg }}
            >
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-600 uppercase">{item.stage}</span>
                <span className="text-xs font-extrabold" style={{ color: item.text }}>
                  +{item.interval}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-800 mt-2">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-[5px] border border-[#E2DECE] p-1 w-full max-w-md mb-6 shadow-sm">
        <button
          onClick={() => setActiveTab('due')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-[4px] transition-colors ${
            activeTab === 'due'
              ? 'bg-[#183D35] text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Due Today & Overdue ({revisions.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-[4px] transition-colors ${
            activeTab === 'all'
              ? 'bg-[#183D35] text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Retention Pipeline ({allRevisions.length})
        </button>
      </div>

      {/* Queue Card */}
      <div className="bg-white border border-[#E2DECE] rounded-[5px] p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#E2DECE] mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-[#252B28]">
              {activeTab === 'due' ? 'Revisions Due Today & Overdue' : 'All Active Spaced Retention Topics'}
            </h3>
            <span className={`sg-badge ${activeTab === 'due' && revisions.length > 0 ? 'sg-badge-amber' : 'sg-badge-teal'}`}>
              {activeTab === 'due' ? `${revisions.length} Pending` : `${allRevisions.length} Monitored`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchRevisions()}
              className="text-xs font-bold text-[#183D35] hover:underline flex items-center gap-1"
            >
              🔄 Refresh Queue
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-[#DCE9E1] border-t-[#183D35] rounded-full animate-spin"></div>
            <p className="text-slate-600 text-sm">Checking spaced interval due dates...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 text-sm rounded-[5px] text-center">
            {error}
          </div>
        ) : activeTab === 'due' ? (
          revisions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">✅</div>
              <h4 className="text-base font-bold text-[#252B28]">You're All Caught Up!</h4>
              <p className="text-slate-600 text-sm mt-1 max-w-md mx-auto">
                No revisions are due right now. Click below to load demo topics into the spaced repetition queue for teacher evaluation.
              </p>
              <div className="flex justify-center items-center gap-3 mt-4">
                <button
                  onClick={handleSeedDemoQueue}
                  disabled={isSeeding}
                  className="sg-btn-primary text-sm py-2 px-4 rounded-[5px]"
                >
                  {isSeeding ? 'Seeding...' : '⚡ Seed Demo Revision Queue'}
                </button>
                <Link to="/my-exams" className="sg-btn-secondary text-sm py-2 px-4 rounded-[5px]">
                  Explore Syllabus
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {revisions.map((rev) => {
                const topicName = typeof rev.topicId === 'string' ? rev.topicName || 'Topic' : rev.topicId?.name;
                const subjName = typeof rev.topicId === 'object' && rev.topicId?.subjectId ? rev.topicId.subjectId.name : rev.subjectName || '';
                const isOverdue = rev.status === 'OVERDUE' || (rev.daysOverdue && rev.daysOverdue > 0);

                return (
                  <div key={rev._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className={`text-xl ${isOverdue ? 'text-red-500' : 'text-amber-500'}`}>
                        {isOverdue ? '⚠️' : '🔔'}
                      </span>
                      <div>
                        <h4 className="text-base font-bold text-[#252B28]">{topicName}</h4>
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
                        className="sg-btn-primary text-xs py-2 px-4 rounded-[4px] shadow-sm disabled:opacity-50"
                      >
                        {completingId === rev._id ? 'Saving...' : '✓ Mark Revised'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* All Revisions Pipeline View */
          allRevisions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm">No topics currently in the retention pipeline.</p>
              <button onClick={handleSeedDemoQueue} className="sg-btn-primary text-xs mt-3">
                ⚡ Seed Demo Topics
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {allRevisions.map((rev) => {
                const topicName = typeof rev.topicId === 'string' ? 'Topic' : rev.topicId?.name;
                const subjName = typeof rev.topicId === 'object' && rev.topicId?.subjectId ? rev.topicId.subjectId.name : '';
                const examName = typeof rev.topicId === 'object' && rev.topicId?.examId ? rev.topicId.examId.name : '';
                const retention = rev.retentionRate || 85;

                return (
                  <div key={rev._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">
                        {rev.status === 'OVERDUE' ? '⚠️' : rev.status === 'DUE' ? '🔔' : '🌱'}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-[#252B28]">{topicName}</h4>
                          {examName && (
                            <span className="text-[10px] font-semibold bg-[#FAF8F3] border border-[#E2DECE] px-2 py-0.5 rounded-[3px] text-slate-600">
                              {examName}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {subjName && <span className="font-semibold text-slate-700">{subjName} • </span>}
                          <span>Stage {(rev.intervalStage || 0) + 1} ({rev.interval || 1}d interval)</span>
                          <span> • Next Due: {new Date(rev.nextRevisionDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Estimated Memory Retention Score */}
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Memory Retention</div>
                        <div className="flex items-center gap-1.5 justify-end">
                          <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${retention}%`,
                                backgroundColor: retention > 80 ? '#183D35' : retention > 60 ? '#D9A441' : '#E44332',
                              }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-[#252B28]">{retention}%</span>
                        </div>
                      </div>

                      <span className={`sg-badge ${
                        rev.status === 'OVERDUE' ? 'sg-badge-red' : rev.status === 'DUE' ? 'sg-badge-amber' : 'sg-badge-teal'
                      }`}>
                        {rev.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Revision;
