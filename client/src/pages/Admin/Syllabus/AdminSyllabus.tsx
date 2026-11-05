import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getExams } from '../../../services/examService';
import { getExamSyllabus, createSubject, createTopic } from '../../../services/syllabusService';
import './AdminSyllabus.css';

interface Exam {
  _id: string;
  name: string;
  description?: string;
  level?: string;
}

interface Subtopic {
  _id?: string;
  name: string;
  order: number;
  active?: boolean;
}

interface Topic {
  _id: string;
  name: string;
  description?: string;
  order: number;
  subtopics: Subtopic[];
}

interface Subject {
  _id: string;
  name: string;
  shortName?: string;
  description?: string;
  weightage?: number;
  order: number;
  topics: Topic[];
}

const AdminSyllabus: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialExamId = searchParams.get('examId') || '';

  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId);
  const [syllabus, setSyllabus] = useState<Subject[]>([]);
  const [examInfo, setExamInfo] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

  // Modals
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    shortName: '',
    description: '',
    weightage: 10,
    order: 0,
  });

  const [showTopicModal, setShowTopicModal] = useState(false);
  const [targetSubjectId, setTargetSubjectId] = useState('');
  const [topicForm, setTopicForm] = useState({
    name: '',
    description: '',
    order: 0,
    subtopicsText: '',
  });

  useEffect(() => {
    const fetchExamsList = async () => {
      try {
        const data = await getExams();
        const list = Array.isArray(data) ? data : data.data || [];
        setExams(list);
        if (list.length > 0 && !selectedExamId) {
          setSelectedExamId(list[0]._id);
          setSearchParams({ examId: list[0]._id });
        }
      } catch (err: any) {
        setError('Failed to load exams list.');
      }
    };
    fetchExamsList();
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;
    fetchSyllabus(selectedExamId);
  }, [selectedExamId]);

  const fetchSyllabus = async (examId: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getExamSyllabus(examId);
      if (res && res.syllabus) {
        setSyllabus(res.syllabus);
        setExamInfo(res.exam || null);
        // Expand all subjects by default for clear overview
        const expands: Record<string, boolean> = {};
        res.syllabus.forEach((s: Subject) => {
          expands[s._id] = true;
        });
        setExpandedSubjects(expands);
      } else {
        setSyllabus([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load exam syllabus tree.');
    } finally {
      setLoading(false);
    }
  };

  const handleExamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedExamId(newId);
    setSearchParams({ examId: newId });
  };

  const toggleSubjectExpand = (subId: string) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subId]: !prev[subId],
    }));
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId || !subjectForm.name.trim()) return;

    try {
      await createSubject({
        examId: selectedExamId,
        name: subjectForm.name.trim(),
        shortName: subjectForm.shortName.trim(),
        description: subjectForm.description.trim(),
        weightage: Number(subjectForm.weightage) || 0,
        order: Number(subjectForm.order) || 0,
        active: true,
      });
      setShowSubjectModal(false);
      setSubjectForm({ name: '', shortName: '', description: '', weightage: 10, order: 0 });
      fetchSyllabus(selectedExamId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create subject.');
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId || !targetSubjectId || !topicForm.name.trim()) return;

    const subtopics = topicForm.subtopicsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((name, idx) => ({
        name,
        order: idx + 1,
        active: true,
      }));

    try {
      await createTopic({
        examId: selectedExamId,
        subjectId: targetSubjectId,
        name: topicForm.name.trim(),
        description: topicForm.description.trim(),
        order: Number(topicForm.order) || 0,
        active: true,
        subtopics,
      });
      setShowTopicModal(false);
      setTopicForm({ name: '', description: '', order: 0, subtopicsText: '' });
      fetchSyllabus(selectedExamId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create topic.');
    }
  };

  // Calculations
  const totalTopics = syllabus.reduce((acc, sub) => acc + (sub.topics?.length || 0), 0);
  const totalSubtopics = syllabus.reduce(
    (acc, sub) => acc + (sub.topics || []).reduce((tAcc, t) => tAcc + (t.subtopics?.length || 0), 0),
    0
  );
  const totalWeightage = syllabus.reduce((acc, sub) => acc + (sub.weightage || 0), 0);

  return (
    <div className="admin-syllabus-container">
      <div className="admin-syllabus-header">
        <div>
          <h2>Syllabus Architecture</h2>
          <p>
            Structure hierarchical curricula: Subjects → Topics → Subtopics with weightages and student tracking links.
          </p>
        </div>

        <div className="admin-syllabus-controls">
          <select
            value={selectedExamId}
            onChange={handleExamChange}
            className="syllabus-exam-select"
          >
            {exams.map((ex) => (
              <option key={ex._id} value={ex._id}>
                🎯 {ex.name}
              </option>
            ))}
          </select>

          {selectedExamId && (
            <Link
              to={`/syllabus/${selectedExamId}`}
              target="_blank"
              rel="noreferrer"
              className="btn-preview-portal"
            >
              👁️ Preview Student View
            </Link>
          )}

          <button
            onClick={() => setShowSubjectModal(true)}
            className="btn-save"
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
          >
            + Add Subject
          </button>
        </div>
      </div>

      {examInfo && (
        <div className="syllabus-stats-row">
          <div className="syllabus-stat-card">
            <span className="label">Target Exam</span>
            <span className="value" style={{ color: '#38bdf8' }}>
              {examInfo.name}
            </span>
          </div>
          <div className="syllabus-stat-card">
            <span className="label">Total Subjects</span>
            <span className="value">{syllabus.length}</span>
          </div>
          <div className="syllabus-stat-card">
            <span className="label">Total Topics</span>
            <span className="value">{totalTopics}</span>
          </div>
          <div className="syllabus-stat-card">
            <span className="label">Total Subtopics</span>
            <span className="value">{totalSubtopics}</span>
          </div>
          <div className="syllabus-stat-card">
            <span className="label">Configured Weightage</span>
            <span className="value" style={{ color: totalWeightage >= 100 ? '#10b981' : '#f59e0b' }}>
              {totalWeightage}%
            </span>
          </div>
        </div>
      )}

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">Loading Syllabus Tree...</div>
      ) : syllabus.length === 0 ? (
        <div className="admin-table-container" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
          <h3 style={{ color: '#f1f5f9', margin: '0 0 0.5rem 0' }}>No Subjects Configured for this Exam</h3>
          <p style={{ color: '#94a3b8', margin: '0 0 1.5rem 0' }}>
            Get started by adding the first subject module to establish the syllabus framework.
          </p>
          <button onClick={() => setShowSubjectModal(true)} className="btn-save">
            + Add First Subject
          </button>
        </div>
      ) : (
        <div className="syllabus-tree">
          {syllabus.map((subj, sIdx) => {
            const isExpanded = expandedSubjects[subj._id] !== false;
            return (
              <div key={subj._id} className="subject-tree-card">
                <div
                  className="subject-tree-header"
                  onClick={() => toggleSubjectExpand(subj._id)}
                >
                  <div className="subject-tree-title">
                    <span style={{ fontSize: '1rem', color: '#94a3b8' }}>
                      {isExpanded ? '▼' : '▶'}
                    </span>
                    <h3>
                      {sIdx + 1}. {subj.name}
                    </h3>
                  </div>

                  <div className="subject-meta-badges">
                    {subj.shortName && (
                      <span className="exam-badge">{subj.shortName}</span>
                    )}
                    <span className="weight-badge">Weight: {subj.weightage || 0}%</span>
                    <span className="topics-badge">
                      {subj.topics?.length || 0} Topics
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTargetSubjectId(subj._id);
                        setShowTopicModal(true);
                      }}
                      className="btn-add-item"
                    >
                      + Add Topic
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="subject-tree-body">
                    {subj.description && (
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                        {subj.description}
                      </p>
                    )}

                    {!subj.topics || subj.topics.length === 0 ? (
                      <div
                        style={{
                          padding: '1.5rem',
                          background: 'rgba(15, 23, 42, 0.3)',
                          borderRadius: '4px',
                          textAlign: 'center',
                          color: '#64748b',
                          fontSize: '0.85rem',
                        }}
                      >
                        No topics added to this subject module yet.
                      </div>
                    ) : (
                      subj.topics.map((top, tIdx) => (
                        <div key={top._id} className="topic-tree-row">
                          <div className="topic-header-row">
                            <div className="topic-title-area">
                              <span className="topic-num-badge">{tIdx + 1}</span>
                              <span className="topic-name">{top.name}</span>
                            </div>

                            {top.subtopics && top.subtopics.length > 0 && (
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                {top.subtopics.length} Subtopics
                              </span>
                            )}
                          </div>

                          {top.description && (
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                              {top.description}
                            </p>
                          )}

                          {top.subtopics && top.subtopics.length > 0 && (
                            <div className="subtopics-tags-list">
                              {top.subtopics.map((st, stIdx) => (
                                <span key={stIdx} className="subtopic-pill">
                                  {st.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Subject Modal */}
      {showSubjectModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add Subject to Syllabus</h3>
            <form onSubmit={handleCreateSubject}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operating Systems"
                    value={subjectForm.name}
                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                      Short Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. OS"
                      value={subjectForm.shortName}
                      onChange={(e) => setSubjectForm({ ...subjectForm, shortName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.65rem',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '4px',
                        color: '#f8fafc',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                      Weightage (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={subjectForm.weightage}
                      onChange={(e) => setSubjectForm({ ...subjectForm, weightage: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '0.65rem',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '4px',
                        color: '#f8fafc',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Core syllabus coverage details..."
                    value={subjectForm.description}
                    onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                    }}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Topic Modal */}
      {showTopicModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add Topic to Module</h3>
            <form onSubmit={handleCreateTopic}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Topic Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Memory Management & Paging"
                    value={topicForm.name}
                    onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="Brief scope of the topic..."
                    value={topicForm.description}
                    onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Subtopics (one per line)
                  </label>
                  <textarea
                    rows={3}
                    placeholder={"Virtual Memory\nPage Replacement Algorithms\nThrashing"}
                    value={topicForm.subtopicsText}
                    onChange={(e) => setTopicForm({ ...topicForm, subtopicsText: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                    }}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowTopicModal(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Save Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSyllabus;

