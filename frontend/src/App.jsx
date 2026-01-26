import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute, AuthRedirect } from './components/common/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/EnhancedRegisterPage'
import OTPTestPage from './pages/OTPTestPage'
import OAuthSuccess from './pages/OAuthSuccess'
import Dashboard from './pages/Dashboard'
import EquipmentInventory from './pages/EquipmentInventory'
import EquipmentDetails from './pages/EquipmentDetails'
import BookingSystem from './pages/BookingSystem'
import OrderManagement from './pages/OrderManagement'
import UserManagement from './pages/UserManagement'
import ReportsAnalytics from './pages/EnhancedReportsAnalyticsNew'
import MaintenanceSchedule from './pages/MaintenanceSchedule'
import Notifications from './pages/Notifications'
import LabManagement from './components/LabManagement'
import Incidents from './pages/Incidents'
import Calendar from './pages/Calendar'
import Settings from './pages/Settings'
import NewProfile from './pages/NewProfile'
import Training from './pages/Training'
import RefreshTestComponent from './components/RefreshTestComponent'
import RefreshTestPage from './pages/RefreshTestPage'
import './index.css'
import Chatbot from './components/Chatbot'

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />

        {/* Auth Routes - redirect to dashboard if already logged in */}
        <Route
          path="/login"
          element={
            <AuthRedirect>
              <LoginPage />
            </AuthRedirect>
          }
        />
        <Route
          path="/register"
          element={
            <AuthRedirect>
              <RegisterPage />
            </AuthRedirect>
          }
        />

        {/* OAuth Success Route */}
        <Route path="/oauth/success" element={<OAuthSuccess />} />

        {/* OTP Test Page - for testing OTP functionality */}
        <Route path="/otp-test" element={<OTPTestPage />} />

        {/* Protected Routes - require authentication */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/equipment"
          element={
            <ProtectedRoute>
              <EquipmentInventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/equipment/:id"
          element={
            <ProtectedRoute>
              <EquipmentDetails />
            </ProtectedRoute>
          }
        />

        {/* Lab Management - Protected Route */}
        <Route
          path="/lab-management"
          element={
            <ProtectedRoute>
              <LabManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <BookingSystem />
            </ProtectedRoute>
          }
        />

        {/* Admin and Lab Assistant Routes */}
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrderManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute requiredRole={['admin', 'teacher', 'lab_assistant']}>
              <ReportsAnalytics />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/maintenance"
          element={
            <ProtectedRoute requiredRole={['admin', 'lab_assistant', 'teacher']}>
              <MaintenanceSchedule />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* Admin Only Routes */}
        <Route
          path="/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <UserManagement />
            </ProtectedRoute>
          }
        />

        {/* General Access Routes */}
        <Route
          path="/incidents"
          element={
            <ProtectedRoute>
              <Incidents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <NewProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/training"
          element={
            <ProtectedRoute>
              <Training />
            </ProtectedRoute>
          }
        />
        {/* Refresh Test Component - for testing authentication persistence */}
        <Route
          path="/refresh-test"
          element={
            <ProtectedRoute>
              <RefreshTestComponent />
            </ProtectedRoute>
          }
        />

        {/* Refresh Test Page - comprehensive refresh testing */}
        <Route
          path="/test-refresh"
          element={
            <ProtectedRoute>
              <RefreshTestPage />
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to dashboard if authenticated, otherwise to login */}
        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>

      {/* CHATBOT - Available on all authenticated pages */}
      <Chatbot />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;