import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  dashboardService,
  DashboardData,
} from '../../services/dashboardService';
import { revisionService } from '../../services/revisionService';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(() => dashboardService.getCachedDashboard());
  const [loading, setLoading] = useState<boolean>(() => !dashboardService.getCachedDashboard());
  const [error, setError] = useState<string | null>(null);
  const [revisedTopicIds, setRevisedTopicIds] = useState<string[]>([]);

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const res = await dashboardService.getDashboard(silent);
      if (res.success && res.data) {
        setData(res.data);
      } else if (!data) {
        setError('Failed to load dashboard data.');
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      if (!data) {
        setError(err.response?.data?.message || err.message || 'Error connecting to server.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    const hasCached = !!dashboardService.getCachedDashboard();
    fetchDashboardData(hasCached);
  }, []);

  const handleMarkRevisionDone = async (revId: string, topicIdStr: string) => {
    try {
      await revisionService.logRevision({
        topicId: topicIdStr,
        isCompleted: true,
      });
      setRevisedTopicIds((prev) => [...prev, revId]);
    } catch (err) {
      console.error('Error completing revision', err);
    }
  };

  if (loading && !data) {
    return (
      <div className="dash-loading-screen">
        <div className="dash-spinner"></div>
        <p className="dash-loading-text">Loading preparation overview...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="dash-error-container">
        <div className="dash-error-card">
          <div className="dash-error-icon">⚠️</div>
          <h2 className="dash-error-title">Unable to Load Overview</h2>
          <p className="dash-error-msg">{error || 'Please make sure you have an active exam selected.'}</p>
          <div className="dash-error-actions">
            <button onClick={() => fetchDashboardData(false)} className="sg-btn-primary">
              Retry
            </button>
            <Link to="/my-exams" className="sg-btn-secondary">
              Select Exam
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const {
    examCountdown,
    readiness,
    studyTime,
    syllabusProgress,
    subjectPerformance,
    weakTopics,
    revisionDue,
    todaysPlan,
    recommendations,
    recentActivity,
    mockTrend,
    mockPerformance,
  } = data || {} as Partial<DashboardData>;

  const targetHours = 5;
  const todayProgressPercent = Math.min(100, Math.round(((studyTime?.todayHours || 0) / targetHours) * 100));

  const chartData = (mockTrend && mockTrend.length > 0)
    ? mockTrend.map((item, idx) => ({
        name: item.week || `Test ${idx + 1}`,
        score: item.avgPercentage || item.avgScore || 0,
      }))
    : [];

  const topRec = recommendations?.recommendations?.[0];

  return (
    <div className="dash-page-wrapper">
      <header className="dash-header">
        <div>
          <div className="dash-exam-tag">
            <span className="dash-tag-dot"></span>
            <span>
              Target:{' '}
              {examCountdown?.examName ? (
                <strong>{examCountdown.examName}</strong>
              ) : (
                <>
                  <strong style={{ opacity: 0.6 }}>N/A</strong>
                  <Link
                    to="/my-exams"
                    style={{
                      marginLeft: '0.45rem',
                      fontSize: '0.75rem',
                      color: 'var(--color-primary)',
                      textDecoration: 'underline',
                      fontWeight: 600,
                    }}
                  >
                    (Select Exam)
                  </Link>
                </>
              )}
            </span>
          </div>
          <h1 className="dash-heading">Preparation Overview</h1>
          <p className="dash-subheading">Track your consistency, identify weak topics, and follow your adapted study plan.</p>
        </div>

        <div className="dash-header-actions">
          <Link to="/study-tracker" className="sg-btn-primary">
            <span>⏱️</span> Start Focus Timer
          </Link>
          <Link to="/planner" className="sg-btn-secondary">
            <span>📅</span> Study Planner
          </Link>
        </div>
      </header>

      <section className="dash-kpi-grid">
        <div className="sg-card dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Days to Exam</span>
            <span className="dash-kpi-icon" style={{ background: '#EEF2FF', color: '#4F46E5' }}>⏳</span>
          </div>
          <div className="dash-kpi-value text-indigo">
            {examCountdown && examCountdown.daysLeft !== null && examCountdown.daysLeft !== undefined ? (
              <>
                {examCountdown.daysLeft}
                <span className="dash-kpi-unit">days</span>
              </>
            ) : (
              'N/A'
            )}
          </div>
          <p className="dash-kpi-footer">
            Target Date: {examCountdown?.targetDate ? new Date(examCountdown.targetDate).toLocaleDateString() : 'N/A'}
          </p>
        </div>

        <div className="sg-card dash-kpi-card highlight-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Readiness Score</span>
            <span className="dash-kpi-icon" style={{ background: '#F0FDFA', color: '#0D9488' }}>🎯</span>
          </div>
          <div className="dash-kpi-value text-teal">
            {readiness && readiness.confidenceLevel !== 'NONE' && readiness.overallScore > 0 ? (
              <>
                {Math.round(readiness.overallScore)}
                <span className="dash-kpi-unit">/ 100</span>
              </>
            ) : (
              'N/A'
            )}
          </div>
          <div className="dash-progress-track">
            <div
              className="dash-progress-fill"
              style={{
                width: `${readiness && readiness.confidenceLevel !== 'NONE' && readiness.overallScore > 0 ? Math.min(100, Math.round(readiness.overallScore)) : 0}%`,
                background: '#0D9488',
              }}
            ></div>
          </div>
          <p className="dash-kpi-footer">
            {readiness && readiness.confidenceLevel !== 'NONE' && readiness.overallScore > 0
              ? 'Calculated from tests, syllabus, and revision rate'
              : 'Requires mock tests or syllabus progress'}
          </p>
        </div>

        <div className="sg-card dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Today's Study</span>
            <span className="dash-kpi-icon" style={{ background: '#FFFBEB', color: '#F59E0B' }}>⏱️</span>
          </div>
          <div className="dash-kpi-value text-navy">
            {studyTime && typeof studyTime.todayHours === 'number' && studyTime.todayHours > 0 ? (
              <>
                {studyTime.todayHours.toFixed(1)}
                <span className="dash-kpi-unit">hrs</span>
              </>
            ) : studyTime && typeof studyTime.todayHours === 'number' ? (
              <>
                0.0
                <span className="dash-kpi-unit">hrs</span>
              </>
            ) : (
              'N/A'
            )}
          </div>
          <div className="dash-progress-track">
            <div
              className="dash-progress-fill"
              style={{ width: `${todayProgressPercent}%`, background: '#4F46E5' }}
            ></div>
          </div>
          <p className="dash-kpi-footer">Goal: {targetHours} hrs ({todayProgressPercent}% completed)</p>
        </div>

        <div className="sg-card dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Syllabus Covered</span>
            <span className="dash-kpi-icon" style={{ background: '#EEF2FF', color: '#4F46E5' }}>📚</span>
          </div>
          <div className="dash-kpi-value text-indigo">
            {syllabusProgress && syllabusProgress.totalTopics > 0 ? (
              `${Math.round(syllabusProgress.completionPercentage)}%`
            ) : (
              'N/A'
            )}
          </div>
          <div className="dash-progress-track">
            <div
              className="dash-progress-fill"
              style={{
                width: `${syllabusProgress && syllabusProgress.totalTopics > 0 ? Math.min(100, Math.round(syllabusProgress.completionPercentage)) : 0}%`,
                background: '#4F46E5',
              }}
            ></div>
          </div>
          <p className="dash-kpi-footer">
            {syllabusProgress && syllabusProgress.totalTopics > 0
              ? `${syllabusProgress.completed} / ${syllabusProgress.totalTopics} Topics Completed`
              : 'N/A — Select an exam to view syllabus'}
          </p>
        </div>
      </section>

      <div className="dash-content-grid">
        <div className="dash-col-left">
          <div className="sg-card dash-section-card">
            <div className="dash-card-header">
              <div>
                <h3 className="dash-card-title">Readiness Factors</h3>
                <p className="dash-card-desc">Weighted breakdown of your preparation indicators</p>
              </div>
              <span className="sg-badge sg-badge-teal">
                Overall: {readiness && readiness.confidenceLevel !== 'NONE' && readiness.overallScore > 0 ? `${Math.round(readiness.overallScore)}/100` : 'N/A'}
              </span>
            </div>

            <div className="dash-pillars-list">
              <div className="dash-pillar-item">
                <div className="dash-pillar-meta">
                  <span>Syllabus Completion</span>
                  <span className="dash-pillar-val">
                    {syllabusProgress && syllabusProgress.totalTopics > 0
                      ? `${Math.round(readiness?.componentScores?.syllabusCompletion?.score ?? syllabusProgress.completionPercentage)}%`
                      : 'N/A'}
                  </span>
                </div>
                <div className="dash-pillar-track">
                  <div
                    className="dash-pillar-bar"
                    style={{
                      width: `${syllabusProgress && syllabusProgress.totalTopics > 0 ? Math.min(100, Math.round(readiness?.componentScores?.syllabusCompletion?.score ?? syllabusProgress.completionPercentage)) : 0}%`,
                      background: '#4F46E5',
                    }}
                  ></div>
                </div>
              </div>

              <div className="dash-pillar-item">
                <div className="dash-pillar-meta">
                  <span>Topic Mastery</span>
                  <span className="dash-pillar-val">
                    {readiness?.componentScores?.topicMastery?.score != null && readiness.componentScores.topicMastery.score > 0
                      ? `${Math.round(readiness.componentScores.topicMastery.score)}%`
                      : 'N/A'}
                  </span>
                </div>
                <div className="dash-pillar-track">
                  <div
                    className="dash-pillar-bar"
                    style={{
                      width: `${readiness?.componentScores?.topicMastery?.score ? Math.min(100, Math.round(readiness.componentScores.topicMastery.score)) : 0}%`,
                      background: '#0D9488',
                    }}
                  ></div>
                </div>
              </div>

              <div className="dash-pillar-item">
                <div className="dash-pillar-meta">
                  <span>Mock Test Scores</span>
                  <span className="dash-pillar-val">
                    {mockPerformance && mockPerformance.totalTests > 0
                      ? `${Math.round(readiness?.componentScores?.mockPerformance?.score ?? mockPerformance.avgScorePercentage)}%`
                      : 'N/A'}
                  </span>
                </div>
                <div className="dash-pillar-track">
                  <div
                    className="dash-pillar-bar"
                    style={{
                      width: `${mockPerformance && mockPerformance.totalTests > 0 ? Math.min(100, Math.round(readiness?.componentScores?.mockPerformance?.score ?? mockPerformance.avgScorePercentage)) : 0}%`,
                      background: '#4F46E5',
                    }}
                  ></div>
                </div>
              </div>

              <div className="dash-pillar-item">
                <div className="dash-pillar-meta">
                  <span>Question Accuracy</span>
                  <span className="dash-pillar-val">
                    {readiness?.componentScores?.accuracy?.score != null && readiness.componentScores.accuracy.score > 0
                      ? `${Math.round(readiness.componentScores.accuracy.score)}%`
                      : 'N/A'}
                  </span>
                </div>
                <div className="dash-pillar-track">
                  <div
                    className="dash-pillar-bar"
                    style={{
                      width: `${readiness?.componentScores?.accuracy?.score ? Math.min(100, Math.round(readiness.componentScores.accuracy.score)) : 0}%`,
                      background: '#0D9488',
                    }}
                  ></div>
                </div>
              </div>

              <div className="dash-pillar-item">
                <div className="dash-pillar-meta">
                  <span>Revision Coverage</span>
                  <span className="dash-pillar-val">
                    {readiness?.componentScores?.revisionConsistency?.score != null && readiness.componentScores.revisionConsistency.score > 0
                      ? `${Math.round(readiness.componentScores.revisionConsistency.score)}%`
                      : 'N/A'}
                  </span>
                </div>
                <div className="dash-pillar-track">
                  <div
                    className="dash-pillar-bar"
                    style={{
                      width: `${readiness?.componentScores?.revisionConsistency?.score ? Math.min(100, Math.round(readiness.componentScores.revisionConsistency.score)) : 0}%`,
                      background: '#F59E0B',
                    }}
                  ></div>
                </div>
              </div>

              <div className="dash-pillar-item">
                <div className="dash-pillar-meta">
                  <span>Study Consistency</span>
                  <span className="dash-pillar-val">
                    {data?.consistency && data.consistency.activeDays > 0
                      ? `${Math.round(readiness?.componentScores?.studyConsistency?.score ?? data.consistency.consistencyPercentage)}%`
                      : 'N/A'}
                  </span>
                </div>
                <div className="dash-pillar-track">
                  <div
                    className="dash-pillar-bar"
                    style={{
                      width: `${data?.consistency && data.consistency.activeDays > 0 ? Math.min(100, Math.round(readiness?.componentScores?.studyConsistency?.score ?? data.consistency.consistencyPercentage)) : 0}%`,
                      background: '#0D9488',
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="sg-card dash-section-card">
            <div className="dash-card-header">
              <div>
                <h3 className="dash-card-title">Mock Test Score Trend</h3>
                <p className="dash-card-desc">Average percentage across recent full-length and topic tests</p>
              </div>
              <Link to="/mock-tests" className="dash-link-action">
                View All Tests →
              </Link>
            </div>

            {chartData.length > 0 ? (
              <div className="dash-chart-container" style={{ width: '100%', height: 210 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#64748B" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: '#111827',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#4F46E5"
                      strokeWidth={2.5}
                      dot={{ fill: '#4F46E5', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400">
                <div className="text-3xl mb-1.5">📝</div>
                <p className="text-xs font-semibold text-slate-600">No Mock Tests Logged Yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs mx-auto">
                  Attempt your first test to track your score progression.
                </p>
                <Link to="/mock-tests" className="sg-btn-secondary text-xs mt-3 inline-flex">
                  + Record Test Attempt
                </Link>
              </div>
            )}

            <div className="dash-mock-stats-row">
              <div className="dash-substat">
                <span className="dash-substat-num text-teal">
                  {mockPerformance && mockPerformance.totalTests > 0 ? `${mockPerformance.bestScorePercentage ?? 0}%` : 'N/A'}
                </span>
                <span className="dash-substat-label">Best Score</span>
              </div>
              <div className="dash-substat">
                <span className="dash-substat-num text-indigo">
                  {mockPerformance && mockPerformance.totalTests > 0 ? `${mockPerformance.avgScorePercentage ?? 0}%` : 'N/A'}
                </span>
                <span className="dash-substat-label">Average</span>
              </div>
              <div className="dash-substat">
                <span className="dash-substat-num text-navy">
                  {mockPerformance ? mockPerformance.totalTests : 0}
                </span>
                <span className="dash-substat-label">Tests Taken</span>
              </div>
            </div>
          </div>

          <div className="sg-card dash-section-card">
            <div className="dash-card-header">
              <div>
                <h3 className="dash-card-title">Subject Accuracy</h3>
                <p className="dash-card-desc">Performance calculated from practice drills and tests</p>
              </div>
              <Link to="/analytics" className="dash-link-action">
                Full Analytics →
              </Link>
            </div>

            {subjectPerformance?.subjects && subjectPerformance.subjects.length > 0 ? (
              <div className="dash-subject-bars">
                {subjectPerformance.subjects.slice(0, 5).map((subj) => {
                  const pct = Math.round(subj.accuracy || 0);
                  const color = pct >= 75 ? '#0D9488' : pct >= 50 ? '#4F46E5' : '#F59E0B';
                  return (
                    <div key={subj.subjectName} className="dash-subj-row">
                      <div className="dash-subj-info">
                        <span className="dash-subj-name">{subj.subjectName}</span>
                        <span className="dash-subj-pct font-bold">{pct}%</span>
                      </div>
                      <div className="dash-subj-track">
                        <div className="dash-subj-fill" style={{ width: `${pct}%`, background: color }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400">
                <p className="text-xs">No subject performance data yet.</p>
                <Link to="/pyqs" className="sg-btn-secondary text-xs mt-3 inline-flex">
                  Practice Questions
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="dash-col-right">
          {topRec && topRec.topic?.name && (
            <div className="sg-card dash-rec-spotlight">
              <div className="dash-rec-badge-row">
                <span className="sg-badge sg-badge-indigo">Recommended Next</span>
                {topRec.priority?.level && (
                  <span className={`sg-badge ${topRec.priority.level === 'CRITICAL' ? 'sg-badge-red' : 'sg-badge-amber'}`}>
                    Priority: {topRec.priority.level}
                  </span>
                )}
              </div>

              <h4 className="dash-rec-topic">{topRec.topic.name}</h4>
              {topRec.topic.subjectName && (
                <p className="dash-rec-subject">{topRec.topic.subjectName}</p>
              )}

              {topRec.reasons && topRec.reasons.length > 0 && (
                <div className="dash-rec-reason-box">
                  <div className="dash-rec-reason-title">Why this topic is prioritized</div>
                  <ul className="dash-rec-reasons-list">
                    {topRec.reasons.map((exp: string, idx: number) => (
                      <li key={idx}>{exp}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="dash-rec-action-row">
                <Link to="/study-tracker" className="sg-btn-primary w-full">
                  Start {topRec.recommendedAction?.estimatedMinutes || 45}m Study Block
                </Link>
                <Link to="/recommendations" className="sg-btn-secondary">
                  More Topics
                </Link>
              </div>
            </div>
          )}

          <div className="sg-card dash-section-card">
            <div className="dash-card-header">
              <div>
                <h3 className="dash-card-title">Focus Areas</h3>
                <p className="dash-card-desc">Topics where accuracy is below 60%</p>
              </div>
              <span className="sg-badge sg-badge-red">Attention</span>
            </div>

            {weakTopics?.topics && weakTopics.topics.length > 0 ? (
              <div className="dash-weak-list">
                {weakTopics.topics.slice(0, 4).map((t, i) => (
                  <div key={i} className="dash-weak-item">
                    <div className="dash-weak-left">
                      <span className="dash-weak-bullet">⚠️</span>
                      <div>
                        <h5 className="dash-weak-title">{t.topicName}</h5>
                        <span className="dash-weak-subj">
                          {t.subjectName || 'Core Subject'} • Accuracy: {Math.round(t.accuracy || t.masteryScore || 0)}%
                        </span>
                      </div>
                    </div>
                    <Link to="/pyqs" className="dash-action-btn-sm">
                      Practice
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400">
                <p className="text-xs">No critical weak areas identified.</p>
              </div>
            )}
          </div>

          <div className="sg-card dash-section-card">
            <div className="dash-card-header">
              <div>
                <h3 className="dash-card-title">Revisions Due Today</h3>
                <p className="dash-card-desc">Topics scheduled for spaced review</p>
              </div>
              <Link to="/revision" className="dash-link-action">
                Full Schedule →
              </Link>
            </div>

            {revisionDue?.revisions && revisionDue.revisions.length > 0 ? (
              <div className="dash-revision-list">
                {revisionDue.revisions.slice(0, 4).map((r) => {
                  const isDone = revisedTopicIds.includes(r._id);
                  return (
                    <div key={r._id} className="dash-rev-row">
                      <div>
                        <div className="dash-rev-name">{r.topicName}</div>
                        <div className="dash-rev-meta">{r.subjectName || 'Active Module'} • Stage {(r.revisionCount || 0) + 1}</div>
                      </div>
                      {isDone ? (
                        <span className="sg-badge sg-badge-teal">✓ Completed</span>
                      ) : (
                        <button
                          onClick={() => handleMarkRevisionDone(r._id, r._id)}
                          className="sg-btn-secondary dash-rev-done-btn"
                        >
                          ✓ Mark Done
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400">
                <p className="text-xs">No revisions due today.</p>
              </div>
            )}
          </div>

          <div className="sg-card dash-section-card">
            <div className="dash-card-header">
              <div>
                <h3 className="dash-card-title">Today's Study Plan</h3>
                <p className="dash-card-desc">Scheduled sessions from your study plan</p>
              </div>
              <Link to="/planner" className="dash-link-action">
                Full Plan →
              </Link>
            </div>

            {todaysPlan && todaysPlan.length > 0 ? (
              <div className="dash-plan-items">
                {todaysPlan.slice(0, 4).map((task, i) => {
                  const color = task.priority === 'high' ? '#EF4444' : '#4F46E5';
                  return (
                    <div key={i} className="dash-plan-task">
                      <div className="dash-plan-bar" style={{ background: color }}></div>
                      <div className="dash-plan-content">
                        <span className="dash-plan-title">{task.title}</span>
                        <span className="dash-plan-meta">
                          {task.plannedDuration} min • <strong style={{ color }}>{task.priority === 'high' ? 'High Priority' : 'Core'}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400">
                <p className="text-xs">No study tasks scheduled for today.</p>
                <Link to="/planner" className="sg-btn-secondary text-xs mt-2 inline-flex">
                  Open Study Planner
                </Link>
              </div>
            )}
          </div>

          {recentActivity && recentActivity.length > 0 && (
            <div className="sg-card dash-section-card">
              <div className="dash-card-header">
                <div>
                  <h3 className="dash-card-title">Recent Activity</h3>
                  <p className="dash-card-desc">Latest logged study sessions</p>
                </div>
                <Link to="/activity-timeline" className="dash-link-action">
                  Full Log →
                </Link>
              </div>

              <div className="space-y-2 text-xs">
                {recentActivity.slice(0, 3).map((act) => (
                  <div key={act._id} className="p-2.5 bg-slate-50 rounded-xl flex justify-between items-center border border-slate-100">
                    <span className="font-semibold text-slate-800">
                      📖 {act.studyType} — {act.durationMinutes}m
                    </span>
                    <span className="text-slate-400">
                      {new Date(act.date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
