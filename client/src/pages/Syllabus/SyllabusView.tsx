import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { getExamSyllabus } from '../../services/syllabusService';
import { getUserTopicProgress, updateUserTopicProgress, getExamProgressAnalytics } from '../../services/progressService';
import './SyllabusView.css';

interface SubjectAnalytics {
  subjectId: string;
  name: string;
  totalTopics: number;
  completedTopics: number;
  completionPercentage: number;
}

interface OverallAnalytics {
  totalTopics: number;
  completedTopics: number;
  pendingTopics: number;
  revisedTopics: number;
  notStartedTopics: number;
  inProgressTopics: number;
  completionPercentage: number;
}

interface AnalyticsData {
  overall: OverallAnalytics;
  subjects: SubjectAnalytics[];
}

interface Subtopic {
  _id: string;
  name: string;
  order: number;
}

interface Topic {
  _id: string;
  name: string;
  description: string;
  order: number;
  subtopics: Subtopic[];
}

interface Subject {
  _id: string;
  name: string;
  shortName: string;
  description: string;
  order: number;
  weightage: number;
  topics: Topic[];
}

interface ExamInfo {
  _id: string;
  name: string;
  description: string;
  level: string;
}

interface SyllabusData {
  exam: ExamInfo;
  syllabus: Subject[];
}

