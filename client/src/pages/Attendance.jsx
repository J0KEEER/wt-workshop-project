import { useState, useEffect } from 'react';
import api from '../services/api';
import { Save, Calendar as CalendarIcon, Filter, ChevronLeft, ChevronRight, Palmtree, AlertCircle, BookOpen, Clock } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Attendance() {
    const toast = useToast();
    
    // Global State
    const [courses, setCourses] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Selection State
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [period, setPeriod] = useState('Period 1');
    const [tab, setTab] = useState('mark'); // 'mark' | 'history'
    
    // Course Context
    const [students, setStudents] = useState([]);
    const [sessions, setSessions] = useState([]); 
    const [records, setRecords] = useState({}); // Current day+period records
    const [courseMarkedDates, setCourseMarkedDates] = useState(new Set()); 
    const [courseScheduleDays, setCourseScheduleDays] = useState(new Set()); 
    const [history, setHistory] = useState([]);
    const [saving, setSaving] = useState(false);

    // Derived
    const isHoliday = holidays.some(h => h.date === date);
    const selectedCourse = courses.find(c => c.id === parseInt(selectedCourseId));
    
    const PERIODS = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6', 'Morning', 'Afternoon'];

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [cRes, hRes] = await Promise.all([
                    api.get('/courses'),
                    api.get('/holidays')
                ]);
                setCourses(cRes.data);
                setHolidays(hRes.data);
                
                // Check URL for direct attendance marking link (from dashboard)
                const params = new URLSearchParams(window.location.search);
                const qCourseId = params.get('courseId');
                const qPeriod = params.get('period');

                if (qCourseId) {
                    setSelectedCourseId(qCourseId);
                    if (qPeriod) setPeriod(qPeriod);
                } else {
                    // Fallback to auto-suggest
                    try {
                        const suggRes = await api.get('/attendance/suggest');
                        if (suggRes.data) {
                            setSelectedCourseId(suggRes.data.courseId.toString());
                            setPeriod(suggRes.data.period || 'Period 1');
                            toast.info(`Suggested current class: ${suggRes.data.courseTitle}`);
                        }
                    } catch (suggErr) {
                        console.log("Suggestion not available", suggErr);
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load initial data");
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // Fetch course details when selected
    useEffect(() => {
        if (!selectedCourseId) {
            setStudents([]);
            setSessions([]);
            setRecords({});
            setCourseMarkedDates(new Set());
            setCourseScheduleDays(new Set());
            setHistory([]);
            return;
        }

        const fetchCourseContext = async () => {
            try {
                const courseRes = await api.get(`/courses/${selectedCourseId}`);
                const schedule = courseRes.data.schedule || [];
                setCourseScheduleDays(new Set(schedule.map(s => s.dayOfWeek)));

                const rosterRes = await api.get(`/courses/${selectedCourseId}/roster`);
                setStudents(rosterRes.data);

                // Fetch full session history
                const allAttRes = await api.get('/attendance', { params: { courseId: selectedCourseId } });
                setSessions(allAttRes.data);
                
                const marked = new Set(allAttRes.data.map(session => session.date));
                setCourseMarkedDates(marked);

                const historyRes = await api.get('/attendance/report', { params: { courseId: selectedCourseId } });
                setHistory(historyRes.data);

            } catch (err) {
                console.error(err);
                toast.error("Error loading course data");
            }
        };
        fetchCourseContext();
    }, [selectedCourseId]);

    // Re-evaluate current records whenever date/period/sessions change
    useEffect(() => {
        if (!selectedCourseId) return;
        
        const currentSession = sessions.find(s => s.date === date && s.period === period);
        const rec = {};
        if (currentSession && currentSession.records) {
            currentSession.records.forEach(r => { rec[r.studentId] = r.status; });
        }
        setRecords(rec);
    }, [date, period, selectedCourseId, sessions]);

    const toggleStatus = (studentId, status) => {
        // According to user preferences, default is absent. 
        // If they click the same status again, probably reset to default ('absent').
        setRecords(prev => ({ 
            ...prev, 
            [studentId]: prev[studentId] === status && status !== 'absent' ? 'absent' : status 
        }));
    };

    const markAll = (status) => {
        const rec = {};
        students.forEach(s => { rec[s.id] = status; });
        setRecords(rec);
    };

    const handleSubmit = async () => {
        if (!selectedCourseId || students.length === 0) return;
        setSaving(true);
        try {
            // Create or fetch the session
            const sessionRes = await api.post('/attendance/session', { 
                courseId: parseInt(selectedCourseId), 
                date, 
                period 
            });
            const sessionId = sessionRes.data.id;

            // Prepare records (User wanted: 'Auto-mark all as absent by default')
            const attendanceRecords = students.map(s => ({
                studentId: s.id,
                status: records[s.id] || 'absent',
            }));

            // Save records
            await api.post('/attendance/save', { sessionId, records: attendanceRecords });
            
            // Reload all context to update UI immediately
            const historyRes = await api.get('/attendance/report', { params: { courseId: selectedCourseId } });
            setHistory(historyRes.data);
            
            const allAttRes = await api.get('/attendance', { params: { courseId: selectedCourseId } });
            setSessions(allAttRes.data);
            setCourseMarkedDates(new Set(allAttRes.data.map(session => session.date)));
            
            toast.success('Attendance saved!');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error saving attendance');
        } finally {
            setSaving(false);
        }
    };

    // Calendar rendering logic
    const renderCalendar = () => {
        const d = new Date(date);
        d.setDate(1);
        const startDay = d.getDay();
        const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        
        const days = [];
        for (let i = 0; i < startDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(d.getFullYear(), d.getMonth(), i).toISOString().split('T')[0]);

        return (
            <div className="attendance-calendar glass-morph" style={{ padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <div className="cal-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button className="btn btn-icon btn-sm" style={{ padding: '4px' }} onClick={() => {
                        const newDate = new Date(date);
                        newDate.setMonth(newDate.getMonth() - 1);
                        setDate(newDate.toISOString().split('T')[0]);
                    }}><ChevronLeft size={16}/></button>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{d.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                    <button className="btn btn-icon btn-sm" style={{ padding: '4px' }} onClick={() => {
                        const newDate = new Date(date);
                        newDate.setMonth(newDate.getMonth() + 1);
                        setDate(newDate.toISOString().split('T')[0]);
                    }}><ChevronRight size={16}/></button>
                </div>
                <div className="cal-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day} style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px' }}>{day}</div>)}
                    {days.map((dayDate, idx) => {
                        if (!dayDate) return <div key={`empty-${idx}`} style={{ height: '32px' }} />;
                        
                        const isSelected = dayDate === date;
                        const isHol = holidays.some(h => h.date === dayDate);
                        const dayOfWeek = new Date(dayDate).getDay();
                        
                        const isScheduled = courseScheduleDays.has(dayOfWeek);
                        const hasAttendanceMarked = courseMarkedDates.has(dayDate);

                        return (
                            <div 
                                key={dayDate} 
                                style={{ 
                                    height: '32px', 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    fontSize: '0.8rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    fontWeight: isSelected ? 800 : 500,
                                    background: isSelected ? 'var(--accent-primary)' : isHol ? 'rgba(239, 68, 68, 0.1)' : isScheduled ? 'rgba(138, 148, 255, 0.1)' : 'transparent',
                                    color: isSelected ? 'white' : isHol ? 'var(--danger)' : isScheduled ? 'var(--accent-light)' : 'var(--text-primary)',
                                    border: isSelected ? 'none' : isScheduled ? '1px solid rgba(138, 148, 255, 0.3)' : 'none'
                                }} 
                                onClick={() => setDate(dayDate)}
                            >
                                {parseInt(dayDate.split('-')[2], 10)}
                                {hasAttendanceMarked && !isSelected && <div style={{ width: 4, height: 4, background: 'var(--success)', borderRadius: '50%', position: 'absolute', bottom: '2px' }} />}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (loading) return <div className="p-xl text-center">Loading context...</div>;

    return (
        <div className="page-container fade-in" style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
            {/* Sidebar Calendar & Filters */}
            <div className="sidebar-glass glass-morph" style={{ width: '380px', padding: '32px', borderRadius: '32px', position: 'sticky', top: '24px' }}>
                <div className="sidebar-header" style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                        <div style={{ background: 'var(--accent-bg)', color: 'var(--accent-light)', padding: '8px', borderRadius: '12px' }}>
                            <CalendarIcon size={20} /> 
                        </div>
                        Register Selection
                    </h2>
                </div>
                
                <div className="sidebar-content">
                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Subject / Laboratory</label>
                        <select 
                            className="input-field glass-morph" 
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none' }}
                            value={selectedCourseId} 
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                        >
                            <option value="">Select a Subject...</option>
                            {courses.map(c => (
                                <option key={c.id} value={c.id} style={{ background: 'var(--bg-dark)' }}>{c.title} ({c.code})</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '32px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Time Slot / Period</label>
                        <select 
                            className="input-field glass-morph" 
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none' }}
                            value={period} 
                            onChange={(e) => setPeriod(e.target.value)}
                            disabled={!selectedCourseId}
                        >
                            {PERIODS.map(p => (
                                <option key={p} value={p} style={{ background: 'var(--bg-dark)' }}>{p}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ pointerEvents: selectedCourseId ? 'auto' : 'none', opacity: selectedCourseId ? 1 : 0.5 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '16px', display: 'block' }}>Attendance Date</label>
                        {renderCalendar()}
                        <div className="cal-legend" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.7rem', marginTop: '24px', color: 'var(--text-muted)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-glow)', border: '1px solid var(--accent-primary)' }} /> Scheduled</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(239,68,68,0.2)', border: '1px solid var(--danger)' }} /> Holiday</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--success)' }} /> Attendance Marked</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="main-content-flow" style={{ flex: 1 }}>
                {!selectedCourseId ? (
                    <div className="empty-state glass-morph" style={{ height: '500px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ background: 'var(--surface-light)', padding: '24px', borderRadius: '50%', marginBottom: '24px' }}>
                            <BookOpen size={64} style={{ color: 'var(--accent-light)', opacity: 0.8 }} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px 0' }}>Attendance Registry</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Select a subject from the left sidebar to start tracking student presence.</p>
                    </div>
                ) : (
                    <>
                        <div className="card hero-card" style={{ marginBottom: '32px' }}>
                            <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.75rem' }}>{selectedCourse?.title} <span style={{ opacity: 0.6, fontWeight: 400 }}>({selectedCourse?.code})</span></h2>
                                    <p style={{ margin: '8px 0 0 0', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem', opacity: 0.9 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CalendarIcon size={16} /> {new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric'})}</span>
                                        <span style={{ opacity: 0.3 }}>|</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} /> {period} Slot</span>
                                    </p>
                                </div>
                                <div className="header-actions">
                                    <button className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }} onClick={handleSubmit} disabled={saving}>
                                        <Save size={18} /> {saving ? 'Recording...' : 'Finalize Attendance'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="tab-container glass-morph" style={{ marginBottom: '32px' }}>
                            <div className={`tab-item ${tab === 'mark' ? 'active' : ''}`} onClick={() => setTab('mark')}>
                                <Save size={16} /> Mark Attendance
                            </div>
                            <div className={`tab-item ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
                                <Filter size={16} /> Comprehensive Report
                            </div>
                        </div>

                        {tab === 'mark' && isHoliday && (
                            <div className="alert-banner" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '20px', borderRadius: '16px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '20px', color: 'var(--danger)' }}>
                                <Palmtree size={32} />
                                <div>
                                    <div style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Institutional Holiday</div>
                                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>You are marking attendance on a public holiday. Please ensure this is an intended extra session.</div>
                                </div>
                            </div>
                        )}

                        {tab === 'mark' ? (
                            <div className="table-wrapper glass-morph">
                                <div className="toolbar" style={{ padding: '0 0 24px 0', border: 'none', background: 'transparent' }}>
                                    <div className="toolbar-left">
                                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Candidate Roster</h3>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Default status for non-marks is <span style={{ color: 'var(--danger)', fontWeight: 700 }}>ABSENT</span></p>
                                    </div>
                                    <div className="toolbar-right">
                                        <div className="btn-group" style={{ background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px' }}>
                                            <button className="btn btn-secondary btn-sm" style={{ border: 'none' }} onClick={() => markAll('present')}>Presence (All)</button>
                                            <button className="btn btn-secondary btn-sm" style={{ border: 'none' }} onClick={() => markAll('absent')}>Absence (All)</button>
                                        </div>
                                    </div>
                                </div>

                                {students.length > 0 ? (
                                    <table style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ width: '40px' }}>#</th>
                                                <th>Student Identity</th>
                                                <th>Serial / Roll</th>
                                                <th style={{ textAlign: 'right' }}>Attendance Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.map((s, idx) => {
                                                const currentStatus = records[s.id] || 'absent';
                                                
                                                return (
                                                    <tr key={s.id} className="fade-in hover-row" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                        <td>{idx + 1}</td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--accent-light)', border: '1px solid var(--border-color)' }}>
                                                                    {s.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{s.name}</div>
                                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Undergraduate Student</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td><span className="badge badge-outline" style={{ fontWeight: 700, opacity: 0.8 }}>{s.rollNo}</span></td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                                                                {['present', 'absent', 'late', 'excused'].map(stat => (
                                                                    <button
                                                                        key={stat}
                                                                        onClick={() => toggleStatus(s.id, stat)}
                                                                        style={{
                                                                            padding: '6px 16px',
                                                                            borderRadius: '8px',
                                                                            fontSize: '0.75rem',
                                                                            fontWeight: 800,
                                                                            textTransform: 'uppercase',
                                                                            letterSpacing: '0.5px',
                                                                            cursor: 'pointer',
                                                                            border: 'none',
                                                                            transition: 'all 0.2s',
                                                                            background: currentStatus === stat 
                                                                                ? (stat === 'present' ? 'var(--success)' : stat === 'absent' ? 'var(--danger)' : stat === 'late' ? 'var(--warning)' : 'var(--accent-primary)')
                                                                                : 'transparent',
                                                                            color: currentStatus === stat ? 'white' : 'var(--text-muted)'
                                                                        }}
                                                                    >
                                                                        {stat}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="empty-state">
                                        <AlertCircle size={48} style={{ opacity: 0.3 }} />
                                        <h3>Roster is Empty</h3>
                                        <p>No students have been enrolled in this subject yet.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="table-wrapper glass-morph">
                                <div style={{ padding: '0 0 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Performance Metrics</h3>
                                    <span className="badge badge-primary">{students.length} Total Enrolled</span>
                                </div>
                                
                                {history.length > 0 ? (
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Student Candidate</th>
                                                <th>Sessions</th>
                                                <th>Present</th>
                                                <th>Absent</th>
                                                <th>Late</th>
                                                <th>Excused</th>
                                                <th style={{ textAlign: 'right' }}>Success Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {history.map(r => {
                                                const student = students.find(s => s.id === r.studentId);
                                                return (
                                                    <tr key={r.studentId} className="hover-row">
                                                        <td>
                                                            <div style={{ fontWeight: 800 }}>{student ? student.name : 'Unknown'}</div>
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{student?.rollNo || 'N/A'}</div>
                                                        </td>
                                                        <td>{r.total}</td>
                                                        <td style={{ color: 'var(--success)', fontWeight: 700 }}>{r.present}</td>
                                                        <td style={{ color: 'var(--danger)', fontWeight: 700 }}>{r.absent}</td>
                                                        <td style={{ color: 'var(--warning)', fontWeight: 700 }}>{r.late}</td>
                                                        <td style={{ color: 'var(--text-muted)' }}>{r.excused}</td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                                                                <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                                                    <div style={{ width: `${r.percentage}%`, height: '100%', background: r.percentage >= 75 ? 'var(--success)' : r.percentage >= 50 ? 'var(--warning)' : 'var(--danger)' }} />
                                                                </div>
                                                                <span style={{ fontWeight: 800, minWidth: '40px', color: r.percentage >= 75 ? 'var(--success)' : r.percentage >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                                                                    {r.percentage}%
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="empty-state">
                                        <Palmtree size={48} style={{ opacity: 0.3 }} />
                                        <h3>No Records Found</h3>
                                        <p>Attendance data has not been initialized for this subject yet.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
