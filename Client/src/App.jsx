import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'

import { AuthProvider as CoordinatorAuthProvider, useAuth as useCoordinatorAuth } from './coordinator/src/context/AuthContext'
import { ToastProvider as CoordinatorToastProvider } from './coordinator/src/context/ToastContext'
import { ProtectedRoute as CoordinatorProtectedRoute } from './coordinator/src/components/ProtectedRoute'
import { DashboardLayout as CoordinatorLayout } from './coordinator/src/components/layout/DashboardLayout'
import { LoginPage as CoordinatorLogin } from './coordinator/src/pages/auth/LoginPage'
import { ActivatePage as CoordinatorActivate } from './coordinator/src/pages/auth/ActivatePage'
import { ForgotPasswordPage as CoordinatorForgotPassword } from './coordinator/src/pages/auth/ForgotPasswordPage'
import { AccountSettingsPage as CoordinatorAccount } from './coordinator/src/pages/shared/AccountSettingsPage'
import { NotificationsPage as CoordinatorNotifications } from './coordinator/src/pages/shared/NotificationsPage'
import { MessagesPage as CoordinatorMessages } from './coordinator/src/pages/shared/MessagesPage'
import { CoordinatorDashboardPage } from './coordinator/src/pages/coordinator/DashboardPage'
import { AcademicSessionsPage } from './coordinator/src/pages/coordinator/AcademicSessionsPage'
import { StudentsPage } from './coordinator/src/pages/coordinator/StudentsPage'
import { StudentDetailPage } from './coordinator/src/pages/coordinator/StudentDetailPage'
import { SupervisorsPage } from './coordinator/src/pages/coordinator/SupervisorsPage'
import { SupervisorDetailPage } from './coordinator/src/pages/coordinator/SupervisorDetailPage'
import { BulkImportPage } from './coordinator/src/pages/coordinator/BulkImportPage'
import { ProjectsPage as CoordinatorProjects } from './coordinator/src/pages/coordinator/ProjectsPage'
import { ProjectDetailPage as CoordinatorProjectDetail } from './coordinator/src/pages/coordinator/ProjectDetailPage'
import { AutoAllocationPage } from './coordinator/src/pages/coordinator/AutoAllocationPage'
import { ActivityLogPage } from './coordinator/src/pages/coordinator/ActivityLogPage'
import { ReportsPage } from './coordinator/src/pages/coordinator/ReportsPage'
import { SettingsPage } from './coordinator/src/pages/coordinator/SettingsPage'

import { AuthProvider as StudentAuthProvider } from './student/src/context/AuthContext'
import { ToastProvider as StudentToastProvider } from './student/src/context/ToastContext'
import { ProtectedRoute as StudentProtectedRoute } from './student/src/components/ProtectedRoute'
import { DashboardLayout as StudentLayout } from './student/src/components/layout/DashboardLayout'
import { LoginPage as StudentLogin } from './student/src/pages/auth/LoginPage'
import { ActivatePage as StudentActivate } from './student/src/pages/auth/ActivatePage'
import { ForgotPasswordPage as StudentForgotPassword } from './student/src/pages/auth/ForgotPasswordPage'
import { AccountSettingsPage as StudentAccount } from './student/src/pages/shared/AccountSettingsPage'
import { NotificationsPage as StudentNotifications } from './student/src/pages/shared/NotificationsPage'
import { MessagesPage as StudentMessages } from './student/src/pages/shared/MessagesPage'
import { StudentDashboardPage } from './student/src/pages/student/DashboardPage'
import { MyProjectPage } from './student/src/pages/student/MyProjectPage'
import { ChapterWorkspacePage } from './student/src/pages/student/ChapterWorkspacePage'
import { TaskDetailPage } from './student/src/pages/student/TaskDetailPage'
import { ChapterSubmissionPage } from './student/src/pages/student/ChapterSubmissionPage'
import { FeedbackPage as StudentFeedback } from './student/src/pages/student/FeedbackPage'
import { MeetingsPage as StudentMeetings } from './student/src/pages/student/MeetingsPage'
import { ProgressPage } from './student/src/pages/student/ProgressPage'
import { MySupervisorPage } from './student/src/pages/student/MySupervisorPage'

