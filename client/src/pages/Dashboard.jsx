import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    GraduationCap, BookOpen, Users, ClipboardCheck,
    DollarSign, Library, TrendingUp, Activity
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#3b82f6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const socketRef = useRef(null);

    const fetchStats = useCallback(() => {
        api.get('/dashboard/stats')
            .then(res => setStats(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Initial fetch + Socket.IO real-time listener
    useEffect(() => {
        fetchStats();

        // Connect to the Socket.IO server (same origin as API)
        const socket = io(window.location.origin, {
            transports: ['websocket', 'polling'],
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('🔌 Dashboard connected to live updates');
            setConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('🔌 Dashboard disconnected from live updates');
            setConnected(false);
        });

        socket.on('dashboard:update', (data) => {
            console.log('📊 Data changed:', data.resource, data.action);
            fetchStats();
        });

        return () => {
            socket.disconnect();
        };
    }, [fetchStats]);

    if (loading) return <div className="loading"><div className="spinner"></div></div>;
    if (!stats) return <div className="empty-state"><p>Unable to load dashboard data.</p></div>;

    const { overview, departmentStats, recentEnrollments } = stats;

    const statCards = [
        { label: 'Total Students', value: overview.totalStudents, icon: GraduationCap, color: 'purple' },
        { label: 'Total Faculty', value: overview.totalFaculty, icon: Users, color: 'blue' },
        { label: 'Active Subjects', value: overview.totalCourses, icon: BookOpen, color: 'cyan' },
        { label: 'Attendance Rate', value: `${overview.attendanceRate}%`, icon: ClipboardCheck, color: 'green', sub: 'Today' },
        { label: 'Fee Collected', value: `$${(overview.totalCollected || 0).toLocaleString()}`, icon: DollarSign, color: 'orange', sub: `$${(overview.pendingFees || 0).toLocaleString()} pending` },
        { label: 'Library Books', value: overview.totalBooks, icon: Library, color: 'red', sub: `${overview.activeLoans || 0} on loan` },
    ];

    const deptData = (departmentStats || []).map(d => ({
        name: d.department,
        students: parseInt(d.count),
    }));

    const pieData = (departmentStats || []).map(d => ({
        name: d.department,
        value: parseInt(d.count),
    }));

    return (
        <div className="fade-in">
            {/* Live indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: connected ? '#22c55e' : '#6b7280',
                    boxShadow: connected ? '0 0 6px #22c55e' : 'none',
                    animation: connected ? 'pulse 2s infinite' : 'none',
                    display: 'inline-block',
                }} />
                {connected ? 'Live — auto-updating' : 'Connecting…'}
            </div>

            {/* Stat cards */}
            <div className="stat-grid">
                {statCards.map((card, i) => (
                    <div className="stat-card" key={i}>
                        <div className={`stat-icon ${card.color}`}>
                            <card.icon size={24} />
                        </div>
                        <div className="stat-info">
                            <h4>{card.label}</h4>
                            <div className="stat-value">{card.value}</div>
                            {card.sub && <div className="stat-sub">{card.sub}</div>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="charts-grid">
                <div className="card">
                    <div className="card-header">
                        <h3><TrendingUp size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Students by Department</h3>
                    </div>
                    {deptData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={deptData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
                                <XAxis dataKey="name" stroke="#5b6580" fontSize={12} />
                                <YAxis stroke="#5b6580" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ background: '#1a1f35', border: '1px solid rgba(255,255,255,.1)', borderRadius: '10px', color: '#f0f2f7' }}
                                    labelStyle={{ color: '#f0f2f7' }}
                                    itemStyle={{ color: '#818cf8' }}
                                    cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                                />
                                <Bar dataKey="students" fill="#6366f1" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state"><p>No department data available</p></div>
                    )}
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3><Activity size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Distribution Overview</h3>
                    </div>
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={3}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {pieData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: '#1a1f35', border: '1px solid rgba(255,255,255,.1)', borderRadius: '10px', color: '#f0f2f7' }}
                                    labelStyle={{ color: '#f0f2f7' }}
                                    itemStyle={{ color: '#818cf8' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state"><p>No data available</p></div>
                    )}
                </div>
            </div>

            {/* Recent Enrollments */}
            <div className="card">
                <div className="card-header">
                    <h3>Recent Enrollments</h3>
                </div>
                {recentEnrollments.length > 0 ? (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Roll No</th>
                                    <th>Subject</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentEnrollments.map((e, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{e.student?.name}</td>
                                        <td>{e.student?.rollNo}</td>
                                        <td>{e.course?.code} — {e.course?.title}</td>
                                        <td><span className="badge badge-success">Active</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state"><p>No recent enrollments</p></div>
                )}
            </div>
        </div>
    );
}
