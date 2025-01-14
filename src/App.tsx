import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/providers/auth-provider';
import { AdminDashboard } from '@/pages/admin/dashboard';
import { RolesPage } from '@/pages/admin/roles';
import { LocationsPage } from '@/pages/admin/locations';
import { EmployeesPage } from '@/pages/admin/employees';
import { TimeOffRequestsPage } from '@/pages/admin/time-off-requests';
import { AdminSettingsPage } from '@/pages/admin/settings';
import { InitialSetupPage } from '@/pages/admin/initial-setup';
import { EmployeeDashboard } from '@/pages/employee/dashboard';
import { EmployeeTimeOffRequestsPage } from '@/pages/employee/time-off-requests';
import { SettingsPage } from '@/pages/employee/settings';
import { Login } from '@/pages/auth/login';
import { SignUp } from '@/pages/auth/signup';
import { EmployeeSignUp } from '@/pages/auth/employee-signup';
import { ChangePassword } from '@/pages/auth/change-password';
import { ForgotPassword } from '@/pages/auth/forgot-password';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/signup" element={<SignUp />} />
          <Route path="/employee/signup" element={<EmployeeSignUp />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Admin Routes */}
          <Route path="/admin">
            <Route
              path="initial-setup"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <InitialSetupPage />
                </ProtectedRoute>
              }
            />
            <Route
              index
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="roles"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <RolesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="locations"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <LocationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="employees"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <EmployeesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="time-off-requests"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <TimeOffRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminSettingsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Employee Routes */}
          <Route path="/employee">
            <Route
              index
              element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="time-off-requests"
              element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <EmployeeTimeOffRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all route - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}