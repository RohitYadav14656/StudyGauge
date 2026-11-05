import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout/MainLayout';
import Landing from './pages/Landing/Landing';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Profile from './pages/Profile/Profile';
import MyExams from './pages/Exams/MyExams';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './layouts/AdminLayout/AdminLayout';
import AdminDashboard from './pages/Admin/Dashboard/Dashboard';
import AdminExams from './pages/Admin/Exams/AdminExams';
import AdminSubjects from './pages/Admin/Subjects/AdminSubjects';
import AdminTopics from './pages/Admin/Topics/AdminTopics';
import SyllabusView from './pages/Syllabus/SyllabusView';
import StudyTracker from './pages/StudyTracker/StudyTracker';
import Goals from './pages/Goals/Goals';
import Planner from './pages/Planner/Planner';
import MockTestManager from './pages/MockTest/MockTestManager';
import PYQPractice from './pages/PYQ/PYQPractice';
import Analytics from './pages/Analytics/Analytics';
import ActivityTimeline from './pages/ActivityTimeline/ActivityTimeline';
import NotificationsPage from './pages/Notifications/Notifications';
import AdminSyllabus from './pages/Admin/Syllabus/AdminSyllabus';
import AdminPYQs from './pages/Admin/PYQs/AdminPYQs';
import AdminUsers from './pages/Admin/Users/AdminUsers';

import Dashboard from './pages/Dashboard/Dashboard';
import Recommendations from './pages/Recommendations/Recommendations';
import Revision from './pages/Revision/Revision';
import Integrations from './pages/Integrations/Integrations';

const AuthRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const token = localStorage.getItem('token');
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return element;
};

const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return element;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<AuthRoute element={<Landing />} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
          <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
          <Route path="/my-exams" element={<ProtectedRoute element={<MyExams />} />} />
          <Route path="/syllabus/:examId" element={<SyllabusView />} />
          <Route path="/study-tracker" element={<ProtectedRoute element={<StudyTracker />} />} />
          <Route path="/goals" element={<ProtectedRoute element={<Goals />} />} />
          <Route path="/planner" element={<ProtectedRoute element={<Planner />} />} />
          <Route path="/mock-tests" element={<ProtectedRoute element={<MockTestManager />} />} />
          <Route path="/pyqs" element={<ProtectedRoute element={<PYQPractice />} />} />
          <Route path="/recommendations" element={<ProtectedRoute element={<Recommendations />} />} />
          <Route path="/revision" element={<ProtectedRoute element={<Revision />} />} />
          <Route path="/analytics" element={<ProtectedRoute element={<Analytics />} />} />
          <Route path="/activity-timeline" element={<ProtectedRoute element={<ActivityTimeline />} />} />
          <Route path="/integrations" element={<ProtectedRoute element={<Integrations />} />} />
          <Route path="/notifications" element={<ProtectedRoute element={<NotificationsPage />} />} />
        </Route>

        <Route path="/admin" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="exams" element={<AdminExams />} />
            <Route path="subjects" element={<AdminSubjects />} />
            <Route path="topics" element={<AdminTopics />} />
            <Route path="syllabus" element={<AdminSyllabus />} />
            <Route path="pyqs" element={<AdminPYQs />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
