import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Bugs from './pages/Bugs';
import ReportBug from './pages/ReportBug';
import BugDetails from './pages/BugDetails';
import EditBug from './pages/EditBug';
import TestCases from './pages/TestCases';
import CreateTestCase from './pages/CreateTestCase';
import TestCaseDetails from './pages/TestCaseDetails';
import EditTestCase from './pages/EditTestCase';
import ExecuteTestCase from './pages/ExecuteTestCase';
import QAReports from './pages/QAReports';
import AdminOverview from './pages/admin/AdminOverview';
import UserManagement from './pages/admin/UserManagement';
import AdminActivity from './pages/admin/AdminActivity';
import AdminSettings from './pages/admin/AdminSettings';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import ErrorBoundary from './components/ErrorBoundary';
import TestPlans from './pages/TestPlans';
import CreateTestPlan from './pages/CreateTestPlan';
import TestPlanDetails from './pages/TestPlanDetails';
import TestSuites from './pages/TestSuites';
import CreateTestSuite from './pages/CreateTestSuite';
import TestRuns from './pages/TestRuns';
import CreateTestRun from './pages/CreateTestRun';
import ExecuteTestRun from './pages/ExecuteTestRun';
import Requirements from './pages/Requirements';
import CreateRequirement from './pages/CreateRequirement';
import RequirementDetails from './pages/RequirementDetails';
import TraceabilityMatrix from './pages/TraceabilityMatrix';
import Releases from './pages/Releases';
import CreateRelease from './pages/CreateRelease';
import ReleaseDetails from './pages/ReleaseDetails';
import SearchResults from './pages/SearchResults';
import AIAssistant from './pages/AIAssistant';
import AIBugTriage from './pages/AIBugTriage';
import AISettingsPage from './pages/admin/AISettingsPage';
import Analytics from './pages/Analytics';
import SLADashboard from './pages/SLADashboard';
import SLAConfigPage from './pages/admin/SLAConfigPage';
import ManagementDashboard from './pages/ManagementDashboard';
import OverdueTasks from './pages/OverdueTasks';

const RootRedirect = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-3" />
        <p className="text-sm font-medium tracking-wide">Authenticating session...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          {/* Global Toast Provider */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#18181b',
                color: '#f4f4f5',
                border: '1px solid #27272a',
                fontSize: '13px',
                borderRadius: '10px',
              },
            }}
          />

          <Routes>
            {/* Root Route Handler */}
            <Route path="/" element={<RootRedirect />} />

            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Application Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetails />} />
                <Route path="/bugs" element={<Bugs />} />
                <Route path="/bugs/new" element={<ReportBug />} />
                <Route path="/bugs/:id" element={<BugDetails />} />
                <Route path="/bugs/:id/edit" element={<EditBug />} />
                <Route path="/report-bug" element={<ReportBug />} />
                <Route path="/test-cases" element={<TestCases />} />
                <Route path="/test-cases/new" element={<CreateTestCase />} />
                <Route path="/test-cases/:id" element={<TestCaseDetails />} />
                <Route path="/test-cases/:id/edit" element={<EditTestCase />} />
                <Route path="/test-cases/:id/execute" element={<ExecuteTestCase />} />
                <Route path="/qa-reports" element={<QAReports />} />
                <Route path="/reports" element={<Navigate to="/qa-reports" replace />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />

                {/* Phase 9 Routes */}
                <Route path="/test-plans" element={<TestPlans />} />
                <Route path="/test-plans/new" element={<CreateTestPlan />} />
                <Route path="/test-plans/:id" element={<TestPlanDetails />} />
                <Route path="/test-plans/:id/edit" element={<CreateTestPlan />} />
                <Route path="/test-suites" element={<TestSuites />} />
                <Route path="/test-suites/new" element={<CreateTestSuite />} />
                <Route path="/test-runs" element={<TestRuns />} />
                <Route path="/test-runs/new" element={<CreateTestRun />} />
                <Route path="/test-runs/:id" element={<ExecuteTestRun />} />
                <Route path="/test-runs/:id/execute" element={<ExecuteTestRun />} />
                <Route path="/requirements" element={<Requirements />} />
                <Route path="/requirements/new" element={<CreateRequirement />} />
                <Route path="/requirements/:id" element={<RequirementDetails />} />
                <Route path="/requirements/:id/edit" element={<CreateRequirement />} />
                <Route path="/traceability" element={<TraceabilityMatrix />} />
                <Route path="/releases" element={<Releases />} />
                <Route path="/releases/new" element={<CreateRelease />} />
                <Route path="/releases/:id" element={<ReleaseDetails />} />
                <Route path="/search" element={<SearchResults />} />

                {/* Phase 10 & 11 AI & Analytics Routes */}
                <Route path="/ai-assistant" element={<AIAssistant />} />
                <Route path="/ai/bug-triage" element={<AIBugTriage />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/sla" element={<SLADashboard />} />
                <Route path="/management-dashboard" element={<ManagementDashboard />} />
                <Route path="/overdue" element={<OverdueTasks />} />

                {/* Admin Protected Routes */}
                <Route path="/admin" element={<AdminOverview />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/activity" element={<AdminActivity />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/ai-settings" element={<AISettingsPage />} />
                <Route path="/admin/sla" element={<SLAConfigPage />} />
                <Route path="/admin-panel" element={<Navigate to="/admin" replace />} />
              </Route>
            </Route>

            {/* Custom 404 Catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
