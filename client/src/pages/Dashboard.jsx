import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    GraduationCap, BookOpen, Users, ClipboardCheck,
    DollarSign, Library, TrendingUp, Activity, MessageSquare, Heart,
    Clock, Calendar, AlertCircle
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = [
    'var(--accent)',
    'var(--info)',
    '#06b6d4', // Cyan
    'var(--success)',
    'var(--warning)',
    'var(--danger)',
    'var(--accent-light)',
    '#ec4899', // Pink
];

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
        const socket = io(import.meta.env.VITE_API_URL || window.location.origin, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            timeout: 3000,
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

    const { overview, departmentStats, recentEnrollments, sentimentStats, todaySchedule, upcomingExams, upcomingEvents } = stats;

    const statCards = [
        { label: 'Total Students', value: overview.totalStudents, icon: GraduationCap, color: 'purple', adminOnly: true },
        { label: 'Total Faculty', value: overview.totalFaculty, icon: Users, color: 'blue', adminOnly: true },
        { label: 'Active Subjects', value: overview.totalCourses, icon: BookOpen, color: 'cyan', adminOnly: true },
        { label: 'Attendance Rate', value: `${overview.attendanceRate}%`, icon: ClipboardCheck, color: 'green', sub: overview.attendanceDate ? `as of ${overview.attendanceDate}` : 'Today' },
        { label: 'Fee Collected', value: `$${(overview.totalCollected || 0).toLocaleString()}`, icon: DollarSign, color: 'orange', sub: `$${(overview.pendingFees || 0).toLocaleString()} pending`, adminOnly: true },
        { label: 'Course Feedback', value: sentimentStats?.avgScore || 0, icon: MessageSquare, color: 'pink', sub: `Avg Sentiment Score (-5 to 5)`, adminOnly: true },
        { label: 'Library Books', value: overview.totalBooks, icon: Library, color: 'red', sub: `${overview.activeLoans || 0} on loan` },
    ].filter(card => !card.adminOnly || user.role === 'admin');

    const deptData = (departmentStats || []).map(d => ({
        name: d.department,
        students: parseInt(d.count),
    }));

    const sentimentData = [
        { name: 'Positive', value: sentimentStats?.positive || 0, color: 'var(--success)' },
        { name: 'Neutral', value: sentimentStats?.neutral || 0, color: 'var(--warning)' },
        { name: 'Negative', value: sentimentStats?.negative || 0, color: 'var(--danger)' },
    ].filter(d => d.value > 0);

    const todayDateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="fade-in">
            {/* Current Class Hero (Faculty Only) */}
            {user.role === 'faculty' && todaySchedule?.some(item => {
                const now = new Date();
                const cur = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                return cur >= item.startTime && cur <= item.endTime;
            }) && (
                <div className="card pulse-card" style={{ 
                    marginBottom: '24px', 
                    borderLeft: '4px solid var(--success)', 
                    padding: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span className="badge badge-success">LIVE NOW</span>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Current Session</span>
                        </div>
                        {todaySchedule.filter(item => {
                            const now = new Date();
                            const cur = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                            return cur >= item.startTime && cur <= item.endTime;
                        }).map((currentClass, idx) => (
                            <div key={idx}>
                                <h2 style={{ margin: 0, letterSpacing: '-0.5px' }}>{currentClass.course?.title}</h2>
                                <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={16} /> {currentClass.startTime} - {currentClass.endTime}
                                    <span style={{ opacity: 0.3 }}>|</span>
                                    <Activity size={16} /> {currentClass.room || 'TBA'}
                                </p>
                            </div>
                        ))}
                    </div>
                    <a 
                        href={`/attendance?courseId=${todaySchedule.find(item => {
                            const now = new Date();
                            const cur = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                            return cur >= item.startTime && cur <= item.endTime;
                        })?.course?.id}`} 
                        className="btn btn-primary" 
                        style={{ padding: '12px 24px', borderRadius: 'var(--radius-lg)' }}
                    >
                        Mark Attendance
                    </a>
                </div>
            )}

            {/* Personalized Alerts */}
            {upcomingExams?.length > 0 && (
                <div className="card" style={{ marginBottom: '24px', border: '1px solid var(--warning)', background: 'var(--warning-bg)' }}>
                    <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
                        <div style={{ background: 'var(--warning)', padding: '8px', borderRadius: '8px', color: 'white' }}>
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <strong style={{ display: 'block' }}>Upcoming Exams</strong>
                            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                You have {upcomingExams.length} exam(s) scheduled in the next 7 days. 
                                Next: {upcomingExams[0].course?.title} on {upcomingExams[0].date}.
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Live indicator */}
            <div className="fade-in" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px', padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 500, border: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
                <span style={{
                    width: '8px', height: '8px', borderRadius: 'var(--radius-md)',
                    background: connected ? 'var(--success)' : '#6b7280',
                    display: 'inline-block',
                }} />
                <span style={{ color: connected ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                    {connected ? 'Live connection' : 'Disconnected'}
                </span>
            </div>

            {/* Stat cards */}
            <div className="stat-grid" style={{ marginBottom: '32px', gap: '24px' }}>
                {statCards.map((card, i) => (
                    <div className="stat-card" key={i} style={{ padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                        <div className={`stat-icon ${card.color}`} style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', marginBottom: '0' }}>
                            <card.icon size={28} />
                        </div>
                        <div className="stat-info" style={{ marginLeft: '16px' }}>
                            <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', opacity: 0.7 }}>{card.label}</h4>
                            <div className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 600, letterSpacing: '-0.5px' }}>{card.value}</div>
                            {card.sub && <div className="stat-sub" style={{ fontSize: '0.75rem', marginTop: '6px', opacity: 0.6 }}>{card.sub}</div>}
                        </div>
                    </div>
                ))}
            </div>

            <div className="charts-grid" style={{ marginBottom: '24px' }}>
                {/* Today's Schedule (Personalized) */}
                {(user.role === 'student' || user.role === 'faculty') && (
                    <div className="card" style={{ borderRadius: 'var(--radius-lg)' }}>
                        <div className="card-header" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Clock size={20} className="text-accent" /> ACADEMIC TIMELINE
                            </h3>
                            <span className="badge badge-outline">{todaySchedule?.length || 0} SESSIONS</span>
                        </div>
                        <div className="card-body" style={{ padding: '0 24px 24px 24px' }}>
                            {todaySchedule?.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {todaySchedule.map((item, i) => {
                                        const now = new Date();
                                        const cur = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                                        const isLive = cur >= item.startTime && cur <= item.endTime;
                                        
                                        return (
                                            <div key={i} className={`${isLive ? '' : ''}`} style={{ 
                                                display: 'flex', 
                                                gap: '16px', 
                                                padding: '16px',
                                                borderRadius: 'var(--radius-md)',
                                                border: isLive ? '1.5px solid var(--success)' : '1px solid var(--border-color)',
                                                background: isLive ? 'var(--success-bg)' : 'var(--bg-card)',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}>
                                                {isLive && <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--success)' }}></div>}
                                                <div style={{ 
                                                    width: '48px', 
                                                    height: '48px', 
                                                    borderRadius: 'var(--radius-md)', 
                                                    background: isLive ? 'var(--success-bg)' : 'var(--hover-bg-strong)', 
                                                    color: isLive ? 'var(--success)' : 'var(--text-muted)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    <Clock size={24} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                                            {item.course?.title}
                                                            {isLive && <span className="badge badge-success pulse" style={{ marginLeft: 12, fontSize: '0.65rem' }}>LIVE NOW</span>}
                                                        </div>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.startTime}</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <Activity size={14} style={{ opacity: 0.5 }} /> {item.room || 'TBA'} 
                                                        <span style={{ opacity: 0.2 }}>•</span> 
                                                        <BookOpen size={14} style={{ opacity: 0.5 }} /> {item.course?.code}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="empty-state" style={{ padding: '48px 0' }}>
                                    <Clock size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                                    <h3 style={{ margin: 0 }}>Timeline Clear</h3>
                                    <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>No academic sessions identified for the remainder of today.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Admin-only Department Chart */}
                {user.role === 'admin' && (
                    <div className="card" style={{ borderRadius: 'var(--radius-lg)' }}>
                        <div className="card-header" style={{ padding: '24px' }}>
                            <h3 style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <TrendingUp size={20} className="text-info" /> DEPARTMENTAL REACH
                            </h3>
                        </div>
                        <div className="card-body" style={{ padding: '0 24px 24px 24px' }}>
                            {deptData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                        <XAxis 
                                            dataKey="name" 
                                            stroke="var(--text-muted)" 
                                            fontSize={11} 
                                            tickLine={false} 
                                            axisLine={false}
                                            dy={10}
                                        />
                                        <YAxis 
                                            stroke="var(--text-muted)" 
                                            fontSize={11} 
                                            tickLine={false} 
                                            axisLine={false}
                                            dx={-10}
                                        />
                                        <Tooltip
                                            contentStyle={{ 
                                                background: 'var(--bg-card)', 
                                                border: '1px solid var(--border-color-strong)', 
                                                borderRadius: 'var(--radius-md)', 
                                                boxShadow: 'var(--shadow-lg)',
                                                backdropFilter: 'blur(10px)',
                                                color: 'var(--text-primary)' 
                                            }}
                                            labelStyle={{ fontWeight: 700, marginBottom: 4 }}
                                            cursor={{ fill: 'var(--hover-bg)', opacity: 0.4 }}
                                        />
                                        <Legend 
                                            verticalAlign="top" 
                                            align="right" 
                                            height={36} 
                                            iconType="circle" 
                                            formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600 }}>{value.toUpperCase()}</span>}
                                        />
                                        <Bar 
                                            name="Enrollment"
                                            dataKey="students" 
                                            fill="url(#colorStudents)" 
                                            radius={[8, 8, 0, 0]} 
                                            barSize={32}
                                        />
                                        <defs>
                                            <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.9}/>
                                                <stop offset="95%" stopColor="var(--accent-dark)" stopOpacity={0.4}/>
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="empty-state" style={{ padding: '48px 0' }}><p>No department data available</p></div>
                            )}
                        </div>
                    </div>
                )}

                <div className="card">
                    <div className="card-header">
                        <h3><Heart size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Course Sentiment</h3>
                    </div>
                    {sentimentData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie 
                                    data={sentimentData} 
                                    cx="50%" 
                                    cy="45%" 
                                    innerRadius={60}
                                    outerRadius={85} 
                                    paddingAngle={8} 
                                    dataKey="value" 
                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    labelLine={false}
                                >
                                    {sentimentData.map((entry, i) => (
                                        <Cell 
                                            key={i} 
                                            fill={
                                                entry.name === 'Positive' ? 'var(--success)' :
                                                entry.name === 'Negative' ? 'var(--danger)' : 'var(--accent)'
                                            } 
                                            stroke="none"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ 
                                        background: 'var(--bg-card)', 
                                        border: '1px solid var(--border-color-strong)', 
                                        borderRadius: 'var(--radius-md)', 
                                        boxShadow: 'var(--shadow-lg)',
                                        color: 'var(--text-primary)' 
                                    }}
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={36} 
                                    iconType="circle"
                                    formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600 }}>{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state"><p>No feedback data available</p></div>
                    )}
                </div>

                {/* Upcoming Events Widget */}
                <div className="card" style={{ borderRadius: 'var(--radius-lg)' }}>
                    <div className="card-header" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Calendar size={20} className="text-warning" /> CAMPUS CHRONICLES
                        </h3>
                        <a href="/events" className="badge badge-outline" style={{ textDecoration: 'none' }}>VIEW ALL</a>
                    </div>
                    <div className="card-body" style={{ padding: '0 24px 24px 24px' }}>
                        {upcomingEvents?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {upcomingEvents.map((event, i) => (
                                    <div key={i} className="" style={{ 
                                        display: 'flex', 
                                        gap: '16px', 
                                        padding: '16px', 
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        background: event.isHoliday ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.01)',
                                    }}>
                                        <div style={{ 
                                            width: '48px', 
                                            height: '48px', 
                                            borderRadius: 'var(--radius-md)', 
                                            background: event.isHoliday ? 'var(--danger-bg)' : 'var(--shadow-md)', 
                                            color: event.isHoliday ? 'var(--danger)' : 'var(--accent-light)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <span style={{ fontWeight: 600, fontSize: '1rem' }}>{new Date(event.date).getDate()}</span>
                                            <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 600 }}>{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{event.title}</div>
                                                <span className={`badge ${event.isHoliday ? 'badge-danger' : 'badge-outline'}`} style={{ fontSize: '0.65rem' }}>
                                                    {event.isHoliday ? 'HOLIDAY' : (event.type?.toUpperCase() || 'EVENT')}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', opacity: 0.7 }}>
                                                {event.location || event.description?.slice(0, 50)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state" style={{ padding: '48px 0' }}><p>No institutional events identified.</p></div>
                        )}
                    </div>
                </div>
            </div>

            {/* Upcoming Exams (Role Specific) */}
            {(user.role === 'student' || user.role === 'faculty') && upcomingExams?.length > 0 && (
                <div className="card" style={{ marginBottom: '32px', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <div className="card-header" style={{ padding: '24px' }}>
                        <h3 style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <AlertCircle size={20} className="text-danger" /> CRITICAL EXAM SCHEDULE
                        </h3>
                    </div>
                    <div className="table-wrapper" style={{ border: 'none' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ padding: '20px' }}>ACADEMIC SUBJECT</th>
                                    <th>SYNCHRONIZED DATE</th>
                                    <th>MAXIMUM SCORE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {upcomingExams.map((exam, i) => (
                                    <tr key={i} className="fade-in">
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{exam.course?.title}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{exam.course?.code}</div>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{exam.date}</td>
                                        <td><span className="badge badge-info" style={{ fontWeight: 600 }}>{exam.maxMarks}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Recent Enrollments (Admin Only) */}
            {user.role === 'admin' && (
                <div className="card" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <div className="card-header" style={{ padding: '24px' }}>
                        <h3 style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem' }}>RECENT INSTITUTIONAL ENROLLMENTS</h3>
                    </div>
                    {recentEnrollments.length > 0 ? (
                        <div className="table-wrapper" style={{ border: 'none' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '20px' }}>SCHOLAR NAME</th>
                                        <th>ROLL IDENTIFIER</th>
                                        <th>SUBJECT ASSIGNMENT</th>
                                        <th>STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentEnrollments.map((e, i) => (
                                        <tr key={i} className="fade-in">
                                            <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>{e.student?.name}</td>
                                            <td><code style={{ background: 'var(--hover-bg-strong)', padding: '4px 8px', borderRadius: '6px' }}>{e.student?.rollNo}</code></td>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{e.course?.title}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{e.course?.code}</div>
                                            </td>
                                            <td><span className="badge badge-success">ACTIVE</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state" style={{ padding: '64px' }}><p>No recent synchronization events identified.</p></div>
                    )}
                </div>
            )}
        </div>
    );
}
