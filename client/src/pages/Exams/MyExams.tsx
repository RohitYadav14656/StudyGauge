import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getExams, getUserExams, selectBatchExams, activateExam } from '../../services/examService';
import { dashboardService } from '../../services/dashboardService';
import './MyExams.css';

interface Exam {
  _id: string;
  name: string;
  description: string;
  level: string;
}

interface UserExamTarget {
  examId: string;
  targetDate?: string;
  targetScore?: string;
  targetRank?: number;
}

const MyExams: React.FC = () => {
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [selectedExamIds, setSelectedExamIds] = useState<Set<string>>(new Set());
  const [targets, setTargets] = useState<Record<string, UserExamTarget>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [savingExamId, setSavingExamId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allExams, userExams] = await Promise.all([getExams(), getUserExams()]);
        setAvailableExams(allExams);
        
        const initialSelected = new Set<string>();
        const initialTargets: Record<string, UserExamTarget> = {};
        
        userExams.forEach((ue: any) => {
          if (ue.examId && ue.examId._id) {
            initialSelected.add(ue.examId._id);
            initialTargets[ue.examId._id] = {
              examId: ue.examId._id,
              targetDate: ue.targetDate ? new Date(ue.targetDate).toISOString().split('T')[0] : '',
              targetScore: ue.targetScore || '',
              targetRank: ue.targetRank || ''
            };
          }
        });
        
        setSelectedExamIds(initialSelected);
        setTargets(initialTargets);
        if (userExams.length > 0 && userExams[0]?.examId?._id) {
          setActiveExamId(userExams[0].examId._id);
        }
      } catch (error) {
        console.error('Failed to load exams', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleExamSelection = (examId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newSelected = new Set(selectedExamIds);
    if (newSelected.has(examId)) {
      newSelected.delete(examId);
    } else {
      newSelected.add(examId);
      if (!targets[examId]) {
        setTargets(prev => ({
          ...prev,
          [examId]: { examId }
        }));
      }
    }
    setSelectedExamIds(newSelected);
  };

  const handleTargetChange = (examId: string, field: keyof UserExamTarget, value: string | number) => {
    setTargets(prev => ({
      ...prev,
      [examId]: {
        ...prev[examId],
        [field]: value
      }
    }));
  };

  // Save specific exam target and immediately set as active
  const handleSaveExam = async (examId: string) => {
    setSavingExamId(examId);
    setMessage(null);
    try {
      const currentSelected = new Set(selectedExamIds);
      currentSelected.add(examId);
      setSelectedExamIds(currentSelected);

      const allTargetsToSave = Array.from(currentSelected).map(id => targets[id] || { examId: id });
      await selectBatchExams(allTargetsToSave);
      await activateExam(examId);
      setActiveExamId(examId);

      // Invalidate frontend dashboard cache so dashboard reflects changes instantly
      dashboardService.clearCache();

      setMessage('Target saved and set as primary exam! Dashboard is updated.');
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('Failed to save exam target', error);
      setMessage('Failed to save target. Please try again.');
    } finally {
      setSavingExamId(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const examsToSave = Array.from(selectedExamIds).map(id => targets[id] || { examId: id });
      await selectBatchExams(examsToSave);

      // If at least one exam is selected, activate the first one
      if (examsToSave.length > 0) {
        await activateExam(examsToSave[0].examId);
        setActiveExamId(examsToSave[0].examId);
      }

      // Invalidate frontend dashboard cache so dashboard reflects changes instantly
      dashboardService.clearCache();

      setMessage('All target goals saved successfully! Your dashboard is now updated.');
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('Failed to save exams', error);
      setMessage('Failed to save targets. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="my-exams-container">
      <div className="my-exams-content">
        
        <div className="my-exams-header">
          <span className="header-badge">🎯 EXAM TARGET MANAGER</span>
          <h1>My Target Competitive Exams</h1>
          <p>
            Choose your target exams to unlock curated subject hierarchies, personalized study trackers, 
            and syllabus milestone projections.
          </p>
        </div>

        {message && (
          <div className={`alert-banner ${message.includes('Failed') ? 'alert-error' : 'alert-success'}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>{message.includes('Failed') ? '⚠️' : '✅'}</span>
              <span>{message}</span>
            </div>
            {!message.includes('Failed') && (
              <button
                type="button"
                className="sg-btn-primary"
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard →
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: '#94a3b8' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid var(--color-accent)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }}></div>
            Loading available exams...
          </div>
        ) : (
          <div className="exams-grid">
            {availableExams.map(exam => {
              const isSelected = selectedExamIds.has(exam._id);
              const target = targets[exam._id] || { examId: exam._id };

              return (
                <div 
                  key={exam._id} 
                  className={`exam-card ${isSelected ? 'selected' : ''}`}
                >
                  <div>
                    <div className="exam-card-header">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h3 className="exam-title">{exam.name}</h3>
                          {activeExamId === exam._id && (
                            <span style={{
                              background: 'var(--color-primary)',
                              color: '#FFFFFF',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '3px',
                              letterSpacing: '0.04em'
                            }}>
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <span className="exam-level-tag">{exam.level || 'National'}</span>
                      </div>
                      <button 
                        type="button" 
                        className={`select-toggle-btn ${isSelected ? 'btn-active' : 'btn-inactive'}`}
                        onClick={(e) => toggleExamSelection(exam._id, e)}
                      >
                        {isSelected ? '✓ Targeted' : '+ Select'}
                      </button>
                    </div>

                    <p className="exam-desc">{exam.description || 'Comprehensive exam syllabus blueprint with structured topic breakdown.'}</p>

                    {isSelected && (
                      <div className="targets-form" onClick={(e) => e.stopPropagation()}>
                        <div className="target-row">
                          <label className="target-label">Target Exam Date</label>
                          <input 
                            type="date" 
                            className="target-input"
                            value={target.targetDate || ''}
                            onChange={(e) => handleTargetChange(exam._id, 'targetDate', e.target.value)}
                          />
                        </div>
                        <div className="target-row">
                          <label className="target-label">Target Score / Percentile</label>
                          <input 
                            type="text" 
                            className="target-input"
                            placeholder="e.g. 320 or 99.5 %ile"
                            value={target.targetScore || ''}
                            onChange={(e) => handleTargetChange(exam._id, 'targetScore', e.target.value)}
                          />
                        </div>
                        <div className="target-row">
                          <label className="target-label">Target Rank</label>
                          <input 
                            type="number" 
                            className="target-input"
                            placeholder="e.g. Top 100"
                            value={target.targetRank || ''}
                            onChange={(e) => handleTargetChange(exam._id, 'targetRank', Number(e.target.value))}
                          />
                        </div>

                        <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className="sg-btn-primary"
                            style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.8rem', fontWeight: 700 }}
                            onClick={() => handleSaveExam(exam._id)}
                            disabled={savingExamId === exam._id}
                          >
                            {savingExamId === exam._id ? 'Saving...' : '💾 Save Target'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="exam-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                    <Link to={`/syllabus/${exam._id}`} className="syllabus-link">
                      <span>📖 View Syllabus</span>
                      <span>→</span>
                    </Link>
                    {isSelected && (
                      <button
                        type="button"
                        className="sg-btn-secondary"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => handleSaveExam(exam._id)}
                        disabled={savingExamId === exam._id}
                      >
                        {savingExamId === exam._id ? 'Saving...' : '💾 Save Exam'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedExamIds.size > 0 && (
          <div className="exams-bottom-save-panel" style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '5px',
            padding: '1.25rem 1.5rem',
            marginBottom: '3.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h4 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-dark)' }}>
                Ready to save your exam goals?
              </h4>
              <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--color-text)' }}>
                {selectedExamIds.size} target exam{selectedExamIds.size > 1 ? 's' : ''} configured. Saving will update your preparation dashboard, countdown, and syllabus progress.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="sg-btn-primary"
                onClick={handleSave}
                disabled={saving}
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem', fontWeight: 700 }}
              >
                {saving ? 'Saving Targets...' : '💾 Save All Targets & Update Dashboard'}
              </button>
            </div>
          </div>
        )}

        {selectedExamIds.size > 0 && (
          <div className="sticky-save-bar">
            <div className="save-bar-info">
              <span className="save-bar-count">{selectedExamIds.size}</span>
              <span className="save-bar-text">Target Exam{selectedExamIds.size > 1 ? 's' : ''} configured</span>
            </div>
            <button 
              className="save-submit-btn" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving Targets...' : '💾 Save Target Goals'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyExams;
