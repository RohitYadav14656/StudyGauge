import { useState, useEffect } from 'react';
import { pyqService, PYQAttemptResponse, PYQStatsData } from '../../services/pyqService';

const PYQPractice = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'bookmarks' | 'revision' | 'attempts'>('all');
  const [pyqs, setPyqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [filters, setFilters] = useState({
    difficulty: '',
    year: '',
    search: '',
  });

  const [stats, setStats] = useState<PYQStatsData | null>(null);

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
        setTimeTaken((prev) => ({
          ...prev,
          [activeQuestion]: (prev[activeQuestion] || 0) + 1,
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
      } else if (activeTab === 'revision') {
        const data = await pyqService.getRevisionList(page, limit);
        setPyqs(data.data.map((item: any) => ({ ...item.pyq, userAttempt: item })));
      } else if (activeTab === 'attempts') {
        const data = await pyqService.getAttempts(page, limit);
        setPyqs(data.data.map((item: any) => ({ ...item.pyq, userAttempt: item })));
      } else {
        const data = await pyqService.getPYQs({
          page,
          limit,
          difficulty: filters.difficulty || undefined,
          year: filters.year ? Number(filters.year) : undefined,
          search: filters.search || undefined,
        });
        setPyqs(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch PYQs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  const handleAttempt = async (pyqId: string, selectedOption: number) => {
    if (attempts[pyqId]) return;
    try {
      const duration = timeTaken[pyqId] || 10;
      const res = await pyqService.attemptPYQ(pyqId, selectedOption, duration);
      setAttempts((prev) => ({ ...prev, [pyqId]: res }));
      fetchStats();
    } catch (err) {
      console.error('Attempt submission failed', err);
    }
  };

  const handleBookmarkToggle = async (pyqId: string) => {
    try {
      const res = await pyqService.toggleBookmark(pyqId);
      setPyqs((prev) =>
        prev.map((p) => {
          if (p._id === pyqId) {
            return {
              ...p,
              userAttempt: {
                ...(p.userAttempt || {}),
                bookmarked: res.bookmarked,
              },
            };
          }
          return p;
        })
      );
      fetchStats();
    } catch (err) {
      console.error('Bookmark toggle failed', err);
    }
  };

  const handleRevisionToggle = async (pyqId: string) => {
    try {
      const res = await pyqService.toggleRevision(pyqId);
      setPyqs((prev) =>
        prev.map((p) => {
          if (p._id === pyqId) {
            return {
              ...p,
              userAttempt: {
                ...(p.userAttempt || {}),
                markedForRevision: res.markedForRevision,
              },
            };
          }
          return p;
        })
      );
      fetchStats();
    } catch (err) {
      console.error('Revision toggle failed', err);
    }
  };

  const startTimer = (pyqId: string) => {
    if (!attempts[pyqId] && activeQuestion !== pyqId) {
      setActiveQuestion(pyqId);
      if (!timeTaken[pyqId]) {
        setTimeTaken((prev) => ({ ...prev, [pyqId]: 0 }));
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      
      <div className="bg-white p-6 rounded-xl border border-slate-200  flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-semibold mb-2">
            <span>📚</span> Previous Year Questions
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Question Bank & Practice
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Solve chapter-wise previous year exam questions with timer, detailed explanations, and review flags.
          </p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-white p-4 rounded-xl border border-slate-200 ">
          <div className="text-center p-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Attempted</span>
            <p className="text-xl font-extrabold text-slate-900">{stats.overall.totalAttempted}</p>
          </div>
          <div className="text-center p-2 border-l border-slate-100">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Correct</span>
            <p className="text-xl font-extrabold text-teal-600">{stats.overall.correct}</p>
          </div>
          <div className="text-center p-2 border-l border-slate-100">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Wrong</span>
            <p className="text-xl font-extrabold text-red-500">{stats.overall.wrong}</p>
          </div>
          <div className="text-center p-2 border-l border-slate-100">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Accuracy</span>
            <p className="text-xl font-extrabold text-indigo-600">
              {stats.overall.totalAttempted > 0 ? `${stats.overall.accuracy}%` : 'N/A'}
            </p>
          </div>
          <div className="text-center p-2 border-l border-slate-100 col-span-2 sm:col-span-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Bookmarks</span>
            <p className="text-xl font-extrabold text-amber-500">{stats.overall.totalBookmarked}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-slate-200  overflow-x-auto">
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
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg whitespace-nowrap  ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white '
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'all' && (
        <div className="bg-white p-4 rounded-xl border border-slate-200  flex flex-wrap gap-3 items-center">
          <input
            type="text"
            name="search"
            placeholder="🔍 Search questions by keywords..."
            value={filters.search}
            onChange={handleFilterChange}
            className="flex-1 min-w-[200px] px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:border-indigo-600"
          />
          <select
            name="difficulty"
            value={filters.difficulty}
            onChange={handleFilterChange}
            className="px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 outline-none focus:border-indigo-600"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <input
            type="number"
            name="year"
            placeholder="Year (e.g. 2024)"
            value={filters.year}
            onChange={handleFilterChange}
            className="w-28 sm:w-32 px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 outline-none focus:border-indigo-600"
          />
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-slate-400 flex justify-center items-center gap-3">
          <div className="w-6 h-6 border-4 border-slate-200 border-t-indigo-600 rounded-xl "></div>
          <span className="text-sm font-medium">Loading questions...</span>
        </div>
      ) : pyqs.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200  p-6">
          <p className="text-slate-500 text-base">No questions found matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pyqs.map((pyq) => {
            const attempt =
              attempts[pyq._id] ||
              (pyq.userAttempt
                ? {
                    success: true,
                    data: pyq.userAttempt,
                    explanation: pyq.explanation,
                    correctOptionIndex: -1,
                  }
                : null);
            const isActive = activeQuestion === pyq._id;
            const isBookmarked = pyq.userAttempt?.bookmarked;
            const isRevision = pyq.userAttempt?.markedForRevision;

            return (
              <div
                key={pyq._id}
                onClick={() => startTimer(pyq._id)}
                className={`bg-white p-6 rounded-xl border ${
                  isActive ? 'border-indigo-600  ring-1 ring-indigo-50' : 'border-slate-200'
                }  `}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <div className="flex gap-2 items-center flex-wrap">
                    <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs px-2.5 py-1 rounded-lg font-bold">
                      {pyq.year}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider ${
                        pyq.difficulty === 'hard'
                          ? 'sg-badge-red'
                          : pyq.difficulty === 'medium'
                          ? 'sg-badge-amber'
                          : 'sg-badge-teal'
                      }`}
                    >
                      {pyq.difficulty}
                    </span>
                    {pyq.marks && (
                      <span className="text-xs text-slate-500 font-semibold">{pyq.marks} Marks</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookmarkToggle(pyq._id);
                      }}
                      className={`px-3 py-1 text-xs rounded-lg font-bold border  ${
                        isBookmarked
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {isBookmarked ? '★ Bookmarked' : '☆ Bookmark'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRevisionToggle(pyq._id);
                      }}
                      className={`px-3 py-1 text-xs rounded-lg font-bold border  ${
                        isRevision
                          ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                          : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {isRevision ? '📝 In Revision' : '+ Revision'}
                    </button>
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-5 leading-relaxed">
                  {pyq.questionText}
                </h3>

                <div className="space-y-2.5 mb-6">
                  {pyq.options?.map((opt: any, oIdx: number) => {
                    const isSelected = attempt?.data?.selectedOptionIndex === oIdx || (attempt?.data as any)?.selectedOption === oIdx;
                    const isAttempted = !!attempt;
                    let optionStyle =
                      'bg-slate-50 border-slate-200 text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/20';

                    if (isAttempted) {
                      if (isSelected) {
                        optionStyle = attempt.data.isCorrect
                          ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold'
                          : 'bg-red-50 border-red-500 text-red-900 font-bold';
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        disabled={isAttempted}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAttempt(pyq._id, oIdx);
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border text-sm  flex items-center justify-between ${optionStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-xl border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-600">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                        {isSelected && (
                          <span className="text-xs font-bold">
                            {attempt?.data?.isCorrect ? '✓ Correct' : '✕ Incorrect'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {attempt && (
                  <div className="bg-teal-50/50 border border-teal-200 rounded-xl p-4 text-xs text-slate-700">
                    <div className="font-bold text-teal-800 mb-1">💡 Detailed Explanation:</div>
                    <p className="leading-relaxed">
                      {attempt.explanation ||
                        pyq.explanation ||
                        'Option explanation registered from official answer keys.'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PYQPractice;
