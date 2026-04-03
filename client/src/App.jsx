import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Courses from './pages/Courses';
import Attendance from './pages/Attendance';
import Exams from './pages/Exams';
import Fees from './pages/Fees';
import Library from './pages/Library';
import Users from './pages/Users';
import Faculty from './pages/Faculty';
import Departments from './pages/Departments';
import Feedback from './pages/Feedback';
import Register from './pages/Register';
import Approvals from './pages/Approvals';
import ExamAnalytics from './pages/ExamAnalytics';
import Events from './pages/Events';
import Personnel from './pages/Personnel';
import StudentPerformance from './pages/StudentPerformance';
import HostelManagement from './pages/HostelManagement';
import TransportManagement from './pages/TransportManagement';
import FacultySchedule from './pages/FacultySchedule';
import InventoryManagement from './pages/InventoryManagement';

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
                <Route index element={<Dashboard />} />
                <Route path="students" element={<Students />} />
                <Route path="courses" element={<Courses />} />
                <Route path="faculty" element={<Faculty />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="exams" element={<Exams />} />
                <Route path="fees" element={<Fees />} />
                <Route path="library" element={<Library />} />
                <Route path="users" element={<ProtectedRoute roles={['admin']}><Users /></ProtectedRoute>} />
                <Route path="departments" element={<Departments />} />
                <Route path="feedback" element={<Feedback />} />
                <Route path="events" element={<Events />} />
                <Route path="personnel" element={<ProtectedRoute roles={['admin', 'staff', 'faculty', 'librarian']}><Personnel /></ProtectedRoute>} />
                <Route path="my-performance" element={<ProtectedRoute roles={['student']}><StudentPerformance /></ProtectedRoute>} />
                <Route path="hostels" element={<ProtectedRoute roles={['admin', 'faculty', 'student']}><HostelManagement /></ProtectedRoute>} />
                <Route path="transport" element={<ProtectedRoute roles={['admin', 'faculty', 'student']}><TransportManagement /></ProtectedRoute>} />
                <Route path="inventory" element={<ProtectedRoute roles={['admin', 'staff', 'faculty', 'student']}><InventoryManagement /></ProtectedRoute>} />
                <Route path="faculty/schedule" element={<ProtectedRoute roles={['faculty', 'admin']}><FacultySchedule /></ProtectedRoute>} />
                <Route path="approvals" element={<ProtectedRoute roles={['admin']}><Approvals /></ProtectedRoute>} />
                <Route path="exams/:id/analytics" element={<ExamAnalytics />} />
            </Route>
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <ToastProvider>
                <AuthProvider>
                    <AppRoutes />
                </AuthProvider>
            </ToastProvider>
        </BrowserRouter>
    );
}