const SyllabusView: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  
  const [data, setData] = useState<SyllabusData | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, string>>({});
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isStudent, setIsStudent] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (examId) {
          const res = await getExamSyllabus(examId);
          setData(res);
          
          const token = localStorage.getItem('token');
          if (token) {
            try {
              const userRes = await axios.get('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (userRes.data.role === 'student') {
                setIsStudent(true);
                try {
                  const progress = await getUserTopicProgress(examId);
                  setProgressMap(progress);
                  const analyticsData = await getExamProgressAnalytics(examId);
                  setAnalytics(analyticsData);
                } catch (err) {
                  console.error('Could not fetch progress. Exam might not be in user list.');
                }
              }
            } catch (authErr) {
              console.error('Failed to authenticate user', authErr);
            }
          }

          if (res.syllabus && res.syllabus.length > 0) {
            setExpandedSubjects({ [res.syllabus[0]._id]: true });
          }
        }
      } catch (err: any) {
        setError('Failed to load syllabus. The exam might not exist or there is a network issue.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [examId]);

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [subjectId]: !prev[subjectId]
    }));
  };

  const toggleTopic = (topicId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  const handleStatusChange = async (topicId: string, newStatus: string) => {
    if (!examId || !isStudent) return;

    const previousStatus = progressMap[topicId] || 'Not Started';
    setProgressMap(prev => ({ ...prev, [topicId]: newStatus }));
    
    try {
      await updateUserTopicProgress(examId, topicId, newStatus);

      const updatedAnalytics = await getExamProgressAnalytics(examId);
      setAnalytics(updatedAnalytics);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update progress. Have you added this exam to your list?');

      setProgressMap(prev => ({ ...prev, [topicId]: previousStatus }));
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Completed': return 'status-completed';
      case 'In Progress': return 'status-inprogress';
      case 'Revised': return 'status-revised';
      default: return 'status-notstarted';
    }
  };

  if (loading) {
    return (
      <div className="syllabus-container">
        <div className="syllabus-loading">Loading Syllabus...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="syllabus-container">
        <div className="syllabus-error">
          <h3>Oops!</h3>
          <p>{error}</p>
          <Link to="/" className="btn-back">Go Back</Link>
        </div>
      </div>
    );
  }

  const { exam, syllabus } = data;

  return (
    <div className="syllabus-container">
      <div className="syllabus-header">
        <div className="breadcrumb">
          <Link to="/">Home</Link> &gt; <span>Syllabus</span> &gt; <span>{exam.name}</span>
        </div>
        <h1>{exam.name} Syllabus</h1>
        <p className="exam-desc">{exam.description}</p>
        <div className="exam-meta">
          <span className="badge">{exam.level}</span>
          <span className="badge badge-outline">{syllabus.length} Subjects</span>
        </div>
      </div>

      {isStudent && analytics && (
        <div className="progress-dashboard">
          <div className="progress-overview">
            <div className="progress-bar-container large">
              <div 
                className="progress-fill" 
                style={{ width: `${analytics.overall.completionPercentage}%` }}
              ></div>
            </div>
            <div className="progress-stats-main">
              <span className="percent">{analytics.overall.completionPercentage}% Completed</span>
              <span className="fraction">{analytics.overall.completedTopics} / {analytics.overall.totalTopics} Topics</span>
            </div>
          </div>
          <div className="progress-metrics">
            <div className="metric">
              <span className="metric-value pending">{analytics.overall.pendingTopics}</span>
              <span className="metric-label">Pending</span>
            </div>
            <div className="metric">
              <span className="metric-value completed">{analytics.overall.completedTopics}</span>
              <span className="metric-label">Completed</span>
            </div>
            <div className="metric">
              <span className="metric-value revised">{analytics.overall.revisedTopics}</span>
              <span className="metric-label">Revised</span>
            </div>
          </div>
        </div>
      )}

      {syllabus.length === 0 ? (
        <div className="empty-syllabus">
          <p>No syllabus content has been added for this exam yet.</p>
        </div>
      ) : (
        <div className="syllabus-content">
          {syllabus.map(subject => (
            <div key={subject._id} className={`subject-card ${expandedSubjects[subject._id] ? 'expanded' : ''}`}>
              <div 
                className="subject-header" 
                onClick={() => toggleSubject(subject._id)}
              >
                <div className="subject-title">
                  <h2>{subject.name} {subject.shortName && <span className="short-name">({subject.shortName})</span>}</h2>
                  {subject.description && <p>{subject.description}</p>}
                </div>
                <div className="subject-meta">
                  {isStudent && analytics && (
                    <div className="subject-progress">
                      {(() => {
                        const subjAnalytic = analytics.subjects.find(s => s.subjectId === subject._id);
                        if (!subjAnalytic) return null;
                        return (
                          <>
                            <div className="progress-bar-container small">
                              <div 
                                className="progress-fill" 
                                style={{ width: `${subjAnalytic.completionPercentage}%` }}
                              ></div>
                            </div>
                            <span className="progress-text">{subjAnalytic.completionPercentage}%</span>
                          </>
                        );
                      })()}
                    </div>
                  )}
                  {subject.weightage > 0 && <span className="weightage-badge">{subject.weightage}% Weightage</span>}
                  <span className="expand-icon">
                    {expandedSubjects[subject._id] ? '▼' : '▶'}
                  </span>
                </div>
              </div>
              
              {expandedSubjects[subject._id] && (
                <div className="subject-body">
                  {subject.topics.length === 0 ? (
                    <p className="no-topics">No topics available for this subject.</p>
                  ) : (
                    <div className="topics-list">
                      {subject.topics.map(topic => {
                        const currentStatus = progressMap[topic._id] || 'Not Started';
                        return (
                          <div key={topic._id} className={`topic-item ${getStatusColor(currentStatus)}`}>
                            <div className="topic-header">
                              <div 
                                className={`topic-title ${topic.subtopics.length > 0 ? 'clickable' : ''}`}
                                onClick={(e) => topic.subtopics.length > 0 && toggleTopic(topic._id, e)}
                              >
                                <span className="topic-bullet">•</span>
                                <h4>{topic.name}</h4>
                                {topic.subtopics.length > 0 && (
                                  <span className="expand-icon-sm">
                                    {expandedTopics[topic._id] ? '▼' : '▶'}
                                  </span>
                                )}
                              </div>
                              
                              {isStudent && (
                                <div className="topic-actions">
                                  <select 
                                    className={`status-select ${getStatusColor(currentStatus)}`}
                                    value={currentStatus}
                                    onChange={(e) => handleStatusChange(topic._id, e.target.value)}
                                  >
                                    <option value="Not Started">Not Started</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Revised">Revised</option>
                                  </select>
                                </div>
                              )}
                            </div>
                            
                            {topic.description && (
                              <p className="topic-desc">{topic.description}</p>
                            )}
                            
                            {expandedTopics[topic._id] && topic.subtopics.length > 0 && (
                              <div className="subtopics-list">
                                {topic.subtopics.map(subtopic => (
                                  <div key={subtopic._id} className="subtopic-item">
                                    <span className="subtopic-connector">└</span>
                                    <span className="subtopic-name">{subtopic.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SyllabusView;
