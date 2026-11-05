import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { analyticsService, AnalyticsFilterParams } from '../../services/analyticsService';
import { getExams } from '../../services/examService';
import { getSubjects } from '../../services/syllabusService';

const COLORS = {
  primary: '#183D35',
  secondary: '#252B28',
  emerald: '#1A6B4A',
  amber: '#D9A441',
  rose: '#C0392B',
  slate: '#8E9E98',
  indigo: '#183D35',
};

const PIE_COLORS = ['#183D35', '#D9A441', '#1A6B4A', '#2A6155', '#8E9E98', '#DCE9E1'];

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'topics' | 'study' | 'tests' | 'subjects'>('overview');

  const [dateRange, setDateRange] = useState<string>('30d');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [topicFilter, setTopicFilter] = useState<'ALL' | 'WEAK' | 'MODERATE' | 'STRONG' | 'INSUFFICIENT'>('ALL');
  const [showFormulaModal, setShowFormulaModal] = useState<boolean>(false);

  const [examsList, setExamsList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);

  const [overviewData, setOverviewData] = useState<any>(null);
  const [subjectsData, setSubjectsData] = useState<any>(null);
  const [topicsData, setTopicsData] = useState<any>(null);
  const [testsData, setTestsData] = useState<any>(null);
  const [studyData, setStudyData] = useState<any>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [examRes, subjectRes] = await Promise.all([
          getExams().catch(() => ({ data: [] })),
          getSubjects().catch(() => ({ data: [] })),
        ]);

        const exams = Array.isArray(examRes) ? examRes : examRes.data || [];
        const subjects = Array.isArray(subjectRes) ? subjectRes : subjectRes.data || [];

        setExamsList(exams);
        setSubjectsList(subjects);
      } catch (err) {
        console.error('Failed to load filter options', err);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, selectedExamId, selectedSubjectId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const filters: AnalyticsFilterParams = {
        dateRange,
        examId: selectedExamId || undefined,
        subjectId: selectedSubjectId || undefined,
      };

      const [ov, sub, top, tst, std] = await Promise.all([
        analyticsService.getOverview(filters),
        analyticsService.getSubjects(filters),
        analyticsService.getTopics(filters),
        analyticsService.getTests(filters),
        analyticsService.getStudy(filters),
      ]);

      setOverviewData(ov.data);
      setSubjectsData(sub.data);
      setTopicsData(top.data);
      setTestsData(tst.data);
      setStudyData(std.data);
    } catch (err) {
      console.error('Error fetching analytics', err);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setDateRange('30d');
    setSelectedExamId('');
    setSelectedSubjectId('');
    setTopicFilter('ALL');
  };

  const filteredTopics = useMemo(() => {
    if (!topicsData?.topics) return [];
    if (topicFilter === 'ALL') return topicsData.topics;
    if (topicFilter === 'INSUFFICIENT') return topicsData.topics.filter((t: any) => t.insufficientData);
    return topicsData.topics.filter((t: any) => t.classification === topicFilter);
  }, [topicsData, topicFilter]);

  const scoreTrendChartData = useMemo(() => {
    if (!testsData?.scoreTrends) return [];
    return testsData.scoreTrends.map((t: any) => ({
      name: t.week || 'Week',
      Score: t.avgPercentage,
      AvgMarks: t.avgScore,
      Tests: t.testCount,
    }));
  }, [testsData]);

  const accuracyTrendChartData = useMemo(() => {
    if (!testsData?.accuracyTrends) return [];
    return testsData.accuracyTrends.map((t: any) => ({
      name: t.week || 'Week',
      Accuracy: t.accuracy,
      Attempts: t.total,
    }));
  }, [testsData]);

  const dailyStudyChartData = useMemo(() => {
    if (!studyData?.dailyBreakdown) return [];
    return studyData.dailyBreakdown.map((d: any) => ({
      date: d.date?.slice(5) || d.date,
      Hours: d.hours,
      Sessions: d.sessionCount,
    }));
  }, [studyData]);

  const pyqDifficultyChartData = useMemo(() => {
    if (!testsData?.pyqAccuracy?.byDifficulty) return [];
    return testsData.pyqAccuracy.byDifficulty.map((d: any) => ({
      name: (d.difficulty || 'Normal').toUpperCase(),
      Accuracy: d.accuracy,
      Total: d.total,
      Correct: d.correct,
    }));
  }, [testsData]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 -xs">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Analytics & Insights</h1>
              <span className="px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl">
                Performance Analytics
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Review study hours, test score curves, subject accuracy, and prioritized topics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFormulaModal(true)}
              className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs md:text-sm font-semibold hover:bg-slate-200 flex items-center gap-2"
            >
              <span>📐 Scoring Method</span>
            </button>
            <button
              onClick={loadAnalytics}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2"
            >
              <span>🔄 Refresh</span>
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 -xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-xs">Filters:</span>

            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              {[
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: '90d', label: '90 Days' },
                { id: '1y', label: '1 Year' },
                { id: 'all', label: 'All Time' },
              ].map((range) => (
                <button
                  key={range.id}
                  onClick={() => setDateRange(range.id)}
                  className={`px-3 py-1.5 font-semibold rounded-lg  ${
                    dateRange === range.id
                      ? 'bg-white text-blue-600 -xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">🎯 All Exams</option>
              {examsList.map((exam) => (
                <option key={exam._id} value={exam._id}>
                  {exam.name}
                </option>
              ))}
            </select>

            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">📚 All Subjects</option>
              {subjectsList.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {(selectedExamId || selectedSubjectId || dateRange !== '30d') && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'topics', label: '🎯 Focus Topics' },
            { id: 'study', label: '⏱ Study Hours' },
            { id: 'tests', label: '📝 Score & Accuracy' },
            { id: 'subjects', label: '📚 Subject Breakdown' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs md:text-sm font-semibold rounded-xl whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 bg-white hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-24 text-center text-slate-500 flex flex-col justify-center items-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-xl"></div>
            <p className="text-sm font-medium">Loading analytics data...</p>
          </div>
        ) : (
          <div>
            
            {activeTab === 'overview' && overviewData && (
              <div className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 -xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Daily Study</span>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">
                      {overviewData.studyHours?.todayHours || 0} hrs
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Weekly: {overviewData.studyHours?.weeklyHours || 0} hrs</p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 -xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Consistency</span>
                    <div className="text-2xl font-extrabold text-blue-600 mt-1">
                      {overviewData.consistency && overviewData.consistency.activeDays > 0
                        ? `${overviewData.consistency.consistencyPercentage || 0}%`
                        : 'N/A'}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {overviewData.consistency && overviewData.consistency.activeDays > 0
                        ? `Streak: ${overviewData.consistency?.currentStreakDays || 0} days`
                        : 'No study streak yet'}
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 -xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">PYQ Accuracy</span>
                    <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                      {overviewData.pyqAccuracy && overviewData.pyqAccuracy.totalAttempted > 0
                        ? `${overviewData.pyqAccuracy.accuracy || 0}%`
                        : 'N/A'}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {overviewData.pyqAccuracy && overviewData.pyqAccuracy.totalAttempted > 0
                        ? `${overviewData.pyqAccuracy.totalAttempted} attempted`
                        : 'No attempts yet'}
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 -xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Mock Score Avg</span>
                    <div className="text-2xl font-extrabold text-amber-500 mt-1">
                      {overviewData.mockTestPerformance && overviewData.mockTestPerformance.totalCompleted > 0
                        ? `${overviewData.mockTestPerformance.avgScorePercentage || 0}%`
                        : 'N/A'}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{overviewData.mockTestPerformance?.totalCompleted || 0} tests taken</p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 -xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Weak Topics</span>
                    <div className="text-2xl font-extrabold text-rose-600 mt-1">
                      {overviewData.weakTopicsSummary && overviewData.weakTopicsSummary.totalTopics > 0
                        ? overviewData.weakTopicsSummary.weakTopics || 0
                        : 'N/A'}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {overviewData.weakTopicsSummary && overviewData.weakTopicsSummary.totalTopics > 0
                        ? `Out of ${overviewData.weakTopicsSummary.totalTopics} total`
                        : 'No topics tracked yet'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 -xs space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-bold text-slate-900">Syllabus Progress</h3>
                      <span className="font-extrabold text-blue-600 text-lg">
                        {overviewData.syllabusCompletion && overviewData.syllabusCompletion.totalTopics > 0
                          ? `${overviewData.syllabusCompletion.completionPercentage || 0}%`
                          : 'N/A'}
                      </span>
                    </div>
                    {overviewData.syllabusCompletion && overviewData.syllabusCompletion.totalTopics > 0 ? (
                      <>
                        <div className="w-full bg-slate-100 h-4 rounded-xl overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-xl"
                            style={{ width: `${overviewData.syllabusCompletion?.completionPercentage || 0}%` }}
                          ></div>
                        </div>
                        <div className="grid grid-cols-3 text-center pt-2 text-xs border-t border-slate-100">
                          <div>
                            <span className="text-slate-400 font-medium">Completed</span>
                            <p className="font-bold text-slate-900 text-sm">{overviewData.syllabusCompletion?.completed || 0}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium">In Progress</span>
                            <p className="font-bold text-amber-600 text-sm">{overviewData.syllabusCompletion?.inProgress || 0}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium">Not Started</span>
                            <p className="font-bold text-slate-500 text-sm">{overviewData.syllabusCompletion?.notStarted || 0}</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="py-6 text-center text-slate-400 text-xs">
                        No syllabus tracked. Select an exam to view syllabus completion.
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-900 text-white p-6 rounded-xl -xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
                        <span>⚠️ Action Required</span>
                      </div>
                      <h4 className="text-lg font-bold mt-2">Focus Topics Summary</h4>
                      <p className="text-slate-400 text-xs mt-1">
                        Found {overviewData.weakTopicsSummary?.weakTopics || 0} topics requiring timely practice & revision.
                      </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {overviewData.weakTopicsSummary?.insufficientDataCount || 0} topic(s) need more attempts
                      </span>
                      <button
                        onClick={() => setActiveTab('topics')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
                      >
                        Inspect Topics →
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 -xs">
                  <h3 className="text-base font-bold text-slate-900 mb-4">Mock Test Score Trend (% Marks)</h3>
                  {scoreTrendChartData.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-sm">
                      No mock test score records available for the selected filters.
                    </div>
                  ) : (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={scoreTrendChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                          <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'var(--color-card)', borderRadius: '12px', color: '#fff', border: 'none' }}
                          />
                          <Line type="monotone" dataKey="Score" stroke={COLORS.primary} strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'topics' && topicsData && (
              <div className="space-y-6">
                
                <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 -xs">
                  <div className="flex items-center gap-2">
                    {[
                      { id: 'ALL', label: `All (${topicsData.summary?.totalTopics || 0})` },
                      { id: 'WEAK', label: `🔴 Weak (${topicsData.summary?.weakTopics || 0})` },
                      { id: 'MODERATE', label: `🟡 Moderate (${topicsData.summary?.moderateTopics || 0})` },
                      { id: 'STRONG', label: `🟢 Strong (${topicsData.summary?.strongTopics || 0})` },
                      { id: 'INSUFFICIENT', label: `⚠️ Low Data (${topicsData.summary?.insufficientDataCount || 0})` },
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => setTopicFilter(btn.id as any)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl  ${
                          topicFilter === btn.id
                            ? 'bg-slate-900 text-white -xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  <span className="text-xs text-slate-500 italic">
                    Mastery score evaluated across practice accuracy, recency & syllabus status.
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 -xs overflow-hidden">
                  {filteredTopics.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 space-y-2">
                      <p className="text-lg font-semibold text-slate-700">No Topics Found</p>
                      <p className="text-xs">No topic performance records matching classification "{topicFilter}".</p>
                      <button
                        onClick={() => setTopicFilter('ALL')}
                        className="mt-2 text-xs text-blue-600 hover:underline font-semibold"
                      >
                        Reset Classification Filter
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <th className="py-3.5 px-4">Topic / Subject</th>
                            <th className="py-3.5 px-4 text-center">Status</th>
                            <th className="py-3.5 px-4 text-center">Mastery Score</th>
                            <th className="py-3.5 px-4 text-center">PYQ Accuracy</th>
                            <th className="py-3.5 px-4 text-center">Attempts</th>
                            <th className="py-3.5 px-4 text-center">Confidence</th>
                            <th className="py-3.5 px-4">Rationale</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
                          {filteredTopics.map((topic: any) => {
                            const isModerate = topic.classification === 'MODERATE';
                            const isStrong = topic.classification === 'STRONG';

                            return (
                              <tr key={topic.topicId} className="hover:bg-slate-50/80 ">
                                <td className="py-3.5 px-4 font-semibold text-slate-900">
                                  <div>{topic.topicName}</div>
                                  <div className="text-xs font-normal text-slate-400">{topic.subjectName}</div>
                                </td>

                                <td className="py-3.5 px-4 text-center">
                                  <span
                                    className={`px-2.5 py-1 text-xs font-extrabold rounded-xl ${
                                      isStrong
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : isModerate
                                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                                    }`}
                                  >
                                    {topic.classification}
                                  </span>
                                </td>

                                <td className="py-3.5 px-4 text-center">
                                  <div className="font-extrabold text-slate-800">{topic.masteryScore}%</div>
                                  <div className="w-16 bg-slate-100 h-1.5 mx-auto rounded-xl mt-1 overflow-hidden">
                                    <div
                                      className={`h-full rounded-xl ${
                                        isStrong ? 'bg-emerald-500' : isModerate ? 'bg-amber-500' : 'bg-rose-500'
                                      }`}
                                      style={{ width: `${Math.min(100, topic.masteryScore)}%` }}
                                    ></div>
                                  </div>
                                </td>

                                <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                                  {topic.pyqAttempted > 0 ? `${topic.pyqAccuracy}%` : 'N/A'}
                                </td>

                                <td className="py-3.5 px-4 text-center font-semibold text-slate-600">
                                  {topic.totalAttempts}
                                </td>

                                <td className="py-3.5 px-4 text-center">
                                  {topic.insufficientData ? (
                                    <span className="px-2 py-0.5 text-xs font-semibold bg-slate-200 text-slate-700 rounded-md">
                                      ⚠️ LOW
                                    </span>
                                  ) : (
                                    <span
                                      className={`px-2 py-0.5 text-xs font-semibold rounded-md ${
                                        topic.confidence === 'HIGH'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-slate-100 text-slate-700'
                                      }`}
                                    >
                                      {topic.confidence}
                                    </span>
                                  )}
                                </td>

                                <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs">
                                  {topic.reason}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'study' && studyData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 -xs">
                    <span className="text-xs font-bold uppercase text-slate-400">Daily Average</span>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">
                      {studyData.hours?.todayHours || studyData.hours?.dailyHours || 0} hrs
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 -xs">
                    <span className="text-xs font-bold uppercase text-slate-400">Weekly Total</span>
                    <div className="text-2xl font-extrabold text-blue-600 mt-1">
                      {studyData.hours?.weeklyHours || 0} hrs
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 -xs">
                    <span className="text-xs font-bold uppercase text-slate-400">Monthly Total</span>
                    <div className="text-2xl font-extrabold text-indigo-600 mt-1">
                      {studyData.hours?.monthlyHours || 0} hrs
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 -xs">
                    <h3 className="text-base font-bold text-slate-900 mb-4">Daily Study Hours Trend</h3>
                    {dailyStudyChartData.length === 0 ? (
                      <div className="py-16 text-center text-slate-400 text-sm">
                        No study sessions recorded in this period.
                      </div>
                    ) : (
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={dailyStudyChartData}>
                            <defs>
                              <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.4} />
                                <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                            <YAxis stroke="#64748b" fontSize={11} />
                            <Tooltip
                              contentStyle={{ backgroundColor: 'var(--color-card)', borderRadius: '12px', color: '#fff', border: 'none' }}
                            />
                            <Area
                              type="monotone"
                              dataKey="Hours"
                              stroke={COLORS.primary}
                              strokeWidth={3}
                              fillOpacity={1}
                              fill="url(#colorHours)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-slate-200 -xs">
                    <h3 className="text-base font-bold text-slate-900 mb-4">Study Category Breakdown</h3>
                    {!studyData.typeDistribution || studyData.typeDistribution.length === 0 ? (
                      <div className="py-16 text-center text-slate-400 text-xs">
                        No category breakdown available.
                      </div>
                    ) : (
                      <div className="h-64 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={studyData.typeDistribution}
                              dataKey="hours"
                              nameKey="studyType"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={(entry: any) => `${entry.studyType}: ${entry.hours}h`}
                            >
                              {studyData.typeDistribution.map((_: any, idx: number) => (
                                <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tests' && testsData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 -xs">
                    <span className="text-xs font-bold uppercase text-slate-400">Total Mocks</span>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">
                      {testsData.performance?.totalCompleted || testsData.mockTest?.summary?.totalTests || 0}
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 -xs">
                    <span className="text-xs font-bold uppercase text-slate-400">Average Mock Score</span>
                    <div className="text-2xl font-extrabold text-blue-600 mt-1">
                      {(testsData.performance?.totalCompleted || testsData.mockTest?.summary?.totalTests) > 0
                        ? `${testsData.performance?.avgScorePercentage || testsData.mockTest?.summary?.avgPercentage || 0}%`
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 -xs">
                    <span className="text-xs font-bold uppercase text-slate-400">Best Mock Score</span>
                    <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                      {(testsData.performance?.totalCompleted || testsData.mockTest?.summary?.totalTests) > 0
                        ? `${testsData.performance?.bestScorePercentage || testsData.mockTest?.summary?.bestScore || 0}%`
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 -xs">
                    <span className="text-xs font-bold uppercase text-slate-400">PYQ Accuracy</span>
                    <div className="text-2xl font-extrabold text-indigo-600 mt-1">
                      {testsData.pyqAccuracy && testsData.pyqAccuracy.totalAttempts > 0
                        ? `${testsData.pyqAccuracy.accuracy || 0}%`
                        : 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  <div className="bg-white p-6 rounded-xl border border-slate-200 -xs">
                    <h3 className="text-base font-bold text-slate-900 mb-4">Mock Test Score Trend</h3>
                    {scoreTrendChartData.length === 0 ? (
                      <div className="py-16 text-center text-slate-400 text-sm">
                        No test scores recorded yet.
                      </div>
                    ) : (
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={scoreTrendChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                            <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                            <Tooltip
                              contentStyle={{ backgroundColor: 'var(--color-card)', borderRadius: '12px', color: '#fff', border: 'none' }}
                            />
                            <Line type="monotone" dataKey="Score" stroke={COLORS.primary} strokeWidth={3} dot={{ r: 4 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-slate-200 -xs">
                    <h3 className="text-base font-bold text-slate-900 mb-4">PYQ Accuracy Trend (% Correct)</h3>
                    {accuracyTrendChartData.length === 0 ? (
                      <div className="py-16 text-center text-slate-400 text-sm">
                        No PYQ attempts recorded yet.
                      </div>
                    ) : (
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={accuracyTrendChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                            <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                            <Tooltip
                              contentStyle={{ backgroundColor: 'var(--color-card)', borderRadius: '12px', color: '#fff', border: 'none' }}
                            />
                            <Line type="monotone" dataKey="Accuracy" stroke={COLORS.emerald} strokeWidth={3} dot={{ r: 4 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>

                {pyqDifficultyChartData.length > 0 && (
                  <div className="bg-white p-6 rounded-xl border border-slate-200 -xs">
                    <h3 className="text-base font-bold text-slate-900 mb-4">PYQ Accuracy by Question Difficulty</h3>
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pyqDifficultyChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                          <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderRadius: '12px', color: '#fff', border: 'none' }} />
                          <Bar dataKey="Accuracy" fill={COLORS.indigo} radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'subjects' && subjectsData && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 -xs space-y-6">
                <h3 className="text-base font-bold text-slate-900">Subject Accuracy Breakdown</h3>

                {!subjectsData.subjects || subjectsData.subjects.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-sm">
                    No subject performance data available for selected filters.
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={subjectsData.subjects}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="subjectName" stroke="#64748b" fontSize={12} />
                          <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderRadius: '12px', color: '#fff', border: 'none' }} />
                          <Bar dataKey="accuracy" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 text-xs font-bold uppercase">
                            <th className="py-3 px-4">Subject</th>
                            <th className="py-3 px-4 text-center">Attempted</th>
                            <th className="py-3 px-4 text-center">Correct</th>
                            <th className="py-3 px-4 text-center">Wrong</th>
                            <th className="py-3 px-4 text-center">Accuracy</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {subjectsData.subjects.map((sub: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-3.5 px-4 font-semibold text-slate-900">{sub.subjectName || 'Unknown'}</td>
                              <td className="py-3.5 px-4 text-center">{sub.attempted}</td>
                              <td className="py-3.5 px-4 text-center text-emerald-600 font-medium">{sub.correct}</td>
                              <td className="py-3.5 px-4 text-center text-rose-600 font-medium">{sub.wrong}</td>
                              <td className="py-3.5 px-4 text-center font-bold text-blue-600">{sub.accuracy}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {showFormulaModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full p-6  border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Topic Mastery Scoring</h3>
                <button
                  onClick={() => setShowFormulaModal(false)}
                  className="text-slate-400 hover:text-slate-700 text-xl font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs md:text-sm text-slate-700 leading-relaxed">
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 font-medium">
                  <strong>Mastery Calculation:</strong> Topic mastery score is computed based on practice accuracy, recency, syllabus progress, and revision schedules.
                </div>

                <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs space-y-1">
                  <p className="text-emerald-400 font-bold">S_topic = min(100, max(0, A_weighted * M_syl + P_rev))</p>
                  <p className="text-slate-400 mt-2">1. Practice Accuracy (A_combined): 50% PYQ + 50% Mock</p>
                  <p className="text-slate-400">2. Recency Weighting (A_weighted): 60% (Last 30 Days) + 40% (Overall)</p>
                  <p className="text-slate-400">3. Syllabus Multiplier (M_syl): Revised (1.05) | Completed (1.00) | In Progress (0.85) | Not Started (0.70)</p>
                  <p className="text-slate-400">4. Revision Decay Penalty (P_rev): &gt;30 days overdue (-15 pts) | &lt;=7 days (+5 pts)</p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900">Classification Thresholds:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong className="text-emerald-600">STRONG:</strong> Score ≥ 75%</li>
                    <li><strong className="text-amber-600">MODERATE:</strong> 50% ≤ Score &lt; 75%</li>
                    <li><strong className="text-rose-600">WEAK:</strong> Score &lt; 50%</li>
                  </ul>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900">Confidence Thresholds:</h4>
                  <p>Attempts &lt; 5 $\implies$ LOW Confidence (Flagged as Insufficient Data)</p>
                  <p>5 ≤ Attempts &lt; 15 $\implies$ MEDIUM Confidence</p>
                  <p>Attempts ≥ 15 $\implies$ HIGH Confidence</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowFormulaModal(false)}
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl font-semibold text-xs hover:bg-slate-800 "
                >
                  Close Formula
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
