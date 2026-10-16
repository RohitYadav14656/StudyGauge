import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getExams, getUserExams, selectBatchExams } from '../../services/examService';
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

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const examsToSave = Array.from(selectedExamIds).map(id => targets[id]);
      await selectBatchExams(examsToSave);
      setMessage('Your target goals have been successfully updated!');
      setTimeout(() => setMessage(null), 3000);
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
        {/* Header */}
        <div className="my-exams-header">
          <span className="header-badge">🎯 EXAM TARGET MANAGER</span>
          <h1>My Target Competitive Exams</h1>
          <p>
            Choose your target exams to unlock curated subject hierarchies, personalized study trackers, 
            and syllabus milestone projections.
          </p>
        </div>

        {message && (
          <div className={`alert-banner ${message.includes('Failed') ? 'alert-error' : 'alert-success'}`}>
            <span>{message.includes('Failed') ? '⚠️' : '✅'}</span>
            <span>{message}</span>
          </div>
        )}

        {/* Exams Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: '#94a3b8' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #38bdf8', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }}></div>
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
                        <h3 className="exam-title">{exam.name}</h3>
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
                      </div>
                    )}
                  </div>

                  <div className="exam-actions">
                    <Link to={`/syllabus/${exam._id}`} className="syllabus-link">
                      <span>📖 Inspect Syllabus</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating/Sticky Save Action Bar */}
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
