import React, { useState, useEffect, useMemo } from 'react';
import { mockTestService, MockTestData } from '../../services/mockTestService';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MockTestManager: React.FC = () => {
  const [mockTests, setMockTests] = useState<MockTestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Filters
  const [filterExam, setFilterExam] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('All');

  const [formData, setFormData] = useState<Partial<MockTestData>>({
    testName: '',
    exam: '',
    date: new Date().toISOString().split('T')[0],
    totalMarks: 300,
    obtainedMarks: 0,
    questionsAttempted: 0,
    correct: 0,
    wrong: 0,
    timeTaken: 180,
    subjectPerformance: [],
    topicPerformance: []
  });

  const [subjectInput, setSubjectInput] = useState({ subject: '', score: 0 });
  const [topicInput, setTopicInput] = useState({ topic: '', score: 0 });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchMockTests();
  }, []);

  const fetchMockTests = async () => {
    try {
      setLoading(true);
      const data = await mockTestService.getMockTests();
      setMockTests(data || []);
    } catch (error) {
      console.error('Error fetching mock tests', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = () => {
    if (subjectInput.subject.trim() === '') return;
    setFormData({
      ...formData,
      subjectPerformance: [...(formData.subjectPerformance || []), { ...subjectInput }]
    });
    setSubjectInput({ subject: '', score: 0 });
  };

  const handleAddTopic = () => {
    if (topicInput.topic.trim() === '') return;
    setFormData({
      ...formData,
      topicPerformance: [...(formData.topicPerformance || []), { ...topicInput }]
    });
    setTopicInput({ topic: '', score: 0 });
  };

  const removeSubject = (index: number) => {
    const updated = [...(formData.subjectPerformance || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, subjectPerformance: updated });
  };

  const removeTopic = (index: number) => {
    const updated = [...(formData.topicPerformance || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, topicPerformance: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if ((formData.correct || 0) + (formData.wrong || 0) > (formData.questionsAttempted || 0)) {
        setFormError('Correct + Wrong answers cannot exceed total questions attempted.');
        return;
    }
    if ((formData.obtainedMarks || 0) > (formData.totalMarks || 0)) {
        setFormError('Obtained marks cannot exceed total maximum marks.');
        return;
    }

    try {
      setSubmitting(true);
      await mockTestService.createMockTest(formData);
      await fetchMockTests();
      setShowAddModal(false);
      setFormData({
        testName: '',
        exam: '',
        date: new Date().toISOString().split('T')[0],
        totalMarks: 300,
        obtainedMarks: 0,
        questionsAttempted: 0,
        correct: 0,
        wrong: 0,
        timeTaken: 180,
        subjectPerformance: [],
        topicPerformance: []
      });
    } catch (error: any) {
      setFormError(error.response?.data?.message || 'Error saving mock test result.');
    } finally {
      setSubmitting(false);
    }
  };

  const uniqueExams = useMemo(() => {
    const exams = new Set(mockTests.map(t => t.exam).filter(Boolean));
    return ['All', ...Array.from(exams)];
  }, [mockTests]);

  const filteredTests = useMemo(() => {
    return mockTests.filter(t => {
      const examMatch = filterExam === 'All' || t.exam === filterExam;
      let dateMatch = true;
      if (filterDateRange !== 'All') {
        const testDate = new Date(t.date).getTime();
        const now = new Date().getTime();
        const diffDays = (now - testDate) / (1000 * 3600 * 24);
        if (filterDateRange === 'Last 7 Days') dateMatch = diffDays <= 7;
        if (filterDateRange === 'Last 30 Days') dateMatch = diffDays <= 30;
        if (filterDateRange === 'Last 90 Days') dateMatch = diffDays <= 90;
      }
      return examMatch && dateMatch;
    });
  }, [mockTests, filterExam, filterDateRange]);

  const chartData = useMemo(() => {
    return [...filteredTests].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(t => {
      const scorePerc = t.totalMarks > 0 ? (t.obtainedMarks / t.totalMarks) * 100 : 0;
      const accuracyPerc = t.questionsAttempted > 0 ? (t.correct / t.questionsAttempted) * 100 : 0;
      return {
        name: new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        testName: t.testName,
        Score: Math.round(scorePerc),
        Accuracy: Math.round(accuracyPerc),
        Attempted: t.questionsAttempted,
        Time: t.timeTaken
      };
    });
  }, [filteredTests]);

  // Overall aggregate stats
  const aggregateStats = useMemo(() => {
    if (filteredTests.length === 0) {
      return { avgScore: 0, avgAccuracy: 0, totalTests: 0, highestScore: 0 };
    }
    let totalScorePerc = 0;
    let totalAccuracy = 0;
    let highest = 0;

    filteredTests.forEach(t => {
      const p = t.totalMarks > 0 ? Math.round((t.obtainedMarks / t.totalMarks) * 100) : 0;
      const a = t.questionsAttempted > 0 ? Math.round((t.correct / t.questionsAttempted) * 100) : 0;
      totalScorePerc += p;
      totalAccuracy += a;
      if (t.obtainedMarks > highest) highest = t.obtainedMarks;
    });

    return {
      totalTests: filteredTests.length,
      avgScore: Math.round(totalScorePerc / filteredTests.length),
      avgAccuracy: Math.round(totalAccuracy / filteredTests.length),
      highestScore: highest
    };
  }, [filteredTests]);

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Hero Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30 mb-3">
              📝 Exam Evaluation Center
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Mock Test Performance
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl">
              Log timed attempts, assess mark splits, discover accuracy trends, and eliminate negative marks before exam day.
            </p>
          </div>

          <button 
            onClick={() => setShowAddModal(true)}
            className="relative z-10 w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-sky-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span>
            <span>Record Test Attempt</span>
          </button>
        </div>

        {/* Aggregate KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 backdrop-blur-xl flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Attempts</span>
            <div className="text-3xl font-black text-white mt-2">{aggregateStats.totalTests}</div>
            <span className="text-xs text-slate-500 mt-1">Logged assessments</span>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 backdrop-blur-xl flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Score</span>
            <div className="text-3xl font-black text-sky-400 mt-2">{aggregateStats.avgScore}%</div>
            <span className="text-xs text-slate-500 mt-1">Across all filtered tests</span>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 backdrop-blur-xl flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Mean Accuracy</span>
            <div className="text-3xl font-black text-emerald-400 mt-2">{aggregateStats.avgAccuracy}%</div>
            <span className="text-xs text-slate-500 mt-1">Correct / Attempted ratio</span>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 backdrop-blur-xl flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Highest Score</span>
            <div className="text-3xl font-black text-amber-400 mt-2">{aggregateStats.highestScore}</div>
            <span className="text-xs text-slate-500 mt-1">Personal peak marks</span>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/10 backdrop-blur-xl shadow-xl flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Exam:</span>
            <select 
              value={filterExam} 
              onChange={(e) => setFilterExam(e.target.value)}
              className="px-3.5 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 outline-none focus:border-sky-500 transition-colors"
            >
              {uniqueExams.map(ex => <option key={ex} value={ex}>{ex}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Time Range:</span>
            <select 
              value={filterDateRange} 
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="px-3.5 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 outline-none focus:border-sky-500 transition-colors"
            >
              <option value="All">All Time</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 90 Days">Last 90 Days</option>
            </select>
          </div>

          <div className="ml-auto text-xs sm:text-sm text-slate-400 font-medium">
            Showing <span className="text-sky-400 font-bold">{filteredTests.length}</span> tests
          </div>
        </div>

        {/* Analytics Charts */}
        {!loading && filteredTests.length > 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/10 backdrop-blur-xl shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-white text-base">Score & Accuracy Trajectory</h3>
                  <p className="text-xs text-slate-400">Percentage progression over time</p>
                </div>
                <span className="text-xs font-mono text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">Line Chart</span>
              </div>
              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 11}} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" tick={{fill: '#94a3b8', fontSize: 11}} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0b0f19', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.6)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#38bdf8', marginBottom: '4px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '16px', color: '#94a3b8' }} iconType="circle" />
                    <Line yAxisId="left" type="monotone" dataKey="Score" stroke="#38bdf8" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#070a12'}} activeDot={{r: 6}} />
                    <Line yAxisId="left" type="monotone" dataKey="Accuracy" stroke="#34d399" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#070a12'}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/10 backdrop-blur-xl shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-white text-base">Attempt Rate & Pace Analysis</h3>
                  <p className="text-xs text-slate-400">Questions attempted vs. test duration</p>
                </div>
                <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">Bar Chart</span>
              </div>
              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 11}} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" orientation="left" tick={{fill: '#94a3b8', fontSize: 11}} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{fill: '#94a3b8', fontSize: 11}} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0b0f19', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.6)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#38bdf8', marginBottom: '4px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '16px', color: '#94a3b8' }} iconType="circle" />
                    <Bar yAxisId="left" dataKey="Attempted" name="Questions Attempted" fill="#818cf8" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    <Bar yAxisId="right" dataKey="Time" name="Time Spent (min)" fill="#fbbf24" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Tests Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col justify-center items-center gap-3">
            <div className="w-8 h-8 border-3 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading evaluation records...</span>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/60 rounded-3xl border border-white/10 shadow-xl backdrop-blur-xl p-8">
            <div className="w-16 h-16 bg-slate-800/60 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-white/5">
              📝
            </div>
            <h3 className="text-lg font-bold text-white">No Mock Tests Found</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
              Start recording full mock exams or chapter tests to unlock dynamic accuracy curves.
            </p>
            {mockTests.length > 0 ? (
              <button 
                onClick={() => { setFilterExam('All'); setFilterDateRange('All'); }} 
                className="mt-5 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold rounded-xl text-sm transition-all"
              >
                Reset Filters
              </button>
            ) : (
              <button 
                onClick={() => setShowAddModal(true)} 
                className="mt-5 px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-sky-500/25"
              >
                Add Your First Test Result
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((test) => {
              const percentage = test.totalMarks > 0 ? Math.round((test.obtainedMarks / test.totalMarks) * 100) : 0;
              const accuracy = test.questionsAttempted > 0 ? Math.round((test.correct / test.questionsAttempted) * 100) : 0;

              return (
                <div 
                  key={test._id} 
                  className="bg-slate-900/60 p-6 rounded-2xl border border-white/10 backdrop-blur-xl shadow-xl hover:border-sky-500/40 hover:-translate-y-1 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4 gap-2">
                      <div>
                        <h3 className="font-bold text-lg text-white line-clamp-1" title={test.testName}>
                          {test.testName}
                        </h3>
                        <span className="text-xs text-sky-400 font-semibold uppercase tracking-wider">
                          {test.exam || 'General Mock'}
                        </span>
                      </div>
                      <span className="bg-slate-950/80 text-slate-400 border border-white/5 text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap">
                        {new Date(test.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Score Bar */}
                    <div className="space-y-3 mb-6">
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1.5">
                          <span className="text-slate-400">Score Achieved</span>
                          <span className="text-white font-bold">{test.obtainedMarks} / {test.totalMarks} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className={`h-full rounded-full transition-all duration-700 ${
                              percentage >= 80 ? 'bg-emerald-500' : percentage >= 60 ? 'bg-sky-500' : percentage >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Accuracy Bar */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1.5">
                          <span className="text-slate-400">Accuracy Rate</span>
                          <span className="text-emerald-400 font-bold">{accuracy}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                            style={{ width: `${Math.min(accuracy, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Footer */}
                  <div className="grid grid-cols-4 gap-2 text-center border-t border-white/10 pt-4 bg-slate-950/40 -mx-6 -mb-6 p-4 rounded-b-2xl">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Attempt</span>
                      <span className="text-sm font-bold text-white">{test.questionsAttempted}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Correct</span>
                      <span className="text-sm font-bold text-emerald-400">{test.correct}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Wrong</span>
                      <span className="text-sm font-bold text-rose-400">{test.wrong}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Time</span>
                      <span className="text-sm font-bold text-amber-300">{test.timeTaken}m</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl w-full max-w-2xl border border-white/10 shadow-2xl my-8 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-slate-900/90 backdrop-blur border-b border-white/10 px-6 py-5 flex justify-between items-center rounded-t-3xl z-10">
              <div>
                <h2 className="text-xl font-bold text-white">Record Mock Test Result</h2>
                <p className="text-xs text-slate-400 mt-0.5">Input your exam metrics for automated trend analytics</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="text-slate-400 hover:text-white bg-slate-800/80 p-2 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {formError && (
                <div className="mb-6 p-4 bg-rose-950/40 text-rose-300 border border-rose-800/60 rounded-2xl text-sm font-semibold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Test Name</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.testName} 
                      onChange={e => setFormData({...formData, testName: e.target.value})} 
                      className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white focus:border-sky-500 outline-none text-sm" 
                      placeholder="e.g. JEE Full Length Test 04" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Target Exam</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.exam} 
                      onChange={e => setFormData({...formData, exam: e.target.value})} 
                      className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white focus:border-sky-500 outline-none text-sm" 
                      placeholder="e.g. JEE Main, NEET, GATE" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Date Attempted</label>
                    <input 
                      type="date" 
                      required 
                      value={formData.date as string} 
                      onChange={e => setFormData({...formData, date: e.target.value})} 
                      className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white focus:border-sky-500 outline-none text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Time Taken (Minutes)</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      value={formData.timeTaken || ''} 
                      onChange={e => setFormData({...formData, timeTaken: Number(e.target.value)})} 
                      className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white focus:border-sky-500 outline-none text-sm" 
                      placeholder="180"
                    />
                  </div>
                </div>

                {/* Score Section */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-950/60 rounded-2xl border border-white/5">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Total Marks</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      value={formData.totalMarks || ''} 
                      onChange={e => setFormData({...formData, totalMarks: Number(e.target.value)})} 
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-sky-500 text-sm font-semibold" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Obtained Marks</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      value={formData.obtainedMarks || ''} 
                      onChange={e => setFormData({...formData, obtainedMarks: Number(e.target.value)})} 
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-sky-500 font-bold text-sky-400 text-sm" 
                    />
                  </div>
                </div>

                {/* Question Breakdown */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-950/60 rounded-2xl border border-white/5">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Attempted</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      value={formData.questionsAttempted || ''} 
                      onChange={e => setFormData({...formData, questionsAttempted: Number(e.target.value)})} 
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-sky-500 text-sm font-semibold" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Correct</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      value={formData.correct || ''} 
                      onChange={e => setFormData({...formData, correct: Number(e.target.value)})} 
                      className="w-full px-3.5 py-2 bg-slate-900 border border-emerald-500/30 text-emerald-400 rounded-xl outline-none focus:border-emerald-500 text-sm font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Wrong</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      value={formData.wrong || ''} 
                      onChange={e => setFormData({...formData, wrong: Number(e.target.value)})} 
                      className="w-full px-3.5 py-2 bg-slate-900 border border-rose-500/30 text-rose-400 rounded-xl outline-none focus:border-rose-500 text-sm font-bold" 
                    />
                  </div>
                </div>

                {/* Optional Subject Split */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Subject Performance (Optional)</label>
                  <div className="flex gap-3 mb-3">
                    <input 
                      type="text" 
                      placeholder="e.g. Physics" 
                      value={subjectInput.subject} 
                      onChange={e => setSubjectInput({...subjectInput, subject: e.target.value})} 
                      className="flex-1 px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm outline-none focus:border-sky-500" 
                    />
                    <input 
                      type="number" 
                      placeholder="Score" 
                      value={subjectInput.score || ''} 
                      onChange={e => setSubjectInput({...subjectInput, score: Number(e.target.value)})} 
                      className="w-24 px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm outline-none focus:border-sky-500" 
                    />
                    <button 
                      type="button" 
                      onClick={handleAddSubject} 
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl"
                    >
                      Add
                    </button>
                  </div>
                  {formData.subjectPerformance && formData.subjectPerformance.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.subjectPerformance.map((s, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 border border-slate-700 text-slate-200 rounded-full text-xs font-semibold">
                          {s.subject}: {s.score}
                          <button type="button" onClick={() => removeSubject(idx)} className="text-slate-400 hover:text-rose-400 ml-1">✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Optional Topic Split */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Topic Highlights (Optional)</label>
                  <div className="flex gap-3 mb-3">
                    <input 
                      type="text" 
                      placeholder="e.g. Mechanics" 
                      value={topicInput.topic} 
                      onChange={e => setTopicInput({...topicInput, topic: e.target.value})} 
                      className="flex-1 px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm outline-none focus:border-sky-500" 
                    />
                    <input 
                      type="number" 
                      placeholder="Score" 
                      value={topicInput.score || ''} 
                      onChange={e => setTopicInput({...topicInput, score: Number(e.target.value)})} 
                      className="w-24 px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm outline-none focus:border-sky-500" 
                    />
                    <button 
                      type="button" 
                      onClick={handleAddTopic} 
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl"
                    >
                      Add
                    </button>
                  </div>
                  {formData.topicPerformance && formData.topicPerformance.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.topicPerformance.map((t, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 border border-slate-700 text-slate-200 rounded-full text-xs font-semibold">
                          {t.topic}: {t.score}
                          <button type="button" onClick={() => removeTopic(idx)} className="text-slate-400 hover:text-rose-400 ml-1">✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-white/10 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="px-6 py-3 bg-slate-800 text-slate-300 border border-slate-700 rounded-xl font-semibold hover:bg-slate-700 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-sky-500/25 transition-all flex justify-center items-center text-sm disabled:opacity-50"
                >
                  {submitting ? 'Saving Attempt...' : 'Save Mock Test Result'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockTestManager;
