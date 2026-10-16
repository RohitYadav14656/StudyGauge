import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout/MainLayout';
import Landing from './pages/Landing/Landing';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Profile from './pages/Profile/Profile';
import MyExams from './pages/Exams/MyExams';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './layouts/AdminLayout/AdminLayout';
import Dashboard from './pages/Admin/Dashboard/Dashboard';
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
import ComingSoon from './pages/Admin/ComingSoon/ComingSoon';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Application Layout with Global Header & Footer */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-exams" element={<MyExams />} />
          <Route path="/syllabus/:examId" element={<SyllabusView />} />
          <Route path="/study-tracker" element={<StudyTracker />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/mock-tests" element={<MockTestManager />} />
          <Route path="/pyqs" element={<PYQPractice />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/activity-timeline" element={<ActivityTimeline />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
        
        {/* Admin Portal Routes */}
        <Route path="/admin" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="exams" element={<AdminExams />} />
            <Route path="subjects" element={<AdminSubjects />} />
            <Route path="topics" element={<AdminTopics />} />
            <Route path="pyqs" element={<ComingSoon title="PYQs Management" />} />
            <Route path="users" element={<ComingSoon title="Users Management" />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
