import React, { useState, useEffect, useMemo } from 'react';
import { mockTestService, MockTestData } from '../../services/mockTestService';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MockTestManager: React.FC = () => {
  const [mockTests, setMockTests] = useState<MockTestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 text-slate-900">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-200 mb-2">
            📝 Test Analytics
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Mock Test Performance
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            Log timed attempts, assess mark splits, discover accuracy trends, and identify weak topics before exam day.
          </p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="sg-btn-primary px-5 py-2.5 text-sm font-bold"
        >
          <span>+</span>
          <span>Record Test Attempt</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Attempts</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{aggregateStats.totalTests}</div>
          <span className="text-xs text-slate-400 mt-1">Logged tests</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Score</span>
          <div className="text-3xl font-extrabold text-indigo-600 mt-2">
            {aggregateStats.totalTests > 0 ? `${aggregateStats.avgScore}%` : 'N/A'}
          </div>
          <span className="text-xs text-slate-400 mt-1">Filtered tests average</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Accuracy</span>
          <div className="text-3xl font-extrabold text-teal-600 mt-2">
            {aggregateStats.totalTests > 0 ? `${aggregateStats.avgAccuracy}%` : 'N/A'}
          </div>
          <span className="text-xs text-slate-400 mt-1">Correct / Attempted ratio</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Highest Score</span>
          <div className="text-3xl font-extrabold text-amber-500 mt-2">
            {aggregateStats.totalTests > 0 ? aggregateStats.highestScore : 'N/A'}
          </div>
          <span className="text-xs text-slate-400 mt-1">Peak score achieved</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Exam:</span>
          <select 
            value={filterExam} 
            onChange={(e) => setFilterExam(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:border-indigo-600"
          >
            {uniqueExams.map(ex => <option key={ex} value={ex}>{ex}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Time Range:</span>
          <select 
            value={filterDateRange} 
            onChange={(e) => setFilterDateRange(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:border-indigo-600"
          >
            <option value="All">All History</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="Last 90 Days">Last 90 Days</option>
          </select>
        </div>

        <div className="ml-auto text-xs sm:text-sm text-slate-500 font-medium">
          Showing <span className="text-indigo-600 font-bold">{filteredTests.length}</span> tests
        </div>
      </div>

      {!loading && filteredTests.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Score & Accuracy Trajectory</h3>
                <p className="text-xs text-slate-500">Percentage progression over time</p>
              </div>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200">Line Chart</span>
            </div>
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{fill: '#64748B', fontSize: 11}} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" tick={{fill: '#64748B', fontSize: 11}} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', color: '#252B28', boxShadow: 'none' }}
                    labelStyle={{ fontWeight: 'bold', color: '#183D35', marginBottom: '4px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '16px', color: '#64748B' }} iconType="circle" />
                  <Line yAxisId="left" type="monotone" dataKey="Score" stroke="#183D35" strokeWidth={2.5} dot={{r: 4, strokeWidth: 2, fill: '#FFFFFF'}} activeDot={{r: 6}} />
                  <Line yAxisId="left" type="monotone" dataKey="Accuracy" stroke="#0D9488" strokeWidth={2.5} dot={{r: 4, strokeWidth: 2, fill: '#FFFFFF'}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Attempt Rate & Pace Analysis</h3>
                <p className="text-xs text-slate-500">Questions attempted vs. test duration</p>
              </div>
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200">Bar Chart</span>
            </div>
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{fill: '#64748B', fontSize: 11}} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" orientation="left" tick={{fill: '#64748B', fontSize: 11}} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{fill: '#64748B', fontSize: 11}} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', color: '#252B28', boxShadow: 'none' }}
                    labelStyle={{ fontWeight: 'bold', color: '#183D35', marginBottom: '4px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '16px', color: '#64748B' }} iconType="circle" />
                  <Bar yAxisId="left" dataKey="Attempted" name="Questions Attempted" fill="#183D35" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Bar yAxisId="right" dataKey="Time" name="Time Spent (min)" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col justify-center items-center gap-3">
          <span>Loading mock test records...</span>
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200 p-8">
          <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-3xl mx-auto mb-4 border border-slate-200">
            📝
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Mock Tests Found</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            Start recording full mock exams or chapter tests to track accuracy and score progression.
          </p>
          {mockTests.length > 0 ? (
            <button 
              onClick={() => { setFilterExam('All'); setFilterDateRange('All'); }} 
              className="mt-5 sg-btn-secondary text-sm font-semibold"
            >
              Reset Filters
            </button>
          ) : (
            <button 
              onClick={() => setShowAddModal(true)} 
              className="mt-5 sg-btn-primary text-sm font-bold"
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
                className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 line-clamp-1" title={test.testName}>
                        {test.testName}
                      </h3>
                      <span className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">
                        {test.exam || 'General Mock'}
                      </span>
                    </div>
                    <span className="bg-slate-50 text-slate-600 border border-slate-200 text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap">
                      {new Date(test.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1.5">
                        <span className="text-slate-500">Score Achieved</span>
                        <span className="text-slate-900 font-bold">{test.obtainedMarks} / {test.totalMarks} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-xl overflow-hidden border border-slate-200">
                        <div 
                          className={`h-full rounded-xl ${
                            percentage >= 80 ? 'bg-teal-600' : percentage >= 60 ? 'bg-indigo-600' : percentage >= 40 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1.5">
                        <span className="text-slate-500">Accuracy Rate</span>
                        <span className="text-teal-600 font-bold">{accuracy}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-xl overflow-hidden border border-slate-200">
                        <div 
                          className="h-full rounded-xl bg-teal-500"
                          style={{ width: `${Math.min(accuracy, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center border-t border-slate-100 pt-4 bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-xl">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Attempt</span>
                    <span className="text-sm font-bold text-slate-800">{test.questionsAttempted}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Correct</span>
                    <span className="text-sm font-bold text-teal-600">{test.correct}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Wrong</span>
                    <span className="text-sm font-bold text-red-500">{test.wrong}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Time</span>
                    <span className="text-sm font-bold text-amber-600">{test.timeTaken}m</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl border border-slate-200 my-8 relative">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-5 flex justify-between items-center rounded-t-xl z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Record Mock Test Result</h2>
                <p className="text-xs text-slate-500 mt-0.5">Input your exam metrics for automated trend analytics</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-xl"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {formError && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Test Name</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.testName} 
                      onChange={e => setFormData({...formData, testName: e.target.value})} 
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:border-indigo-600 outline-none text-sm" 
                      placeholder="e.g. GATE CS Full Test 04" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Target Exam</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.exam} 
                      onChange={e => setFormData({...formData, exam: e.target.value})} 
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:border-indigo-600 outline-none text-sm" 
                      placeholder="e.g. GATE CS, CAT, UPSC" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Date Attempted</label>
                    <input 
                      type="date" 
                      required 
                      value={formData.date as string} 
                      onChange={e => setFormData({...formData, date: e.target.value})} 
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:border-indigo-600 outline-none text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Time Taken (Minutes)</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      value={formData.timeTaken || ''} 
                      onChange={e => setFormData({...formData, timeTaken: Number(e.target.value)})} 
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:border-indigo-600 outline-none text-sm" 
                      placeholder="180"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Total Marks</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      value={formData.totalMarks || ''} 
                      onChange={e => setFormData({...formData, totalMarks: Number(e.target.value)})} 
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-indigo-600 text-sm font-semibold" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Obtained Marks</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      value={formData.obtainedMarks || ''} 
                      onChange={e => setFormData({...formData, obtainedMarks: Number(e.target.value)})} 
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-600 font-bold text-indigo-600 text-sm" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Attempted</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      value={formData.questionsAttempted || ''} 
                      onChange={e => setFormData({...formData, questionsAttempted: Number(e.target.value)})} 
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-indigo-600 text-sm font-semibold" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Correct</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      value={formData.correct || ''} 
                      onChange={e => setFormData({...formData, correct: Number(e.target.value)})} 
                      className="w-full px-3 py-2 bg-white border border-slate-300 text-teal-700 rounded-xl outline-none focus:border-teal-600 text-sm font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Wrong</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      value={formData.wrong || ''} 
                      onChange={e => setFormData({...formData, wrong: Number(e.target.value)})} 
                      className="w-full px-3 py-2 bg-white border border-slate-300 text-red-600 rounded-xl outline-none focus:border-red-600 text-sm font-bold" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Subject Performance (Optional)</label>
                  <div className="flex gap-2 mb-2">
                    <input 
                      type="text" 
                      placeholder="e.g. Mathematics" 
                      value={subjectInput.subject} 
                      onChange={e => setSubjectInput({...subjectInput, subject: e.target.value})} 
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm outline-none focus:border-indigo-600" 
                    />
                    <input 
                      type="number" 
                      placeholder="Score" 
                      value={subjectInput.score || ''} 
                      onChange={e => setSubjectInput({...subjectInput, score: Number(e.target.value)})} 
                      className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm outline-none focus:border-indigo-600" 
                    />
                    <button 
                      type="button" 
                      onClick={handleAddSubject} 
                      className="sg-btn-secondary text-xs px-4"
                    >
                      Add
                    </button>
                  </div>
                  {formData.subjectPerformance && formData.subjectPerformance.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.subjectPerformance.map((s, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-semibold">
                          {s.subject}: {s.score}
                          <button type="button" onClick={() => removeSubject(idx)} className="text-slate-400 hover:text-red-500 ml-1">✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Topic Highlights (Optional)</label>
                  <div className="flex gap-2 mb-2">
                    <input 
                      type="text" 
                      placeholder="e.g. Operating Systems" 
                      value={topicInput.topic} 
                      onChange={e => setTopicInput({...topicInput, topic: e.target.value})} 
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm outline-none focus:border-indigo-600" 
                    />
                    <input 
                      type="number" 
                      placeholder="Score" 
                      value={topicInput.score || ''} 
                      onChange={e => setTopicInput({...topicInput, score: Number(e.target.value)})} 
                      className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm outline-none focus:border-indigo-600" 
                    />
                    <button 
                      type="button" 
                      onClick={handleAddTopic} 
                      className="sg-btn-secondary text-xs px-4"
                    >
                      Add
                    </button>
                  </div>
                  {formData.topicPerformance && formData.topicPerformance.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.topicPerformance.map((t, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-semibold">
                          {t.topic}: {t.score}
                          <button type="button" onClick={() => removeTopic(idx)} className="text-slate-400 hover:text-red-500 ml-1">✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="sg-btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="sg-btn-primary text-xs py-2 px-5 disabled:opacity-50"
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
