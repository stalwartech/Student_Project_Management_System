import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

import { LoginPage } from "@/pages/auth/LoginPage";
import { ActivatePage } from "@/pages/auth/ActivatePage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";

import { AccountSettingsPage } from "@/pages/shared/AccountSettingsPage";
import { NotificationsPage } from "@/pages/shared/NotificationsPage";
import { MessagesPage } from "@/pages/shared/MessagesPage";

import { CoordinatorDashboardPage } from "@/pages/coordinator/DashboardPage";
import { AcademicSessionsPage } from "@/pages/coordinator/AcademicSessionsPage";
import { StudentsPage } from "@/pages/coordinator/StudentsPage";
import { StudentDetailPage } from "@/pages/coordinator/StudentDetailPage";
import { SupervisorsPage } from "@/pages/coordinator/SupervisorsPage";
import { SupervisorDetailPage } from "@/pages/coordinator/SupervisorDetailPage";
import { BulkImportPage } from "@/pages/coordinator/BulkImportPage";
import { ProjectsPage } from "@/pages/coordinator/ProjectsPage";
import { ProjectDetailPage } from "@/pages/coordinator/ProjectDetailPage";
import { AutoAllocationPage } from "@/pages/coordinator/AutoAllocationPage";
import { ActivityLogPage } from "@/pages/coordinator/ActivityLogPage";
import { ReportsPage } from "@/pages/coordinator/ReportsPage";
import { SettingsPage } from "@/pages/coordinator/SettingsPage";

export default function App() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/activate" element={<ActivatePage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected coordinator app shell */}
            <Route
              element={
                <ProtectedRoute allow={["coordinator"]}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/coordinator/dashboard" element={<CoordinatorDashboardPage />} />
              <Route path="/coordinator/academic-sessions" element={<AcademicSessionsPage />} />
              <Route path="/coordinator/students" element={<StudentsPage />} />
              <Route path="/coordinator/students/:id" element={<StudentDetailPage />} />
              <Route path="/coordinator/supervisors" element={<SupervisorsPage />} />
              <Route path="/coordinator/supervisors/:id" element={<SupervisorDetailPage />} />
              <Route path="/coordinator/import" element={<BulkImportPage />} />
              <Route path="/coordinator/projects" element={<ProjectsPage />} />
              <Route path="/coordinator/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/coordinator/allocation" element={<AutoAllocationPage />} />
              <Route path="/coordinator/activity" element={<ActivityLogPage />} />
              <Route path="/coordinator/reports" element={<ReportsPage />} />
              <Route path="/coordinator/settings" element={<SettingsPage />} />

              {/* Shared screens also used by the coordinator */}
              <Route path="/account" element={<AccountSettingsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/messages" element={<MessagesPage />} />
            </Route>

            <Route path="/" element={<Navigate to="/coordinator/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/coordinator/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
