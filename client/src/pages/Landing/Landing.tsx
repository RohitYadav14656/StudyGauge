import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const Landing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'plan' | 'weak' | 'revision'>('plan');

  const supportedExams = [
    'GATE CS', 'CAT', 'UPSC CSE', 'JEE Advanced',
    'NEET-UG', 'SSC CGL', 'Banking (IBPS/SBI)', 'GRE', 'GMAT'
  ];

  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="hero-content">
          <div className="hero-pill">
            <span>Adaptive Exam Preparation Platform</span>
          </div>

          <h1 className="hero-title">
            Stop guessing what to study next.
          </h1>

          <p className="hero-description">
            StudyGauge connects your syllabus, daily study sessions, mock tests, and revision queue.
            When you fall behind, your schedule automatically rebalances so you stay on track for exam day.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="sg-btn-primary hero-btn">
              Create Free Account
            </Link>
            <Link to="/login" className="sg-btn-secondary hero-btn">
              Try Instant Demo
            </Link>
          </div>

          <div className="hero-proof-row">
            <div className="proof-item">
              <span className="proof-val">9+</span>
              <span className="proof-label">Competitive Exams</span>
            </div>
            <div className="proof-divider" />
            <div className="proof-item">
              <span className="proof-val">Adaptive</span>
              <span className="proof-label">Workload Rebalancing</span>
            </div>
            <div className="proof-divider" />
            <div className="proof-item">
              <span className="proof-val">5-Stage</span>
              <span className="proof-label">Spaced Repetition</span>
            </div>
          </div>
        </div>

        <div className="hero-preview-container">
          <div className="preview-card">
            <div className="preview-header">
              <div className="preview-exam-meta">
                <span className="preview-badge">GATE CS 2027</span>
                <span className="preview-countdown">248 days remaining</span>
              </div>
              <div className="preview-score-box">
                <span className="preview-score-label">Readiness</span>
                <span className="preview-score-val">74 / 100</span>
              </div>
            </div>

            <div className="preview-tabs">
              <button
                onClick={() => setActiveTab('plan')}
                className={`preview-tab-btn ${activeTab === 'plan' ? 'active' : ''}`}
              >
                Today's Plan
              </button>
              <button
                onClick={() => setActiveTab('weak')}
                className={`preview-tab-btn ${activeTab === 'weak' ? 'active' : ''}`}
              >
                Weak Areas
              </button>
              <button
                onClick={() => setActiveTab('revision')}
                className={`preview-tab-btn ${activeTab === 'revision' ? 'active' : ''}`}
              >
                Revision Queue
              </button>
            </div>

            <div className="preview-body">
              {activeTab === 'plan' && (
                <div className="preview-tab-pane">
                  <div className="preview-task-item">
                    <div className="preview-task-bar bar-red" />
                    <div className="preview-task-info">
                      <span className="preview-task-title">Operating Systems — Deadlock Prevention</span>
                      <span className="preview-task-meta">60 min • Priority: High (Adapted from yesterday)</span>
                    </div>
                  </div>
                  <div className="preview-task-item">
                    <div className="preview-task-bar bar-indigo" />
                    <div className="preview-task-info">
                      <span className="preview-task-title">DBMS — BCNF & Normalization Drills</span>
                      <span className="preview-task-meta">45 min • Core Subject</span>
                    </div>
                  </div>
                  <div className="preview-task-item">
                    <div className="preview-task-bar bar-teal" />
                    <div className="preview-task-info">
                      <span className="preview-task-title">PYQ Practice — Computer Networks</span>
                      <span className="preview-task-meta">30 min • 20 Questions</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'weak' && (
                <div className="preview-tab-pane">
                  <div className="preview-weak-row">
                    <div>
                      <div className="preview-weak-title">Deadlock Detection Algorithms</div>
                      <div className="preview-weak-sub">Operating Systems • 48% accuracy in mocks</div>
                    </div>
                    <span className="preview-weak-tag tag-weak">Review</span>
                  </div>
                  <div className="preview-weak-row">
                    <div>
                      <div className="preview-weak-title">Relational Calculus & Queries</div>
                      <div className="preview-weak-sub">DBMS • 54% accuracy in PYQs</div>
                    </div>
                    <span className="preview-weak-tag tag-weak">Practice</span>
                  </div>
                  <div className="preview-weak-row">
                    <div>
                      <div className="preview-weak-title">Conditional Probability</div>
                      <div className="preview-weak-sub">Engineering Maths • 58% accuracy</div>
                    </div>
                    <span className="preview-weak-tag tag-mod">Moderate</span>
                  </div>
                </div>
              )}

              {activeTab === 'revision' && (
                <div className="preview-tab-pane">
                  <div className="preview-rev-row">
                    <div>
                      <div className="preview-rev-title">TCP/IP Congestion Control</div>
                      <div className="preview-rev-sub">Stage 3 review • Last reviewed 7 days ago</div>
                    </div>
                    <span className="preview-rev-badge">Due Today</span>
                  </div>
                  <div className="preview-rev-row">
                    <div>
                      <div className="preview-rev-title">SQL Joins & Grouping</div>
                      <div className="preview-rev-sub">Stage 2 review • Last reviewed 3 days ago</div>
                    </div>
                    <span className="preview-rev-badge">Due Today</span>
                  </div>
                  <div className="preview-rev-row">
                    <div>
                      <div className="preview-rev-title">Binary Search Trees & AVL</div>
                      <div className="preview-rev-sub">Stage 1 review • Studied yesterday</div>
                    </div>
                    <span className="preview-rev-badge">Due Today</span>
                  </div>
                </div>
              )}
            </div>

            <div className="preview-footer">
              <span className="preview-footer-text">Actual preparation data updates in real time</span>
              <Link to="/login" className="preview-footer-link">Open Full Dashboard →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="exam-ticker-section">
        <div className="exam-ticker-label">Supported Competitive Exams</div>
        <div className="exam-ticker-list">
          {supportedExams.map((exam) => (
            <span key={exam} className="exam-ticker-chip">
              {exam}
            </span>
          ))}
        </div>
      </section>

      <section className="comparison-section">
        <div className="section-header">
          <span className="section-eyebrow">The Problem</span>
          <h2 className="section-title">Why Static Timetables Fail</h2>
          <p className="section-subtitle">
            Most students use static spreadsheets or timetable apps. When life happens and a session is missed,
            the plan breaks, guilt builds up, and weak areas get ignored.
          </p>
        </div>

        <div className="comparison-grid">
          <div className="comparison-col col-bad">
            <h3 className="comparison-col-title">Traditional Study Planners</h3>
            <ul className="comparison-list">
              <li>Fixed calendar events that don't adapt when you fall behind</li>
              <li>No objective measurement of which topics are actually weak</li>
              <li>Revision is forgotten until mock tests expose knowledge loss</li>
              <li>Preparation data scattered across notes, spreadsheets, and mock apps</li>
              <li>No clear answer to: "What should I study next?"</li>
            </ul>
          </div>

          <div className="comparison-col col-good">
            <h3 className="comparison-col-title">StudyGauge Adaptive Platform</h3>
            <ul className="comparison-list">
              <li>Automatically redistributes incomplete study sessions to upcoming days</li>
              <li>Diagnoses weak topics based on real mock test and PYQ accuracy</li>
              <li>Spaced repetition queue schedules reviews at Day 1, 3, 7, 14, and 30</li>
              <li>Unified tracking: study hours, mock tests, past papers, and calendar events</li>
              <li>Prioritized recommendation queue tells you exactly what topic to focus on</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="method-section">
        <div className="section-header">
          <span className="section-eyebrow">Methodology</span>
          <h2 className="section-title">How StudyGauge Works</h2>
          <p className="section-subtitle">
            A continuous four-stage cycle that converts your exam syllabus into measurable daily progress.
          </p>
        </div>

        <div className="method-steps-grid">
          <div className="method-step-card">
            <div className="step-number">01</div>
            <h4 className="step-title">Set Target & Available Time</h4>
            <p className="step-desc">
              Select your exam, set your target date, and input how many hours you can dedicate each day.
            </p>
          </div>

          <div className="method-step-card">
            <div className="step-number">02</div>
            <h4 className="step-title">Track Real Study & Tests</h4>
            <p className="step-desc">
              Log focused study blocks with the built-in timer, solve past papers, and record mock test results.
            </p>
          </div>

          <div className="method-step-card">
            <div className="step-number">03</div>
            <h4 className="step-title">Identify Weak Topics</h4>
            <p className="step-desc">
              The platform analyzes your accuracy and flags topics where retention is dropping or test scores lag.
            </p>
          </div>

          <div className="method-step-card">
            <div className="step-number">04</div>
            <h4 className="step-title">Dynamic Rebalancing</h4>
            <p className="step-desc">
              When study sessions are missed, future days automatically adapt so your preparation remains realistic.
            </p>
          </div>
        </div>
      </section>

      <section className="features-grid-section">
        <div className="section-header">
          <span className="section-eyebrow">Platform Features</span>
          <h2 className="section-title">Everything Needed for Rigorous Preparation</h2>
        </div>

        <div className="core-features-grid">
          <div className="feature-item-card">
            <div className="feature-icon-box">📅</div>
            <h4 className="feature-item-title">Adaptive Planner</h4>
            <p className="feature-item-desc">
              Compares planned vs. actual study time. Missed tasks are automatically rescheduled according to exam urgency.
            </p>
          </div>

          <div className="feature-item-card">
            <div className="feature-icon-box">🔄</div>
            <h4 className="feature-item-title">Spaced Repetition</h4>
            <p className="feature-item-desc">
              Proven cognitive intervals (1, 3, 7, 14, 30 days) to prevent forgetting curves on complex theoretical topics.
            </p>
          </div>

          <div className="feature-item-card">
            <div className="feature-icon-box">📊</div>
            <h4 className="feature-item-title">Exam Readiness Score</h4>
            <p className="feature-item-desc">
              An objective index combining syllabus completion, mock test scores, PYQ accuracy, and revision consistency.
            </p>
          </div>

          <div className="feature-item-card">
            <div className="feature-icon-box">⏱️</div>
            <h4 className="feature-item-title">Daily Study Tracker</h4>
            <p className="feature-item-desc">
              Stopwatch and session logging categorized by lectures, reading, practice, mock tests, and revision blocks.
            </p>
          </div>

          <div className="feature-item-card">
            <div className="feature-icon-box">📑</div>
            <h4 className="feature-item-title">PYQ Question Bank</h4>
            <p className="feature-item-desc">
              Practice previous year questions filtered by subject and topic with instant answer evaluation and bookmarking.
            </p>
          </div>

          <div className="feature-item-card">
            <div className="feature-icon-box">🔗</div>
            <h4 className="feature-item-title">Connected Tools</h4>
            <p className="feature-item-desc">
              Connect external calendars, Notion workspaces, and productivity tools to unify your preparation timeline.
            </p>
          </div>
        </div>
      </section>

      <section className="faq-section">
        <div className="section-header">
          <span className="section-eyebrow">Questions & Answers</span>
          <h2 className="section-title">Frequently Asked Questions</h2>
        </div>

        <div className="faq-grid">
          <div className="faq-card">
            <h4 className="faq-question">How is StudyGauge different from a normal timetable?</h4>
            <p className="faq-answer">
              A standard timetable assumes you never fall sick, get tired, or take longer on hard chapters. StudyGauge tracks your actual study time and dynamically reorganizes pending work so you never have to manually redraw your calendar.
            </p>
          </div>

          <div className="faq-card">
            <h4 className="faq-question">Can I use StudyGauge for multiple exams?</h4>
            <p className="faq-answer">
              Yes. You can configure target dates, syllabi, and track progress independently for GATE, CAT, UPSC, JEE, NEET, GRE, Banking, and other exams.
            </p>
          </div>

          <div className="faq-card">
            <h4 className="faq-question">How does the system know my weak areas?</h4>
            <p className="faq-answer">
              As you log mock tests and solve PYQs, StudyGauge calculates your subject-wise and topic-wise accuracy. Topics with test accuracy under 60% or unreviewed for over 10 days are prioritized for review.
            </p>
          </div>

          <div className="faq-card">
            <h4 className="faq-question">Do I need a credit card to get started?</h4>
            <p className="faq-answer">
              No. You can create an account and begin organizing your syllabus, tracking study hours, and building your study plan immediately.
            </p>
          </div>
        </div>
      </section>

      <section className="cta-banner-section">
        <div className="cta-banner-card">
          <h2 className="cta-banner-title">Build your study plan today</h2>
          <p className="cta-banner-desc">
            Organize your syllabus, uncover weak topics early, and study with clear direction.
          </p>
          <div className="cta-banner-actions">
            <Link to="/register" className="sg-btn-primary">
              Register Free
            </Link>
            <Link to="/login" className="sg-btn-secondary">
              Open Demo Account
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">StudyGauge</span>
            <p className="footer-tagline">Adaptive preparation platform for competitive exams.</p>
          </div>
          <div className="footer-links">
            <Link to="/login">Sign In</Link>
            <Link to="/register">Create Account</Link>
            <Link to="/my-exams">Exams</Link>
            <Link to="/dashboard">Dashboard</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} StudyGauge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
