import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import {
    LayoutDashboard, Users, BookOpen, GraduationCap, ClipboardCheck,
    FileText, DollarSign, Library, Settings, LogOut, Menu, X, Sun, Moon, 
    Building2, MessageSquare, UserCheck, Calendar, Bell, Activity,
    Home, Navigation, Bus, Package
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

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
            { path: '/faculty/schedule', label: 'My Schedule', icon: Clock, roles: ['faculty'] },
            { path: '/my-performance', label: 'My Performance', icon: GraduationCap, roles: ['student'] },
            { path: '/feedback', label: 'Course Feedback', icon: MessageSquare, roles: ['student', 'admin'] },
        ]
    },
    {
        section: 'Finance & Services', items: [
            { path: '/fees', label: 'Fees & Payments', icon: DollarSign, roles: ['admin', 'staff', 'student'] },
            { path: '/hostels', label: 'Hostel & Residence', icon: Home, roles: null },
            { path: '/transport', label: 'Transport', icon: Bus, roles: null },
            { path: '/inventory', label: 'Campus Inventory', icon: Package, roles: null },
            { path: '/library', label: 'Library', icon: Library, roles: null },
            { path: '/events', label: 'Campus Events', icon: Calendar, roles: null },
        ]
    },
    {
        section: 'Administration', items: [
            { path: '/approvals', label: 'Approvals', icon: UserCheck, roles: ['admin'] },
            { path: '/personnel', label: 'Personnel & Payroll', icon: Users, roles: ['admin', 'staff', 'faculty', 'librarian'] },
            { path: '/users', label: 'User Management', icon: Settings, roles: ['admin'] },
        ]
    },
];

export default function Layout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem('erp_theme') || 'dark');
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('erp_theme', theme);
    }, [theme]);

    useEffect(() => {
        const socket = io(window.location.origin, { transports: ['websocket'] });
        socketRef.current = socket;

        socket.on('dashboard:update', (data) => {
            const msg = `Updates in ${data.resource}`;
            setNotifications(prev => [{ id: Date.now(), message: msg, type: data.resource }, ...prev].slice(0, 5));
        });

        return () => socket.disconnect();
    }, []);

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
            <a href="#main-content" className="btn btn-primary" style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }} onFocus={(e) => { e.target.style.position = 'fixed'; e.target.style.top = '8px'; e.target.style.left = '8px'; e.target.style.width = 'auto'; e.target.style.height = 'auto'; e.target.style.zIndex = '9999'; }} onBlur={(e) => { e.target.style.position = 'absolute'; e.target.style.left = '-9999px'; e.target.style.width = '1px'; e.target.style.height = '1px'; }}>
                Skip to main content
            </a>
            {sidebarOpen && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 99 }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

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
                                        <item.icon size={18} />
                                        <span>{item.label}</span>
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
                    <button className="modal-close" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} style={{ marginLeft: 'auto' }}>
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button className="modal-close" onClick={logout} title="Logout">
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>

            <main className="main-content" id="main-content">
                <div className="page-header glass" style={{ borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}>
                    <div className="page-header-content">
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            id="mobile-menu-btn"
                        >
                            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                        <div>
                            <h2>{getPageTitle()}</h2>
                            <p>Welcome back, {user?.firstName}!</p>
                        </div>
                        <div className="header-actions" style={{ marginLeft: 'auto', display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ position: 'relative' }}>
                                <button 
                                    className="btn btn-secondary btn-icon" 
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    style={{ position: 'relative' }}
                                >
                                    <Bell size={20} />
                                    {notifications.length > 0 && <span className="notification-dot pulse"></span>}
                                </button>
                                {showNotifications && (
                                    <div className="notification-dropdown glass fade-in">
                                        <div className="dropdown-header">Recent Activity</div>
                                        {notifications.length === 0 ? (
                                            <div style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>No new notifications</div>
                                        ) : (
                                            notifications.map(n => (
                                                <div key={n.id} className="notification-item">
                                                    <div className="item-icon"><Activity size={14} /></div>
                                                    <div className="item-content">{n.message}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="page-body fade-in">
                    <Outlet />
                </div>
            </main>
            <style>{`
                .notification-dot {
                    position: absolute;
                    top: -2px;
                    right: -2px;
                    width: 7px;
                    height: 7px;
                    background: var(--danger);
                    border-radius: 50%;
                    border: 1.5px solid var(--card-bg);
                }
                .notification-dropdown {
                    position: absolute;
                    top: 110%;
                    right: 0;
                    width: 240px;
                    background: var(--card-bg);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    z-index: 1000;
                    overflow: hidden;
                }
                .dropdown-header {
                    padding: 12px 16px;
                    border-bottom: 1px solid var(--border);
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-muted);
                    letter-spacing: 0.5px;
                }
                .notification-item {
                    padding: 12px 16px;
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    border-bottom: 1px solid var(--border);
                    transition: background 0.2s;
                    cursor: pointer;
                }
                .notification-item:last-child { border-bottom: none; }
                .notification-item:hover { background: rgba(255,255,255,0.05); }
                .item-icon { color: var(--accent); display: flex; }
                .item-content { font-size: 13px; color: var(--text); }
                .pulse {
                    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
                    animation: pulse-red 2s infinite;
                }
                @keyframes pulse-red {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
            `}</style>
        </div>
    );
}
