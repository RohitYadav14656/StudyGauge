import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getExams } from '../../../services/examService';
import { getSubjects, createSubject, updateSubject } from '../../../services/syllabusService';
import './AdminSubjects.css';

interface Exam {
  _id: string;
  name: string;
}

interface Subject {
  _id: string;
  examId: Exam | string;
  name: string;
  shortName: string;
  description: string;
  order: number;
  active: boolean;
  weightage: number;
}

const AdminSubjects: React.FC = () => {
  const [searchParams] = useSearchParams();
  const examIdParam = searchParams.get('examId');

  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>(examIdParam || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  
  const [formData, setFormData] = useState({
    examId: '',
    name: '',
    shortName: '',
    description: '',
    order: 0,
    weightage: 0,
    active: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const examsData = await getExams();
      setExams(examsData);
      
      const subjectsData = await getSubjects(selectedExam || undefined);
      setSubjects(subjectsData);
    } catch (err: any) {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedExam]);

  const handleOpenModal = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        examId: typeof subject.examId === 'string' ? subject.examId : (subject.examId ? subject.examId._id : ''),
        name: subject.name,
        shortName: subject.shortName || '',
        description: subject.description || '',
        order: subject.order || 0,
        weightage: subject.weightage || 0,
        active: subject.active
      });
    } else {
      setEditingSubject(null);
      setFormData({
        examId: selectedExam || (exams.length > 0 ? exams[0]._id : ''),
        name: '',
        shortName: '',
        description: '',
        order: subjects.length + 1,
        weightage: 0,
        active: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSubject(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await updateSubject(editingSubject._id, formData);
      } else {
        await createSubject(formData);
      }
      handleCloseModal();
      fetchData(); // Refresh list
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save subject');
    }
  };

  return (
    <div className="admin-subjects-container">
      <div className="admin-header-row">
        <div>
          <h2>Subject Management</h2>
          <p>Manage subjects for all available exams.</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          + Add New Subject
        </button>
      </div>

      <div className="filter-bar">
        <label>Filter by Exam: </label>
        <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)}>
          <option value="">All Exams</option>
          {exams.map(ex => (
            <option key={ex._id} value={ex._id}>{ex.name}</option>
          ))}
        </select>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">Loading Subjects...</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Exam</th>
                <th>Name</th>
                <th>Short Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map(subject => {
                const examName = subject.examId && typeof subject.examId === 'object' ? subject.examId.name : (typeof subject.examId === 'string' ? subject.examId : 'Unknown');
                return (
                  <tr key={subject._id}>
                    <td>{subject.order}</td>
                    <td><span className="exam-badge">{examName}</span></td>
                    <td><strong>{subject.name}</strong></td>
                    <td>{subject.shortName || '-'}</td>
                    <td>
                      <span className={`status-badge ${subject.active ? 'active' : 'inactive'}`}>
                        {subject.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="btn-edit" onClick={() => handleOpenModal(subject)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
              {subjects.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center">No subjects found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingSubject ? 'Edit Subject' : 'Create New Subject'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Exam</label>
                <select 
                  required
                  value={formData.examId}
                  onChange={e => setFormData({ ...formData, examId: e.target.value })}
                >
                  <option value="" disabled>Select an Exam</option>
                  {exams.map(ex => (
                    <option key={ex._id} value={ex._id}>{ex.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Subject Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Short Name</label>
                  <input 
                    type="text" 
                    value={formData.shortName}
                    onChange={e => setFormData({ ...formData, shortName: e.target.value })}
                  />
                </div>
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
                <div className="form-group flex-1">
                  <label>Weightage (%)</label>
                  <input 
                    type="number" 
                    value={formData.weightage}
                    onChange={e => setFormData({ ...formData, weightage: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="form-group-checkbox">
                <input 
                  type="checkbox" 
                  id="active"
                  checked={formData.active}
                  onChange={e => setFormData({ ...formData, active: e.target.checked })}
                />
                <label htmlFor="active">Active (Visible to students)</label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  {editingSubject ? 'Update Subject' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubjects;
