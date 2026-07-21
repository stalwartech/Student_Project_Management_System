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

import { SupervisorDashboardPage } from "@/pages/supervisor/DashboardPage";
import { ProjectsPage } from "@/pages/supervisor/ProjectsPage";
import { ProjectDetailPage } from "@/pages/supervisor/ProjectDetailPage";
import { ChapterReviewPage } from "@/pages/supervisor/ChapterReviewPage";
import { FeedbackInboxPage } from "@/pages/supervisor/FeedbackInboxPage";
import { MeetingsPage } from "@/pages/supervisor/MeetingsPage";
import { MeetingDetailPage } from "@/pages/supervisor/MeetingDetailPage";
import { TaskMonitoringPage } from "@/pages/supervisor/TaskMonitoringPage";

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

            {/* Protected supervisor app shell */}
            <Route
              element={
                <ProtectedRoute allow={["supervisor"]}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/supervisor/dashboard" element={<SupervisorDashboardPage />} />
              <Route path="/supervisor/projects" element={<ProjectsPage />} />
              <Route path="/supervisor/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/supervisor/projects/:projectId/tasks" element={<TaskMonitoringPage />} />
              <Route path="/supervisor/chapters/:chapterId" element={<ChapterReviewPage />} />
              <Route path="/supervisor/feedback" element={<FeedbackInboxPage />} />
              <Route path="/supervisor/meetings" element={<MeetingsPage />} />
              <Route path="/supervisor/meetings/:id" element={<MeetingDetailPage />} />

              {/* Shared screens also used by the supervisor */}
              <Route path="/account" element={<AccountSettingsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/messages" element={<MessagesPage />} />
            </Route>

            <Route path="/" element={<Navigate to="/supervisor/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/supervisor/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
