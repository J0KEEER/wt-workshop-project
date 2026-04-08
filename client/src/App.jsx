import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import Login from './pages/Login';

// PERF-01: Lazy-load all page components for code-splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Students = lazy(() => import('./pages/Students'));
const Courses = lazy(() => import('./pages/Courses'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Exams = lazy(() => import('./pages/Exams'));
const Fees = lazy(() => import('./pages/Fees'));
const Library = lazy(() => import('./pages/Library'));
const Users = lazy(() => import('./pages/Users'));
const Faculty = lazy(() => import('./pages/Faculty'));
const Departments = lazy(() => import('./pages/Departments'));
const Feedback = lazy(() => import('./pages/Feedback'));
const Register = lazy(() => import('./pages/Register'));
const Approvals = lazy(() => import('./pages/Approvals'));
const ExamAnalytics = lazy(() => import('./pages/ExamAnalytics'));
const Events = lazy(() => import('./pages/Events'));
const Personnel = lazy(() => import('./pages/Personnel'));
const StudentPerformance = lazy(() => import('./pages/StudentPerformance'));
const HostelManagement = lazy(() => import('./pages/HostelManagement'));
const TransportManagement = lazy(() => import('./pages/TransportManagement'));
const FacultySchedule = lazy(() => import('./pages/FacultySchedule'));
const InventoryManagement = lazy(() => import('./pages/InventoryManagement'));

function PageSkeleton() {
    return (
        <div className="page-skeleton fade-in" style={{ padding: '24px' }}>
            <div className="skeleton-bar" style={{ width: '30%', height: '28px', marginBottom: '24px' }} />
            <div className="skeleton-bar" style={{ width: '100%', height: '200px', marginBottom: '16px' }} />
            <div className="skeleton-bar" style={{ width: '100%', height: '400px' }} />
        </div>
    );
}

function Lazy({ children }) {
    return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>;
}

function ProtectedRoute({ children, roles }) {
    const { isAuthenticated, user, loading } = useAuth();
    if (loading) return <div className="loading"><div className="spinner"></div></div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
    return children;
}

function AppRoutes() {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Lazy><Dashboard /></Lazy>} />
                <Route path="students" element={<Lazy><Students /></Lazy>} />
                <Route path="courses" element={<Lazy><Courses /></Lazy>} />
                <Route path="faculty" element={<Lazy><Faculty /></Lazy>} />
                <Route path="attendance" element={<Lazy><Attendance /></Lazy>} />
                <Route path="exams" element={<Lazy><Exams /></Lazy>} />
                <Route path="fees" element={<Lazy><Fees /></Lazy>} />
                <Route path="library" element={<Lazy><Library /></Lazy>} />
                <Route path="users" element={<ProtectedRoute roles={['admin']}><Lazy><Users /></Lazy></ProtectedRoute>} />
                <Route path="departments" element={<Lazy><Departments /></Lazy>} />
                <Route path="feedback" element={<Lazy><Feedback /></Lazy>} />
                <Route path="events" element={<Lazy><Events /></Lazy>} />
                <Route path="personnel" element={<ProtectedRoute roles={['admin', 'staff', 'faculty', 'librarian']}><Lazy><Personnel /></Lazy></ProtectedRoute>} />
                <Route path="my-performance" element={<ProtectedRoute roles={['student']}><Lazy><StudentPerformance /></Lazy></ProtectedRoute>} />
                <Route path="hostels" element={<ProtectedRoute roles={['admin', 'faculty', 'student']}><Lazy><HostelManagement /></Lazy></ProtectedRoute>} />
                <Route path="transport" element={<ProtectedRoute roles={['admin', 'faculty', 'student']}><Lazy><TransportManagement /></Lazy></ProtectedRoute>} />
                <Route path="inventory" element={<ProtectedRoute roles={['admin', 'staff', 'faculty', 'student']}><Lazy><InventoryManagement /></Lazy></ProtectedRoute>} />
                <Route path="faculty/schedule" element={<ProtectedRoute roles={['faculty', 'admin']}><Lazy><FacultySchedule /></Lazy></ProtectedRoute>} />
                <Route path="approvals" element={<ProtectedRoute roles={['admin']}><Lazy><Approvals /></Lazy></ProtectedRoute>} />
                <Route path="exams/:id/analytics" element={<Lazy><ExamAnalytics /></Lazy>} />
            </Route>
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ToastProvider>
                <AuthProvider>
                    <AppRoutes />
                </AuthProvider>
            </ToastProvider>
        </BrowserRouter>
    );
}
