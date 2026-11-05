import React, { useEffect, useState } from 'react';
import { pyqService, PYQData } from '../../../services/pyqService';
import { getExams } from '../../../services/examService';
import { getSubjects, getTopics } from '../../../services/syllabusService';
import { createAdminPYQ, deleteAdminPYQ } from '../../../services/adminService';
import './AdminPYQs.css';

interface Exam {
  _id: string;
  name: string;
}

interface Subject {
  _id: string;
  name: string;
}

interface Topic {
  _id: string;
  name: string;
}

const AdminPYQs: React.FC = () => {
  const [pyqs, setPyqs] = useState<PYQData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Add PYQ Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalSubjects, setModalSubjects] = useState<Subject[]>([]);
  const [modalTopics, setModalTopics] = useState<Topic[]>([]);

  const [formData, setFormData] = useState({
    examId: '',
    subjectId: '',
    topicId: '',
    year: new Date().getFullYear(),
    questionText: '',
    difficulty: 'medium',
    explanation: '',
    tags: '',
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
  });

  const fetchFilters = async () => {
    try {
      const examsData = await getExams();
      const list = Array.isArray(examsData) ? examsData : examsData.data || [];
      setExams(list);
    } catch (err) {
      console.error('Failed to load exams', err);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await pyqService.getPYQs({
        page: 1,
        limit: 50,
        examId: selectedExam || undefined,
        difficulty: difficultyFilter || undefined,
        search: searchQuery || undefined,
      });
      if (res && res.data) {
        setPyqs(res.data);
      } else {
        setPyqs([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load question records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [selectedExam, difficultyFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuestions();
  };

  // When exam changes in Modal, load subjects
  const handleModalExamChange = async (examId: string) => {
    setFormData((prev) => ({ ...prev, examId, subjectId: '', topicId: '' }));
    if (!examId) {
      setModalSubjects([]);
      setModalTopics([]);
      return;
    }
    try {
      const subs = await getSubjects(examId);
      setModalSubjects(subs || []);
      setModalTopics([]);
    } catch (err) {
      console.error('Failed to load subjects for exam', err);
    }
  };

  // When subject changes in Modal, load topics
  const handleModalSubjectChange = async (subjectId: string) => {
    setFormData((prev) => ({ ...prev, subjectId, topicId: '' }));
    if (!subjectId) {
      setModalTopics([]);
      return;
    }
    try {
      const tops = await getTopics(formData.examId, subjectId);
      setModalTopics(tops || []);
    } catch (err) {
      console.error('Failed to load topics for subject', err);
    }
  };

  const handleOptionTextChange = (idx: number, text: string) => {
    const updated = [...formData.options];
    updated[idx].text = text;
    setFormData({ ...formData, options: updated });
  };

  const handleCorrectOptionSelect = (idx: number) => {
    const updated = formData.options.map((opt, i) => ({
      ...opt,
      isCorrect: i === idx,
    }));
    setFormData({ ...formData, options: updated });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.examId || !formData.questionText.trim()) {
      alert('Please select an exam and provide question text.');
      return;
    }
    const validOptions = formData.options.filter((o) => o.text.trim().length > 0);
    if (validOptions.length < 2) {
      alert('Please provide at least 2 non-empty options.');
      return;
    }
    const hasCorrect = validOptions.some((o) => o.isCorrect);
    if (!hasCorrect) {
      alert('Please mark one option as the correct answer.');
      return;
    }

    try {
      await createAdminPYQ({
        examId: formData.examId,
        subjectId: formData.subjectId || undefined,
        topicId: formData.topicId || undefined,
        year: Number(formData.year) || 2024,
        questionText: formData.questionText.trim(),
        difficulty: formData.difficulty,
        explanation: formData.explanation.trim(),
        tags: formData.tags,
        options: validOptions,
      });

      setShowAddModal(false);
      setFormData({
        examId: '',
        subjectId: '',
        topicId: '',
        year: new Date().getFullYear(),
        questionText: '',
        difficulty: 'medium',
        explanation: '',
        tags: '',
        options: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
      });
      fetchQuestions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create question.');
    }
  };

  const handleDelete = async (pyqId: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await deleteAdminPYQ(pyqId);
      fetchQuestions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete question.');
    }
  };

  return (
    <div className="admin-pyqs-container">
      <div className="admin-pyqs-header">
        <div>
          <h2>Question Bank (PYQs)</h2>
          <p>Manage and seed chapter-wise previous year questions, answers, and explanations.</p>
        </div>

        <button
          onClick={() => {
            setShowAddModal(true);
            if (exams.length > 0 && !formData.examId) {
              handleModalExamChange(exams[0]._id);
            }
          }}
          className="btn-save"
          style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
        >
          + Add New Question
        </button>
      </div>

      <div className="pyqs-filters-bar">
        <div className="pyqs-filter-item">
          <label>Exam:</label>
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="pyqs-filter-select"
          >
            <option value="">All Exams</option>
            {exams.map((ex) => (
              <option key={ex._id} value={ex._id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>

        <div className="pyqs-filter-item">
          <label>Difficulty:</label>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="pyqs-filter-select"
          >
            <option value="">All Levels</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <form onSubmit={handleSearchSubmit} className="pyqs-filter-item" style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Search keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pyqs-search-input"
            style={{ width: '100%' }}
          />
        </form>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">Loading Question Bank...</div>
      ) : pyqs.length === 0 ? (
        <div className="admin-table-container" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
          <h3 style={{ color: '#f1f5f9', margin: '0 0 0.5rem 0' }}>No Questions Found</h3>
          <p style={{ color: '#94a3b8', margin: '0 0 1.5rem 0' }}>
            There are no question records matching the selected filters.
          </p>
          <button
            onClick={() => {
              setShowAddModal(true);
              if (exams.length > 0 && !formData.examId) {
                handleModalExamChange(exams[0]._id);
              }
            }}
            className="btn-save"
          >
            + Add First Question
          </button>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '45%' }}>Question</th>
                <th>Year</th>
                <th>Difficulty</th>
                <th>Exam</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pyqs.map((q) => {
                const examName = typeof q.examId === 'object' && q.examId?.name ? q.examId.name : 'Exam';
                const diffClass =
                  q.difficulty === 'easy'
                    ? 'difficulty-easy'
                    : q.difficulty === 'hard'
                    ? 'difficulty-hard'
                    : 'difficulty-medium';

                return (
                  <tr key={q._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc', marginBottom: '0.25rem' }}>
                        {q.questionText}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {q.options?.length || 0} Options configured
                      </div>
                    </td>
                    <td>
                      <strong>{q.year}</strong>
                    </td>
                    <td>
                      <span className={`difficulty-badge ${diffClass}`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td>
                      <span className="exam-badge">{examName}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(q._id)}
                        className="btn-delete-item"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>Add Question to Question Bank</h3>
            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                      Target Exam *
                    </label>
                    <select
                      required
                      value={formData.examId}
                      onChange={(e) => handleModalExamChange(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.6rem',
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '4px',
                        color: '#f8fafc',
                      }}
                    >
                      <option value="">Select Exam</option>
                      {exams.map((ex) => (
                        <option key={ex._id} value={ex._id}>
                          {ex.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                      Subject
                    </label>
                    <select
                      value={formData.subjectId}
                      onChange={(e) => handleModalSubjectChange(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.6rem',
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '4px',
                        color: '#f8fafc',
                      }}
                    >
                      <option value="">Optional Subject</option>
                      {modalSubjects.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                      Topic
                    </label>
                    <select
                      value={formData.topicId}
                      onChange={(e) => setFormData({ ...formData, topicId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.6rem',
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '4px',
                        color: '#f8fafc',
                      }}
                    >
                      <option value="">Optional Topic</option>
                      {modalTopics.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                      Exam Year *
                    </label>
                    <input
                      type="number"
                      required
                      min={1990}
                      max={2030}
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '0.6rem',
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '4px',
                        color: '#f8fafc',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                      Difficulty Level
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.6rem',
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '4px',
                        color: '#f8fafc',
                      }}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Question Statement *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Enter the complete question text..."
                    value={formData.questionText}
                    onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                      color: '#f8fafc',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Options (Select radio button for Correct Answer) *
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {formData.options.map((opt, idx) => (
                      <div key={idx} className="option-edit-row">
                        <input
                          type="radio"
                          name="correctOption"
                          checked={opt.isCorrect}
                          onChange={() => handleCorrectOptionSelect(idx)}
                          title="Mark as correct answer"
                          style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                        />
                        <span style={{ fontWeight: 700, color: 'var(--color-accent)', fontSize: '0.85rem' }}>
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        <input
                          type="text"
                          required={idx < 2}
                          placeholder={`Option ${String.fromCharCode(65 + idx)} text`}
                          value={opt.text}
                          onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                          style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: '#f8fafc',
                            fontSize: '0.85rem',
                          }}
                        />
                        {opt.isCorrect && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>
                            ✓ Correct
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Explanation / Solution Details
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Step-by-step logic and concept explanation..."
                    value={formData.explanation}
                    onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                      color: '#f8fafc',
                    }}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPYQs;