import { AuthProvider as SupervisorAuthProvider } from './supervisor/src/context/AuthContext'
import { ToastProvider as SupervisorToastProvider } from './supervisor/src/context/ToastContext'
import { ProtectedRoute as SupervisorProtectedRoute } from './supervisor/src/components/ProtectedRoute'
import { DashboardLayout as SupervisorLayout } from './supervisor/src/components/layout/DashboardLayout'
import { LoginPage as SupervisorLogin } from './supervisor/src/pages/auth/LoginPage'
import { ActivatePage as SupervisorActivate } from './supervisor/src/pages/auth/ActivatePage'
import { ForgotPasswordPage as SupervisorForgotPassword } from './supervisor/src/pages/auth/ForgotPasswordPage'
import { AccountSettingsPage as SupervisorAccount } from './supervisor/src/pages/shared/AccountSettingsPage'
import { NotificationsPage as SupervisorNotifications } from './supervisor/src/pages/shared/NotificationsPage'
import { MessagesPage as SupervisorMessages } from './supervisor/src/pages/shared/MessagesPage'
import { SupervisorDashboardPage } from './supervisor/src/pages/supervisor/DashboardPage'
import { ProjectsPage as SupervisorProjects } from './supervisor/src/pages/supervisor/ProjectsPage'
import { ProjectDetailPage as SupervisorProjectDetail } from './supervisor/src/pages/supervisor/ProjectDetailPage'
import { ChapterReviewPage } from './supervisor/src/pages/supervisor/ChapterReviewPage'
import { FeedbackInboxPage } from './supervisor/src/pages/supervisor/FeedbackInboxPage'
import { MeetingsPage as SupervisorMeetings } from './supervisor/src/pages/supervisor/MeetingsPage'
import { MeetingDetailPage } from './supervisor/src/pages/supervisor/MeetingDetailPage'
import { TaskMonitoringPage } from './supervisor/src/pages/supervisor/TaskMonitoringPage'
import { AssignedStudentsPage } from './supervisor/src/pages/supervisor/AssignedStudentsPage'

function RoleGateway() {
  const { user, loading } = useCoordinatorAuth()

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">Loading…</div>
  if (!user) return <CoordinatorLogin />

  const dashboardByRole = {
    coordinator: '/coordinator/dashboard',
    student: '/student/dashboard',
    supervisor: '/supervisor/dashboard',
  }

  return <Navigate to={dashboardByRole[user.role]} replace />
}

