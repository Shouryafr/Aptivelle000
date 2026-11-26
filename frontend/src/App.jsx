import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Demo from './pages/Demo';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import SkillGap from './pages/student/SkillGap';
import Internships from './pages/student/Internships';
import Applications from './pages/student/Applications';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import SkillInsights from './pages/faculty/SkillInsights';
import FacultyFeedback from './pages/faculty/FacultyFeedback';
import Verifications from './pages/faculty/Verifications';
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';
import PostInternship from './pages/recruiter/PostInternship';
import ManageInternships from './pages/recruiter/ManageInternships';
import Applicants from './pages/recruiter/Applicants';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute needsProfile={false}>
              <Onboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute needsProfile={false}>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Student */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute roles={['STUDENT']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute roles={['STUDENT']}>
              <StudentProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/skill-gap"
          element={
            <ProtectedRoute roles={['STUDENT']}>
              <SkillGap />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/internships"
          element={
            <ProtectedRoute roles={['STUDENT']}>
              <Internships />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/applications"
          element={
            <ProtectedRoute roles={['STUDENT']}>
              <Applications />
            </ProtectedRoute>
          }
        />

        {/* Faculty */}
        <Route
          path="/faculty/dashboard"
          element={
            <ProtectedRoute roles={['FACULTY']}>
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/skills"
          element={
            <ProtectedRoute roles={['FACULTY']}>
              <SkillInsights />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/feedback"
          element={
            <ProtectedRoute roles={['FACULTY']}>
              <FacultyFeedback />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/verifications"
          element={
            <ProtectedRoute roles={['FACULTY']}>
              <Verifications />
            </ProtectedRoute>
          }
        />

        {/* Recruiter */}
        <Route
          path="/recruiter/dashboard"
          element={
            <ProtectedRoute roles={['RECRUITER']}>
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/post-internship"
          element={
            <ProtectedRoute roles={['RECRUITER']}>
              <PostInternship />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/internships"
          element={
            <ProtectedRoute roles={['RECRUITER']}>
              <ManageInternships />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/internship/:id/applicants"
          element={
            <ProtectedRoute roles={['RECRUITER']}>
              <Applicants />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
