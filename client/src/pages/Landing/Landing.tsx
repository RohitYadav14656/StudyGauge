import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const Landing: React.FC = () => {
  return (
    <div className="landing-container">
      {/* Background Ambient Glows */}
      <div className="landing-ambient-glow glow-1"></div>
      <div className="landing-ambient-glow glow-2"></div>
      <div className="landing-ambient-glow glow-3"></div>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-badge">
          <span className="badge-dot"></span>
          <span>Next-Gen Competitive Exam Engine</span>
          <span className="badge-pill">AI Powered</span>
        </div>

        <h1 className="hero-title">
          Master Any Exam.<br />
          <span className="hero-gradient-text">Precision & Strategy.</span>
        </h1>

        <p className="hero-subtitle">
          StudyGauge turns overwhelming syllabus blueprints into actionable daily momentum. 
          Adaptive schedules, live accuracy tracking, and historical pattern mastery in one unified cockpit.
        </p>

        {/* Hero Interactive Workflow Ribbon */}
        <div className="hero-workflow-ribbon">
          <div className="ribbon-step">
            <span className="step-num">01</span>
            <span className="step-label">Select Exam Target</span>
          </div>
          <span className="ribbon-arrow">→</span>
          <div className="ribbon-step">
            <span className="step-num">02</span>
            <span className="step-label">Dynamic Study Planner</span>
          </div>
          <span className="ribbon-arrow">→</span>
          <div className="ribbon-step">
            <span className="step-num">03</span>
            <span className="step-label">PYQ & Mock Drills</span>
          </div>
          <span className="ribbon-arrow">→</span>
          <div className="ribbon-step highlight">
            <span className="step-num">04</span>
            <span className="step-label">AI Readiness Analytics</span>
          </div>
        </div>

        {/* Hero Quick CTA */}
        <div className="hero-cta">
          <Link to="/register" className="cta-btn-primary">
            <span>Get Started Free</span>
            <span className="btn-arrow">→</span>
          </Link>
          <a href="#modules" className="cta-btn-glass">
            <span>Explore Architecture</span>
            <span className="btn-icon">⚡</span>
          </a>
        </div>

        {/* Quick Platform Metrics Banner */}
        <div className="hero-stats-strip">
          <div className="hero-stat-item">
            <div className="hero-stat-value">100%</div>
            <div className="hero-stat-desc">Syllabus Breakdown</div>
          </div>
          <div className="stat-separator"></div>
          <div className="hero-stat-item">
            <div className="hero-stat-value">Dynamic</div>
            <div className="hero-stat-desc">Target Milestones</div>
          </div>
          <div className="stat-separator"></div>
          <div className="hero-stat-item">
            <div className="hero-stat-value">Real-Time</div>
            <div className="hero-stat-desc">Pomodoro Focus Tracker</div>
          </div>
          <div className="stat-separator"></div>
          <div className="hero-stat-item">
            <div className="hero-stat-value">Deep</div>
            <div className="hero-stat-desc">Readiness Analytics</div>
          </div>
        </div>
      </header>

      {/* Modules Grid Section */}
      <section id="modules" className="features-section">
        <div className="section-header">
          <div className="section-tag">COMPREHENSIVE ECOSYSTEM</div>
          <h2 className="section-heading">Built For High-Stakes Aspirants</h2>
          <p className="section-subtext">
            Every module is tailored to dismantle exam complexity, eliminate hesitation, and accelerate score growth.
          </p>
        </div>

        <div className="features-grid">
          {/* Card 1: Exams */}
          <Link to="/my-exams" className="feature-card group">
            <div className="card-top">
              <div className="feature-icon icon-cyan">📚</div>
              <span className="card-badge">Foundation</span>
            </div>
            <h3 className="feature-title">Target Exams Hub</h3>
            <p className="feature-desc">
              Select national or state level exams with granular subject hierarchies, weightages, and rank targets.
            </p>
            <div className="card-footer">
              <span className="footer-link">Explore Exams</span>
              <span className="footer-arrow">→</span>
            </div>
          </Link>

          {/* Card 2: Planner */}
          <Link to="/planner" className="feature-card group">
            <div className="card-top">
              <div className="feature-icon icon-indigo">📅</div>
              <span className="card-badge">Adaptive</span>
            </div>
            <h3 className="feature-title">Smart Daily Planner</h3>
            <p className="feature-desc">
              Organize revision schedules, prioritize high-yield chapters, and mark progress with real duration tracking.
            </p>
            <div className="card-footer">
              <span className="footer-link">Open Planner</span>
              <span className="footer-arrow">→</span>
            </div>
          </Link>

          {/* Card 3: Goals */}
          <Link to="/goals" className="feature-card group">
            <div className="card-top">
              <div className="feature-icon icon-amber">🎯</div>
              <span className="card-badge">Accountability</span>
            </div>
            <h3 className="feature-title">Goal Milestones</h3>
            <p className="feature-desc">
              Commit to daily hour targets, weekly topic quotas, and monitor automated percentage completion gauges.
            </p>
            <div className="card-footer">
              <span className="footer-link">View Targets</span>
              <span className="footer-arrow">→</span>
            </div>
          </Link>

          {/* Card 4: Study Tracker */}
          <Link to="/study-tracker" className="feature-card group">
            <div className="card-top">
              <div className="feature-icon icon-emerald">⏱️</div>
              <span className="card-badge">Pomodoro</span>
            </div>
            <h3 className="feature-title">Session Stopwatch</h3>
            <p className="feature-desc">
              Track focused study blocks with custom timers, auto-calculated consistency streaks, and topic notes.
            </p>
            <div className="card-footer">
              <span className="footer-link">Start Timer</span>
              <span className="footer-arrow">→</span>
            </div>
          </Link>

          {/* Card 5: Mock Tests */}
          <Link to="/mock-tests" className="feature-card group">
            <div className="card-top">
              <div className="feature-icon icon-rose">📝</div>
              <span className="card-badge">Assessment</span>
            </div>
            <h3 className="feature-title">Mock Test Analyzer</h3>
            <p className="feature-desc">
              Log score splits across subjects, track negative marks, review percentiles, and uncover accuracy dips.
            </p>
            <div className="card-footer">
              <span className="footer-link">Log Test</span>
              <span className="footer-arrow">→</span>
            </div>
          </Link>

          {/* Card 6: PYQs */}
          <Link to="/pyqs" className="feature-card group">
            <div className="card-top">
              <div className="feature-icon icon-purple">🧠</div>
              <span className="card-badge">Question Bank</span>
            </div>
            <h3 className="feature-title">PYQ Practice Drills</h3>
            <p className="feature-desc">
              Solve chapter-wise previous year questions with instant explanation reviews and mastery flags.
            </p>
            <div className="card-footer">
              <span className="footer-link">Solve Questions</span>
              <span className="footer-arrow">→</span>
            </div>
          </Link>

          {/* Card 7: Analytics */}
          <Link to="/analytics" className="feature-card group">
            <div className="card-top">
              <div className="feature-icon icon-cyan">📈</div>
              <span className="card-badge">Intelligence</span>
            </div>
            <h3 className="feature-title">Performance Analytics</h3>
            <p className="feature-desc">
              Interactive visual charts, historical velocity graphs, subject weaknesses, and readiness indices.
            </p>
            <div className="card-footer">
              <span className="footer-link">Inspect Charts</span>
              <span className="footer-arrow">→</span>
            </div>
          </Link>

          {/* Card 8: Activity Feed */}
          <Link to="/activity-timeline" className="feature-card group">
            <div className="card-top">
              <div className="feature-icon icon-amber">📜</div>
              <span className="card-badge">Audit Trail</span>
            </div>
            <h3 className="feature-title">Activity Timeline</h3>
            <p className="feature-desc">
              Chronological log celebrating your completed sessions, mock attempts, and study habit milestones.
            </p>
            <div className="card-footer">
              <span className="footer-link">View Timeline</span>
              <span className="footer-arrow">→</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Teacher/Reviewer Showcase Section */}
      <section className="showcase-banner">
        <div className="showcase-box">
          <div className="showcase-content">
            <span className="showcase-pill">ACADEMIC & EVALUATION READY</span>
            <h3 className="showcase-title">Engineered For Measurable Student Outcomes</h3>
            <p className="showcase-desc">
              StudyGauge combines structured syllabus management with quantified learning metrics, 
              giving teachers and students complete transparency into preparation health.
            </p>
          </div>
          <div className="showcase-actions">
            <Link to="/my-exams" className="cta-btn-primary">
              Launch App Experience
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
