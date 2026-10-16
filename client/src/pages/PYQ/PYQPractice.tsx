import { useState, useEffect } from 'react';
import { pyqService, PYQAttemptResponse, PYQStatsData } from '../../services/pyqService';

const PYQPractice = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'bookmarks' | 'revision' | 'attempts'>('all');
  const [pyqs, setPyqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  const [filters, setFilters] = useState({
    difficulty: '',
    year: '',
    search: ''
  });

  const [stats, setStats] = useState<PYQStatsData | null>(null);

  // Keep track of user attempts: { [pyqId]: PYQAttemptResponse }
  const [attempts, setAttempts] = useState<Record<string, PYQAttemptResponse>>({});
  const [timeTaken, setTimeTaken] = useState<Record<string, number>>({});
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchPYQs();
  }, [page, filters, activeTab]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeQuestion && !attempts[activeQuestion]) {
      interval = setInterval(() => {
        setTimeTaken(prev => ({
          ...prev,
          [activeQuestion]: (prev[activeQuestion] || 0) + 1
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeQuestion, attempts]);

  const fetchStats = async () => {
    try {
      const res = await pyqService.getPYQStats();
      if (res.success) setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  const fetchPYQs = async () => {
    try {
      setLoading(true);
      if (activeTab === 'bookmarks') {
        const data = await pyqService.getBookmarks(page, limit);
        setPyqs(data.data.map((item: any) => ({ ...item.pyq, userAttempt: item })));
        setTotal(data.pagination.total);
      } else if (activeTab === 'revision') {
        const data = await pyqService.getRevisionList(page, limit);
        setPyqs(data.data.map((item: any) => ({ ...item.pyq, userAttempt: item })));
        setTotal(data.pagination.total);
      } else if (activeTab === 'attempts') {
        const data = await pyqService.getAttempts(page, limit);
        setPyqs(data.data.map((item: any) => ({ ...item.pyq, userAttempt: item })));
        setTotal(data.pagination.total);
      } else {
        const data = await pyqService.getPYQs({ 
          page, 
          limit, 
          difficulty: filters.difficulty || undefined, 
          year: filters.year ? Number(filters.year) : undefined,
          search: filters.search || undefined
        });
        setPyqs(data.data);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching PYQs', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  const handleAttempt = async (pyqId: string, optionIndex: number) => {
    if (attempts[pyqId]) return;
    try {
      const response = await pyqService.attemptPYQ(pyqId, optionIndex, timeTaken[pyqId] || 1);
      setAttempts(prev => ({ ...prev, [pyqId]: response }));
      fetchStats(); // update stats live
    } catch (error) {
      console.error('Error submitting attempt', error);
    }
  };

  const toggleBookmark = async (pyqId: string) => {
    try {
      await pyqService.toggleBookmark(pyqId);
      fetchPYQs();
      fetchStats();
    } catch (err) {
      console.error('Bookmark toggle failed', err);
    }
  };

  const toggleRevision = async (pyqId: string) => {
    try {
      await pyqService.toggleRevision(pyqId);
      fetchPYQs();
      fetchStats();
    } catch (err) {
      console.error('Revision toggle failed', err);
    }
  };

  const startTimer = (pyqId: string) => {
    if (!attempts[pyqId] && activeQuestion !== pyqId) {
      setActiveQuestion(pyqId);
      if (!timeTaken[pyqId]) {
        setTimeTaken(prev => ({ ...prev, [pyqId]: 0 }));
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950/40 text-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            PYQ Practice Module
          </h1>
          <p className="text-slate-400 text-sm mt-1">Practice previous year exam questions, bookmark tricky problems, and review timed attempts.</p>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-xl">
            <div className="text-center p-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Attempted</span>
              <p className="text-xl font-black text-slate-100">{stats.overall.totalAttempted}</p>
            </div>
            <div className="text-center p-2 border-l border-slate-800">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Correct</span>
              <p className="text-xl font-black text-emerald-400">{stats.overall.correct}</p>
            </div>
            <div className="text-center p-2 border-l border-slate-800">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Wrong</span>
              <p className="text-xl font-black text-rose-400">{stats.overall.wrong}</p>
            </div>
            <div className="text-center p-2 border-l border-slate-800">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Accuracy</span>
              <p className="text-xl font-black text-blue-400">{stats.overall.accuracy}%</p>
            </div>
            <div className="text-center p-2 border-l border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Bookmarks</span>
              <p className="text-xl font-black text-amber-400">{stats.overall.totalBookmarked}</p>
            </div>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          {[
            { id: 'all', label: '📖 All Questions' },
            { id: 'bookmarks', label: '🔖 Bookmarks' },
            { id: 'revision', label: '📝 Mark for Revision' },
            { id: 'attempts', label: '⏱ Attempt History' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setPage(1);
              }}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 bg-slate-900/60 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters & Search */}
        {activeTab === 'all' && (
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-wrap gap-3 items-center">
            <input
              type="text"
              name="search"
              placeholder="🔍 Search questions or tags..."
              value={filters.search}
              onChange={handleFilterChange}
              className="flex-1 min-w-[200px] px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 outline-none focus:border-blue-500"
            />
            <select
              name="difficulty"
              value={filters.difficulty}
              onChange={handleFilterChange}
              className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 outline-none focus:border-blue-500"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <input
              type="number"
              name="year"
              placeholder="Year (e.g. 2023)"
              value={filters.year}
              onChange={handleFilterChange}
              className="w-28 sm:w-32 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 outline-none focus:border-blue-500"
            />
          </div>
        )}

        {/* Questions List */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 flex justify-center items-center gap-3">
            <div className="w-5 h-5 border-4 border-blue-400 border-t-blue-600 rounded-full animate-spin"></div>
            Loading questions...
          </div>
        ) : pyqs.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/60 rounded-2xl border border-slate-800/80 shadow-xl backdrop-blur-xl">
            <p className="text-slate-400 text-base sm:text-lg">No questions found matching your criteria.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pyqs.map((pyq) => {
              const attempt = attempts[pyq._id] || (pyq.userAttempt ? {
                success: true,
                data: pyq.userAttempt,
                explanation: pyq.explanation,
                correctOptionIndex: -1 // server strips isCorrect in browse view
              } : null);
              const isActive = activeQuestion === pyq._id;
              const isBookmarked = pyq.userAttempt?.bookmarked;
              const isRevision = pyq.userAttempt?.markedForRevision;

              return (
                <div
                  key={pyq._id}
                  onClick={() => startTimer(pyq._id)}
                  className={`bg-slate-900/60 p-6 rounded-2xl border ${isActive ? 'border-blue-500/80 shadow-lg shadow-blue-500/10' : 'border-slate-800/80'} backdrop-blur-xl shadow-xl transition-all`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                    <div className="flex gap-2 items-center flex-wrap">
                      <span className="bg-slate-950 text-slate-300 border border-slate-800 text-xs px-2.5 py-1 rounded-lg font-bold">
                        {pyq.year}
                      </span>
                      {pyq.examId?.name && (
                        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-2.5 py-1 rounded-lg font-semibold">
                          {pyq.examId.name}
                        </span>
                      )}
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-extrabold uppercase tracking-wide
                        ${pyq.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          pyq.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}
                      >
                        {pyq.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs w-full sm:w-auto justify-between sm:justify-end">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleBookmark(pyq._id); }}
                        className={`px-2.5 py-1 rounded-lg font-semibold border transition-all ${isBookmarked ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'border-slate-800 text-slate-400 hover:text-amber-400'}`}
                        title="Bookmark"
                      >
                        {isBookmarked ? '🔖 Bookmarked' : '🔖 Bookmark'}
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); toggleRevision(pyq._id); }}
                        className={`px-2.5 py-1 rounded-lg font-semibold border transition-all ${isRevision ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'border-slate-800 text-slate-400 hover:text-purple-400'}`}
                        title="Mark for Revision"
                      >
                        {isRevision ? '📝 In Revision' : '📝 Revise'}
                      </button>

                      <span className="text-slate-400 font-mono">⏱ {timeTaken[pyq._id] || 0}s</span>
                    </div>
                  </div>
                  
                  <h3 className="text-base sm:text-lg font-bold text-slate-100 mb-5 leading-relaxed">{pyq.questionText}</h3>
                  
                  <div className="space-y-3">
                    {pyq.options?.map((opt: any, idx: number) => {
                      const isAttempted = !!attempt && attempt.data.selectedOptionIndex >= 0;
                      const isSelected = attempt?.data.selectedOptionIndex === idx;
                      const isCorrectOpt = attempt?.correctOptionIndex === idx;
                      
                      let btnClass = "w-full text-left px-4 py-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-between ";
                      if (!isAttempted) {
                        btnClass += "border-slate-800 bg-slate-950/80 hover:border-blue-500/60 hover:bg-slate-800/60 text-slate-200";
                      } else {
                        if (isCorrectOpt) {
                          btnClass += "border-emerald-500/80 bg-emerald-950/30 text-emerald-300";
                        } else if (isSelected && !isCorrectOpt) {
                          btnClass += "border-rose-500/80 bg-rose-950/30 text-rose-300";
                        } else {
                          btnClass += "border-slate-800 bg-slate-950/30 text-slate-500 opacity-60";
                        }
                      }

                      return (
                        <button 
                          key={idx} 
                          disabled={isAttempted}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAttempt(pyq._id, idx);
                          }}
                          className={btnClass}
                        >
                          <div className="flex items-center gap-2">
                            <span className="inline-block w-5 text-slate-400 font-bold">{String.fromCharCode(65 + idx)}.</span>
                            <span>{opt.text}</span>
                          </div>
                          {isAttempted && isCorrectOpt && <span className="text-emerald-400 font-bold text-xs ml-2">✓ Correct</span>}
                          {isAttempted && isSelected && !isCorrectOpt && <span className="text-rose-400 font-bold text-xs ml-2">✗ Selected</span>}
                        </button>
                      );
                    })}
                  </div>

                  {attempt && attempt.explanation && (
                    <div className="mt-6 p-4 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs sm:text-sm text-blue-200">
                      <div className="font-bold mb-1 flex items-center gap-2 text-blue-400">
                        <span>💡 Explanation</span>
                      </div>
                      <p className="leading-relaxed">{attempt.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex justify-center items-center gap-3 pt-6">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 border border-slate-800 bg-slate-900 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <span className="text-xs sm:text-sm text-slate-400 font-medium">Page {page} of {Math.ceil(total / limit)}</span>
            <button 
              disabled={page >= Math.ceil(total / limit)} 
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 border border-slate-800 bg-slate-900 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PYQPractice;
