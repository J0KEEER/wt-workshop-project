import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Users, BookOpen, GraduationCap, ClipboardCheck,
    FileText, DollarSign, Library, Settings, LogOut, Menu, X, Sun, Moon, Building2
} from 'lucide-react';
import { useState, useEffect } from 'react';

const allNavItems = [
    {
        section: 'Main', items: [
            { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: null },
        ]
    },
    {
        section: 'Academic', items: [
            { path: '/students', label: 'Students', icon: GraduationCap, roles: ['admin', 'faculty', 'staff'] },
            { path: '/courses', label: 'Subjects', icon: BookOpen, roles: null },
            { path: '/faculty', label: 'Faculty', icon: Users, roles: ['admin', 'staff'] },
            { path: '/departments', label: 'Departments', icon: Building2, roles: null },
            { path: '/attendance', label: 'Attendance', icon: ClipboardCheck, roles: ['admin', 'faculty'] },
            { path: '/exams', label: 'Exams & Grades', icon: FileText, roles: ['admin', 'faculty'] },
        ]
    },
    {
        section: 'Finance & Services', items: [
            { path: '/fees', label: 'Fees & Payments', icon: DollarSign, roles: ['admin', 'staff', 'student'] },
            { path: '/library', label: 'Library', icon: Library, roles: null },
        ]
    },
    {
        section: 'Administration', items: [
            { path: '/users', label: 'User Management', icon: Settings, roles: ['admin'] },
        ]
    },
];

export default function Layout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem('erp_theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('erp_theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

    const getPageTitle = () => {
        const flat = allNavItems.flatMap(s => s.items);
        const current = flat.find(i => i.path === location.pathname);
        return current?.label || 'Dashboard';
    };

    const initials = user
        ? (user.firstName?.[0] || '') + (user.lastName?.[0] || '')
        : '?';

    return (
        <div className="app-layout">
            {/* Skip to main content link — web-design: accessibility */}
            <a href="#main-content" className="btn btn-primary" style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }} onFocus={(e) => { e.target.style.position = 'fixed'; e.target.style.top = '8px'; e.target.style.left = '8px'; e.target.style.width = 'auto'; e.target.style.height = 'auto'; e.target.style.zIndex = '9999'; }} onBlur={(e) => { e.target.style.position = 'absolute'; e.target.style.left = '-9999px'; e.target.style.width = '1px'; e.target.style.height = '1px'; }}>
                Skip to main content
            </a>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 99 }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} role="navigation" aria-label="Main navigation">
                <div className="sidebar-brand">
                    <div className="brand-icon" aria-hidden="true">E</div>
                    <div>
                        <h1>CollegeERP</h1>
                        <span>Campus Management</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {allNavItems.map((section) => {
                        const visibleItems = section.items.filter(
                            item => !item.roles || item.roles.includes(user?.role)
                        );
                        if (visibleItems.length === 0) return null;
                        return (
                            <div className="nav-section" key={section.section}>
                                <div className="nav-section-label">{section.section}</div>
                                {visibleItems.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        end={item.path === '/'}
                                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <item.icon />
                                        {item.label}
                                    </NavLink>
                                ))}
                            </div>
                        );
                    })}
                </nav>

                <div className="sidebar-user">
                    <div className="user-avatar">{initials}</div>
                    <div className="user-info">
                        <div className="user-name">{user?.firstName} {user?.lastName}</div>
                        <div className="user-role">{user?.role}</div>
                    </div>
                    <button className="modal-close" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} aria-label="Toggle theme" style={{ marginLeft: 'auto' }}>
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button className="modal-close" onClick={logout} title="Logout" aria-label="Sign out">
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="main-content" id="main-content">
                <div className="page-header">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                style={{ display: 'none' }}
                                id="mobile-menu-btn"
                            >
                                {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                            </button>
                            <h2>{getPageTitle()}</h2>
                        </div>
                        <p>Welcome back, {user?.firstName}!</p>
                    </div>
                </div>

                <div className="page-body fade-in">
                    <Outlet />
                </div>
            </main>

            <style>{`
        @media (max-width: 768px) {
          #mobile-menu-btn { display: inline-flex !important; }
        }
      `}</style>
        </div>
    );
}
