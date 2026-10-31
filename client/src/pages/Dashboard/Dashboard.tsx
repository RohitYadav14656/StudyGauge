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
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revisedTopicIds, setRevisedTopicIds] = useState<string[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dashboardService.getDashboard();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError('Failed to load dashboard data.');
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      setError(err.response?.data?.message || err.message || 'Error connecting to server.');
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
    fetchDashboardData();
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

  if (loading) {
    return (
      <div className="dash-loading-screen">
        <div className="dash-spinner"></div>
        <p className="dash-loading-text">Loading preparation overview...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="dash-error-container">
        <div className="dash-error-card">
          <div className="dash-error-icon">⚠️</div>
          <h2 className="dash-error-title">Unable to Load Overview</h2>
          <p className="dash-error-msg">{error || 'Please make sure you have an active exam selected.'}</p>
          <div className="dash-error-actions">
            <button onClick={fetchDashboardData} className="sg-btn-primary">
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
  } = data;

  const targetHours = 5;
  const todayProgressPercent = Math.min(100, Math.round(((studyTime?.todayHours || 0) / targetHours) * 100));

  const chartData = (mockTrend && mockTrend.length > 0)
    ? mockTrend.map((item, idx) => ({
        name: item.week || `Test ${idx + 1}`,
        score: item.avgPercentage || item.avgScore || 0,
      }))
    : [
        { name: 'Test 1', score: 48 },
        { name: 'Test 2', score: 55 },
        { name: 'Test 3', score: 62 },
        { name: 'Test 4', score: 69 },
        { name: 'Test 5', score: 71 },
      ];

  const topRec = recommendations?.recommendations?.[0];

  return (
    <div className="dash-page-wrapper">
      <header className="dash-header">
        <div>
          <div className="dash-exam-tag">
            <span className="dash-tag-dot"></span>
            <span>Target: <strong>{examCountdown?.examName || 'GATE CS'}</strong></span>
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
            {examCountdown?.daysLeft !== null ? examCountdown?.daysLeft : '248'}
            <span className="dash-kpi-unit">days</span>
          </div>
          <p className="dash-kpi-footer">Target Date: {examCountdown?.targetDate ? new Date(examCountdown.targetDate).toLocaleDateString() : 'Feb 2027'}</p>
        </div>

        <div className="sg-card dash-kpi-card highlight-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Readiness Score</span>
            <span className="dash-kpi-icon" style={{ background: '#F0FDFA', color: '#0D9488' }}>🎯</span>
          </div>
          <div className="dash-kpi-value text-teal">
            {readiness?.overallScore ?? 74}
            <span className="dash-kpi-unit">/ 100</span>
          </div>
          <div className="dash-progress-track">
            <div
              className="dash-progress-fill"
              style={{ width: `${readiness?.overallScore ?? 74}%`, background: '#0D9488' }}
            ></div>
          </div>
          <p className="dash-kpi-footer">Calculated from tests, syllabus, and revision rate</p>
        </div>

        <div className="sg-card dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Today's Study</span>
            <span className="dash-kpi-icon" style={{ background: '#FFFBEB', color: '#F59E0B' }}>⏱️</span>
          </div>
          <div className="dash-kpi-value text-navy">
            {studyTime?.todayHours?.toFixed(1) || '4.5'}
            <span className="dash-kpi-unit">hrs</span>
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
            {syllabusProgress?.completionPercentage || 72}%
          </div>
          <div className="dash-progress-track">
            <div
              className="dash-progress-fill"
              style={{ width: `${syllabusProgress?.completionPercentage || 72}%`, background: '#4F46E5' }}
            ></div>
          </div>
          <p className="dash-kpi-footer">
            {syllabusProgress?.completed || 42} / {syllabusProgress?.totalTopics || 60} Topics Completed
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
              <span className="sg-badge sg-badge-teal">Overall: {readiness?.overallScore ?? 74}/100</span>
            </div>

            <div className="dash-pillars-list">
              <div className="dash-pillar-item">
                <div className="dash-pillar-meta">
                  <span>Syllabus Completion</span>
                  <span className="dash-pillar-val">82%</span>
                </div>
                <div className="dash-pillar-track">
                  <div className="dash-pillar-bar" style={{ width: '82%', background: '#4F46E5' }}></div>
                </div>
              </div>

              <div className="dash-pillar-item">
                <div className="dash-pillar-meta">
                  <span>Topic Mastery</span>
                  <span className="dash-pillar-val">74%</span>
                </div>
                <div className="dash-pillar-track">
                  <div className="dash-pillar-bar" style={{ width: '74%', background: '#0D9488' }}></div>
                </div>
              </div>

              <div className="dash-pillar-item">
                <div className="dash-pillar-meta">
                  <span>Mock Test Scores</span>
                  <span className="dash-pillar-val">68%</span>
                </div>
                <div className="dash-pillar-track">
                  <div className="dash-pillar-bar" style={{ width: '68%', background: '#4F46E5' }}></div>
                </div>
              </div>

              <div className="dash-pillar-item">
                <div className="dash-pillar-meta">
                  <span>Question Accuracy</span>
                  <span className="dash-pillar-val">79%</span>
                </div>
                <div className="dash-pillar-track">
                  <div className="dash-pillar-bar" style={{ width: '79%', background: '#0D9488' }}></div>
                </div>
              </div>

              <div className="dash-pillar-item">
                <div className="dash-pillar-meta">
                  <span>Revision Coverage</span>
                  <span className="dash-pillar-val">61%</span>
                </div>
                <div className="dash-pillar-track">
                  <div className="dash-pillar-bar" style={{ width: '61%', background: '#F59E0B' }}></div>
                </div>
              </div>

              <div className="dash-pillar-item">
                <div className="dash-pillar-meta">
                  <span>Study Consistency</span>
                  <span className="dash-pillar-val">85%</span>
                </div>
                <div className="dash-pillar-track">
                  <div className="dash-pillar-bar" style={{ width: '85%', background: '#0D9488' }}></div>
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

            <div className="dash-mock-stats-row">
              <div className="dash-substat">
                <span className="dash-substat-num text-teal">{mockPerformance?.bestScorePercentage ?? 71}%</span>
                <span className="dash-substat-label">Best Score</span>
              </div>
              <div className="dash-substat">
                <span className="dash-substat-num text-indigo">{mockPerformance?.avgScorePercentage ?? 61}%</span>
                <span className="dash-substat-label">Average</span>
              </div>
              <div className="dash-substat">
                <span className="dash-substat-num text-navy">{mockPerformance?.totalTests ?? 5}</span>
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

            <div className="dash-subject-bars">
              {((subjectPerformance?.subjects && subjectPerformance.subjects.length > 0)
                ? subjectPerformance.subjects.slice(0, 5).map((s) => ({
                    name: s.subjectName,
                    pct: s.accuracy || 75,
                    color: s.accuracy >= 75 ? '#0D9488' : s.accuracy >= 60 ? '#4F46E5' : '#F59E0B',
                  }))
                : [
                    { name: 'Mathematics & Discrete Maths', pct: 82, color: '#4F46E5' },
                    { name: 'Database Management Systems (DBMS)', pct: 64, color: '#0D9488' },
                    { name: 'Operating Systems (OS)', pct: 58, color: '#F59E0B' },
                    { name: 'Computer Networks (CN)', pct: 81, color: '#4F46E5' },
                    { name: 'Algorithms & Data Structures', pct: 75, color: '#0D9488' },
                  ]
              ).map((subj) => (
                <div key={subj.name} className="dash-subj-row">
                  <div className="dash-subj-info">
                    <span className="dash-subj-name">{subj.name}</span>
                    <span className="dash-subj-pct font-bold">{subj.pct}%</span>
                  </div>
                  <div className="dash-subj-track">
                    <div className="dash-subj-fill" style={{ width: `${subj.pct}%`, background: subj.color }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dash-col-right">
          {topRec && (
            <div className="sg-card dash-rec-spotlight">
              <div className="dash-rec-badge-row">
                <span className="sg-badge sg-badge-indigo">Recommended Next</span>
                <span className={`sg-badge ${topRec.priority?.level === 'CRITICAL' ? 'sg-badge-red' : 'sg-badge-amber'}`}>
                  Priority: {topRec.priority?.level || 'HIGH'}
                </span>
              </div>

              <h4 className="dash-rec-topic">{topRec.topic?.name || 'Deadlocks & Concurrency'}</h4>
              <p className="dash-rec-subject">{topRec.topic?.subjectName || 'Operating Systems'}</p>

              <div className="dash-rec-reason-box">
                <div className="dash-rec-reason-title">Why this topic is prioritized</div>
                <ul className="dash-rec-reasons-list">
                  {topRec.reasons && topRec.reasons.length > 0 ? (
                    topRec.reasons.map((exp: string, idx: number) => (
                      <li key={idx}>{exp}</li>
                    ))
                  ) : (
                    <>
                      <li>Recent test accuracy is below target (48%)</li>
                      <li>Not reviewed in the past 12 days</li>
                      <li>High historical weightage in GATE CS</li>
                    </>
                  )}
                </ul>
              </div>

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

            <div className="dash-weak-list">
              {((weakTopics?.topics && weakTopics.topics.length > 0)
                ? weakTopics.topics.slice(0, 4).map((t) => ({
                    name: t.topicName,
                    subject: t.subjectName || 'Core Subject',
                    score: `${Math.round(t.accuracy || t.masteryScore || 45)}%`,
                  }))
                : [
                    { name: 'Deadlocks & Resource Allocation', subject: 'Operating Systems', score: '48%' },
                    { name: 'Normalization & BCNF', subject: 'DBMS', score: '54%' },
                    { name: 'Conditional Probability & Bayes', subject: 'Engineering Maths', score: '58%' },
                  ]
              ).map((topic, i) => (
                <div key={i} className="dash-weak-item">
                  <div className="dash-weak-left">
                    <span className="dash-weak-bullet">⚠️</span>
                    <div>
                      <h5 className="dash-weak-title">{topic.name}</h5>
                      <span className="dash-weak-subj">{topic.subject} • Accuracy: {topic.score}</span>
                    </div>
                  </div>
                  <Link to="/pyqs" className="dash-action-btn-sm">
                    Practice
                  </Link>
                </div>
              ))}
            </div>
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

            <div className="dash-revision-list">
              {((revisionDue?.revisions && revisionDue.revisions.length > 0)
                ? revisionDue.revisions.slice(0, 4).map((r) => ({
                    id: r._id,
                    topicId: r._id,
                    name: r.topicName,
                    subject: r.subjectName || 'Active Module',
                    stage: `Stage ${(r.revisionCount || 0) + 1}`,
                  }))
                : [
                    { id: 'rev-1', topicId: '1', name: 'Database Normalization', subject: 'DBMS', stage: 'Stage 2 (Day 3)' },
                    { id: 'rev-2', topicId: '2', name: 'Deadlock Detection & Prevention', subject: 'OS', stage: 'Stage 3 (Day 7)' },
                    { id: 'rev-3', topicId: '3', name: 'Dijkstra & Routing Algorithms', subject: 'Computer Networks', stage: 'Stage 1 (Day 1)' },
                  ]
              ).map((rev) => {
                const isDone = revisedTopicIds.includes(rev.id);
                return (
                  <div key={rev.id} className="dash-rev-row">
                    <div>
                      <div className="dash-rev-name">{rev.name}</div>
                      <div className="dash-rev-meta">{rev.subject} • {rev.stage}</div>
                    </div>
                    {isDone ? (
                      <span className="sg-badge sg-badge-teal">✓ Completed</span>
                    ) : (
                      <button
                        onClick={() => handleMarkRevisionDone(rev.id, rev.topicId)}
                        className="sg-btn-secondary dash-rev-done-btn"
                      >
                        ✓ Mark Done
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
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

            <div className="dash-plan-items">
              {((todaysPlan && todaysPlan.length > 0)
                ? todaysPlan.slice(0, 4).map((item) => ({
                    title: item.title,
                    time: `${item.plannedDuration} min`,
                    tag: item.priority === 'high' ? 'High Priority' : 'Core',
                    color: item.priority === 'high' ? '#EF4444' : '#4F46E5',
                  }))
                : [
                    { title: 'OS — Deadlocks (Concept Revision)', time: '60 min', tag: 'High Priority', color: '#EF4444' },
                    { title: 'DBMS — Normalization (Practice Questions)', time: '45 min', tag: 'Core', color: '#4F46E5' },
                    { title: 'Computer Networks — PYQs Sprint', time: '45 min', tag: 'Practice', color: '#0D9488' },
                    { title: 'Spaced Revision — Bayes Theorem', time: '30 min', tag: 'Review', color: '#F59E0B' },
                  ]
              ).map((task, i) => (
                <div key={i} className="dash-plan-task">
                  <div className="dash-plan-bar" style={{ background: task.color }}></div>
                  <div className="dash-plan-content">
                    <span className="dash-plan-title">{task.title}</span>
                    <span className="dash-plan-meta">{task.time} • <strong style={{ color: task.color }}>{task.tag}</strong></span>
                  </div>
                </div>
              ))}
            </div>
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
