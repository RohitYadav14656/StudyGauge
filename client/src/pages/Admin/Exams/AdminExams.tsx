import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExams, createExam, updateExam } from '../../../services/examService';
import './AdminExams.css';

interface Exam {
  _id: string;
  name: string;
  description: string;
  level: string;
}

const AdminExams: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    level: 'Undergraduate'
  });

  const fetchExams = async () => {
    try {
      setLoading(true);
      const data = await getExams();
      setExams(data);
    } catch (err: any) {
      setError('Failed to load exams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleOpenModal = (exam?: Exam) => {
    if (exam) {
      setEditingExam(exam);
      setFormData({
        name: exam.name,
        description: exam.description,
        level: exam.level || 'Undergraduate'
      });
    } else {
      setEditingExam(null);
      setFormData({
        name: '',
        description: '',
        level: 'Undergraduate'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingExam(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExam) {
        await updateExam(editingExam._id, formData);
      } else {
        await createExam(formData);
      }
      handleCloseModal();
      fetchExams();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save exam');
    }
  };

  if (loading && exams.length === 0) {
    return <div className="admin-loading">Loading Exams...</div>;
  }

  return (
    <div className="admin-exams-container">
      <div className="admin-exams-header">
        <div>
          <h2>Exam Management</h2>
          <p>Create, update, and manage the list of available exams.</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          + Add New Exam
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Level</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {exams.map(exam => (
              <tr key={exam._id}>
                <td><strong>{exam.name}</strong></td>
                <td className="truncate-text">{exam.description}</td>
                <td><span className="exam-badge">{exam.level}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="btn-edit" 
                      onClick={() => navigate(`/admin/subjects?examId=${exam._id}`)}
                      style={{ background: 'rgba(217, 164, 65, 0.15)', color: 'var(--color-accent)', border: '1px solid rgba(56, 189, 248, 0.3)' }}
                    >
                      Manage Subjects
                    </button>
                    <button className="btn-edit" onClick={() => handleOpenModal(exam)}>
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {exams.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center">No exams found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingExam ? 'Edit Exam' : 'Create New Exam'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Exam Name</label>
                <input 
                  type="text" 
                  required 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., GATE"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  required 
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the exam..."
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Level</label>
                <select 
                  value={formData.level}
                  onChange={e => setFormData({ ...formData, level: e.target.value })}
                >
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Postgraduate">Postgraduate</option>
                  <option value="Undergraduate/Postgraduate">Undergraduate/Postgraduate</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  {editingExam ? 'Update Exam' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExams;
