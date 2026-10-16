import React, { useEffect, useState } from 'react';
import { getExams } from '../../../services/examService';
import { getSubjects, getTopics, createTopic, updateTopic } from '../../../services/syllabusService';
import './AdminTopics.css';

interface Exam {
  _id: string;
  name: string;
}

interface Subject {
  _id: string;
  name: string;
}

interface Subtopic {
  _id?: string;
  name: string;
  order: number;
  active: boolean;
}

interface Topic {
  _id: string;
  examId: Exam | string;
  subjectId: Subject | string;
  name: string;
  description: string;
  order: number;
  active: boolean;
  subtopics: Subtopic[];
}

const AdminTopics: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  
  const [formData, setFormData] = useState({
    examId: '',
    subjectId: '',
    name: '',
    description: '',
    order: 0,
    active: true,
    subtopics: [] as Subtopic[]
  });

  const fetchFilters = async () => {
    try {
      const examsData = await getExams();
      setExams(examsData);
      
      if (selectedExam) {
        const subjectsData = await getSubjects(selectedExam);
        setSubjects(subjectsData);
      } else {
        setSubjects([]);
      }
    } catch (err: any) {
      console.error('Failed to load filters', err);
    }
  };

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const data = await getTopics(selectedExam || undefined, selectedSubject || undefined);
      setTopics(data);
    } catch (err: any) {
      setError('Failed to load topics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, [selectedExam]);

  useEffect(() => {
    fetchTopics();
  }, [selectedExam, selectedSubject]);

  const handleOpenModal = async (topic?: Topic) => {
    // If we have selected an exam, ensure we have subjects loaded for the dropdown
    let currentSubjects = subjects;
    if (selectedExam && subjects.length === 0) {
       currentSubjects = await getSubjects(selectedExam);
       setSubjects(currentSubjects);
    }

    if (topic) {
      setEditingTopic(topic);
      const eId = topic.examId ? (typeof topic.examId === 'object' ? topic.examId._id : topic.examId) : '';
      const sId = topic.subjectId ? (typeof topic.subjectId === 'object' ? topic.subjectId._id : topic.subjectId) : '';
      
      // If editing and we don't have subjects for this exam loaded in the modal dropdown, load them
      if (eId !== selectedExam) {
         const newSubjects = await getSubjects(eId);
         setSubjects(newSubjects);
      }

      setFormData({
        examId: eId,
        subjectId: sId,
        name: topic.name,
        description: topic.description || '',
        order: topic.order || 0,
        active: topic.active,
        subtopics: topic.subtopics ? [...topic.subtopics] : []
      });
    } else {
      setEditingTopic(null);
      setFormData({
        examId: selectedExam || (exams.length > 0 ? exams[0]._id : ''),
        subjectId: selectedSubject || (currentSubjects.length > 0 ? currentSubjects[0]._id : ''),
        name: '',
        description: '',
        order: topics.length + 1,
        active: true,
        subtopics: []
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTopic(null);
  };

  // Subtopic Handlers
  const addSubtopic = () => {
    setFormData(prev => ({
      ...prev,
      subtopics: [...prev.subtopics, { name: '', order: prev.subtopics.length + 1, active: true }]
    }));
  };

  const updateSubtopic = (index: number, field: keyof Subtopic, value: any) => {
    const updated = [...formData.subtopics];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, subtopics: updated });
  };

  const removeSubtopic = (index: number) => {
    const updated = formData.subtopics.filter((_, i) => i !== index);
    setFormData({ ...formData, subtopics: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTopic) {
        await updateTopic(editingTopic._id, formData);
      } else {
        await createTopic(formData);
      }
      handleCloseModal();
      fetchTopics(); // Refresh list
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save topic');
    }
  };

  return (
    <div className="admin-topics-container">
      <div className="admin-header-row">
        <div>
          <h2>Topic Management</h2>
          <p>Manage topics and their nested subtopics.</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          + Add New Topic
        </button>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label>Filter by Exam: </label>
          <select value={selectedExam} onChange={e => { setSelectedExam(e.target.value); setSelectedSubject(''); }}>
            <option value="">All Exams</option>
            {exams.map(ex => (
              <option key={ex._id} value={ex._id}>{ex.name}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Filter by Subject: </label>
          <select 
            value={selectedSubject} 
            onChange={e => setSelectedSubject(e.target.value)}
            disabled={!selectedExam}
          >
            <option value="">All Subjects</option>
            {subjects.map(sub => (
              <option key={sub._id} value={sub._id}>{sub.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">Loading Topics...</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Subject</th>
                <th>Topic Name</th>
                <th>Subtopics</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {topics.map(topic => {
                const subjectName = topic.subjectId && typeof topic.subjectId === 'object' ? topic.subjectId.name : (typeof topic.subjectId === 'string' ? topic.subjectId : 'Unknown');
                return (
                  <tr key={topic._id}>
                    <td>{topic.order}</td>
                    <td><span className="subject-badge">{subjectName}</span></td>
                    <td><strong>{topic.name}</strong></td>
                    <td>
                      <span className="count-badge">{topic.subtopics?.length || 0}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${topic.active ? 'active' : 'inactive'}`}>
                        {topic.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="btn-edit" onClick={() => handleOpenModal(topic)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
              {topics.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center">No topics found for the selected filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <h3>{editingTopic ? 'Edit Topic' : 'Create New Topic'}</h3>
            <form onSubmit={handleSubmit} className="topic-form">
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Exam</label>
                  <select 
                    required
                    value={formData.examId}
                    onChange={async (e) => {
                      const exId = e.target.value;
                      setFormData({ ...formData, examId: exId, subjectId: '' });
                      const newSubs = await getSubjects(exId);
                      setSubjects(newSubs);
                    }}
                  >
                    <option value="" disabled>Select an Exam</option>
                    {exams.map(ex => (
                      <option key={ex._id} value={ex._id}>{ex.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Subject</label>
                  <select 
                    required
                    value={formData.subjectId}
                    onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
                    disabled={!formData.examId}
                  >
                    <option value="" disabled>Select a Subject</option>
                    {subjects.map(sub => (
                      <option key={sub._id} value={sub._id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Topic Name</label>
                <input 
                  type="text" 
                  required 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Display Order</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.order}
                    onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group-checkbox flex-1" style={{ marginTop: '2rem' }}>
                  <input 
                    type="checkbox" 
                    id="active"
                    checked={formData.active}
                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                  />
                  <label htmlFor="active">Active (Visible to students)</label>
                </div>
              </div>

              <hr className="divider" />
              
              <div className="subtopics-section">
                <div className="subtopics-header">
                  <h4>Subtopics (Optional)</h4>
                  <button type="button" className="btn-secondary-sm" onClick={addSubtopic}>
                    + Add Subtopic
                  </button>
                </div>
                
                {formData.subtopics.length === 0 ? (
                  <p className="no-subtopics">No subtopics defined.</p>
                ) : (
                  <div className="subtopics-list">
                    {formData.subtopics.map((st, index) => (
                      <div key={index} className="subtopic-item">
                        <div className="subtopic-order">
                          <input 
                            type="number"
                            title="Order"
                            value={st.order}
                            onChange={(e) => updateSubtopic(index, 'order', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="subtopic-name">
                          <input 
                            type="text"
                            placeholder="Subtopic Name"
                            required
                            value={st.name}
                            onChange={(e) => updateSubtopic(index, 'name', e.target.value)}
                          />
                        </div>
                        <div className="subtopic-active">
                          <input 
                            type="checkbox"
                            title="Active"
                            checked={st.active}
                            onChange={(e) => updateSubtopic(index, 'active', e.target.checked)}
                          />
                        </div>
                        <button type="button" className="btn-remove" onClick={() => removeSubtopic(index)}>
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  {editingTopic ? 'Update Topic' : 'Create Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTopics;
