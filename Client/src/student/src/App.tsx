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

import { StudentDashboardPage } from "@/pages/student/DashboardPage";
import { MyProjectPage } from "@/pages/student/MyProjectPage";
import { ChapterWorkspacePage } from "@/pages/student/ChapterWorkspacePage";
import { TaskDetailPage } from "@/pages/student/TaskDetailPage";
import { ChapterSubmissionPage } from "@/pages/student/ChapterSubmissionPage";
import { FeedbackPage } from "@/pages/student/FeedbackPage";
import { MeetingsPage } from "@/pages/student/MeetingsPage";
import { ProgressPage } from "@/pages/student/ProgressPage";

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

            {/* Protected student app shell */}
            <Route
              element={
                <ProtectedRoute allow={["student"]}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/student/dashboard" element={<StudentDashboardPage />} />
              <Route path="/student/project" element={<MyProjectPage />} />
              <Route path="/student/chapters/:chapterId" element={<ChapterWorkspacePage />} />
              <Route path="/student/chapters/:chapterId/submit" element={<ChapterSubmissionPage />} />
              <Route path="/student/tasks/:taskId" element={<TaskDetailPage />} />
              <Route path="/student/feedback" element={<FeedbackPage />} />
              <Route path="/student/meetings" element={<MeetingsPage />} />
              <Route path="/student/progress" element={<ProgressPage />} />

              {/* Shared screens also used by the student */}
              <Route path="/account" element={<AccountSettingsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/messages" element={<MessagesPage />} />
            </Route>

            <Route path="/" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