function App() {
  return <BrowserRouter future={{ v7_relativeSplatPath: true }}><Routes>
    <Route path="/" element={<CoordinatorAuthProvider><CoordinatorToastProvider><RoleGateway /></CoordinatorToastProvider></CoordinatorAuthProvider>} />
    <Route element={<CoordinatorAuthProvider><CoordinatorToastProvider><CoordinatorProtectedRoute allow={['coordinator']}><CoordinatorLayout /></CoordinatorProtectedRoute></CoordinatorToastProvider></CoordinatorAuthProvider>}>
      <Route path="/coordinator/dashboard" element={<CoordinatorDashboardPage />} /><Route path="/coordinator/academic-sessions" element={<AcademicSessionsPage />} /><Route path="/coordinator/students" element={<StudentsPage />} /><Route path="/coordinator/students/:id" element={<StudentDetailPage />} /><Route path="/coordinator/supervisors" element={<SupervisorsPage />} /><Route path="/coordinator/supervisors/:id" element={<SupervisorDetailPage />} /><Route path="/coordinator/import" element={<BulkImportPage />} /><Route path="/coordinator/projects" element={<CoordinatorProjects />} /><Route path="/coordinator/projects/:id" element={<CoordinatorProjectDetail />} /><Route path="/coordinator/allocation" element={<AutoAllocationPage />} /><Route path="/coordinator/activity" element={<ActivityLogPage />} /><Route path="/coordinator/reports" element={<ReportsPage />} /><Route path="/coordinator/settings" element={<SettingsPage />} /><Route path="/coordinator/account" element={<CoordinatorAccount />} /><Route path="/coordinator/notifications" element={<CoordinatorNotifications />} /><Route path="/coordinator/messages" element={<CoordinatorMessages />} />
    </Route>
    <Route path="/coordinator/login" element={<CoordinatorAuthProvider><CoordinatorToastProvider><CoordinatorLogin /></CoordinatorToastProvider></CoordinatorAuthProvider>} /><Route path="/coordinator/activate" element={<CoordinatorAuthProvider><CoordinatorToastProvider><CoordinatorActivate /></CoordinatorToastProvider></CoordinatorAuthProvider>} /><Route path="/coordinator/forgot-password" element={<CoordinatorAuthProvider><CoordinatorToastProvider><CoordinatorForgotPassword /></CoordinatorToastProvider></CoordinatorAuthProvider>} />
    <Route element={<StudentAuthProvider><StudentToastProvider><StudentProtectedRoute allow={['student']}><StudentLayout /></StudentProtectedRoute></StudentToastProvider></StudentAuthProvider>}>
      <Route path="/student/dashboard" element={<StudentDashboardPage />} /><Route path="/student/project" element={<MyProjectPage />} /><Route path="/student/supervisor" element={<MySupervisorPage />} /><Route path="/student/chapters/:chapterId" element={<ChapterWorkspacePage />} /><Route path="/student/chapters/:chapterId/submit" element={<ChapterSubmissionPage />} /><Route path="/student/tasks/:taskId" element={<TaskDetailPage />} /><Route path="/student/feedback" element={<StudentFeedback />} /><Route path="/student/meetings" element={<StudentMeetings />} /><Route path="/student/progress" element={<ProgressPage />} /><Route path="/student/account" element={<StudentAccount />} /><Route path="/student/notifications" element={<StudentNotifications />} /><Route path="/student/messages" element={<StudentMessages />} />
    </Route>
    <Route path="/student/login" element={<StudentAuthProvider><StudentToastProvider><StudentLogin /></StudentToastProvider></StudentAuthProvider>} /><Route path="/student/activate" element={<StudentAuthProvider><StudentToastProvider><StudentActivate /></StudentToastProvider></StudentAuthProvider>} /><Route path="/student/forgot-password" element={<StudentAuthProvider><StudentToastProvider><StudentForgotPassword /></StudentToastProvider></StudentAuthProvider>} />
    <Route element={<SupervisorAuthProvider><SupervisorToastProvider><SupervisorProtectedRoute allow={['supervisor']}><SupervisorLayout /></SupervisorProtectedRoute></SupervisorToastProvider></SupervisorAuthProvider>}>
      <Route path="/supervisor/dashboard" element={<SupervisorDashboardPage />} /><Route path="/supervisor/projects" element={<SupervisorProjects />} /><Route path="/supervisor/students" element={<AssignedStudentsPage />} /><Route path="/supervisor/projects/:id" element={<SupervisorProjectDetail />} /><Route path="/supervisor/projects/:projectId/tasks" element={<TaskMonitoringPage />} /><Route path="/supervisor/chapters/:chapterId" element={<ChapterReviewPage />} /><Route path="/supervisor/feedback" element={<FeedbackInboxPage />} /><Route path="/supervisor/meetings" element={<SupervisorMeetings />} /><Route path="/supervisor/meetings/:id" element={<MeetingDetailPage />} /><Route path="/supervisor/account" element={<SupervisorAccount />} /><Route path="/supervisor/notifications" element={<SupervisorNotifications />} /><Route path="/supervisor/messages" element={<SupervisorMessages />} />
    </Route>
    <Route path="/supervisor/login" element={<SupervisorAuthProvider><SupervisorToastProvider><SupervisorLogin /></SupervisorToastProvider></SupervisorAuthProvider>} /><Route path="/supervisor/activate" element={<SupervisorAuthProvider><SupervisorToastProvider><SupervisorActivate /></SupervisorToastProvider></SupervisorAuthProvider>} /><Route path="/supervisor/forgot-password" element={<SupervisorAuthProvider><SupervisorToastProvider><SupervisorForgotPassword /></SupervisorToastProvider></SupervisorAuthProvider>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter>
}

export default App
