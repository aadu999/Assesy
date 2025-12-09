import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import Assessments from './pages/admin/Assessments';
import UsersPage from './pages/admin/Users';
import SessionsPage from './pages/admin/Sessions';
import SessionDetail from './pages/admin/SessionDetail';
import Settings from './pages/admin/Settings';
import Welcome from './pages/candidate/Welcome';
import CandidateRegistration from './pages/candidate/CandidateRegistration';
import AssessmentQuestions from './pages/candidate/AssessmentQuestions';
import CodingEnvironment from './pages/candidate/CodingEnvironment';
import AssessmentComplete from './pages/candidate/AssessmentComplete';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>; // Replace with proper loader
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Placeholder Dashboards
const CandidateDashboard = () => <div className="p-10 text-2xl font-bold">Candidate Dashboard</div>;

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="assessments" element={<Assessments />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="submissions" element={<SessionsPage />} />
        <Route path="sessions/:token" element={<SessionDetail />} />
        <Route path="settings" element={<Settings />} />
        {/* Further routes will be added here */}
      </Route>

      <Route path="/assessment/:token" element={<Welcome />} />
      <Route path="/assessment/:token/register" element={<CandidateRegistration />} />
      <Route path="/assessment/:token/questions" element={<AssessmentQuestions />} />
      <Route path="/assessment/:token/coding" element={<CodingEnvironment />} />
      <Route path="/assessment/complete" element={<AssessmentComplete />} />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <CandidateDashboard />
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
