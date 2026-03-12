import { useState, useEffect } from 'react';
import api from '../services/api';
import { Save, Calendar, Filter } from 'lucide-react';

export default function Attendance() {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState([]);
    const [records, setRecords] = useState({});
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [tab, setTab] = useState('mark'); // 'mark' | 'history'

    useEffect(() => {
        api.get('/courses').then(res => { setCourses(res.data); setLoading(false); }).catch(console.error);
    }, []);

    useEffect(() => {
        if (!selectedCourse) return;
        // Load roster for the course
        api.get(`/courses/${selectedCourse}/roster`)
            .then(res => {
                setStudents(res.data);
                // Load existing attendance for this date+course
                return api.get('/attendance', { params: { courseId: selectedCourse, date } });
            })
            .then(res => {
                const rec = {};
                res.data.forEach(a => { rec[a.studentId] = a.status; });
                setRecords(rec);
            })
            .catch(console.error);
    }, [selectedCourse, date]);

    useEffect(() => {
        if (tab === 'history' && selectedCourse) {
            api.get('/attendance/report', { params: { courseId: selectedCourse } })
                .then(res => setHistory(res.data))
                .catch(console.error);
        }
    }, [tab, selectedCourse]);

    const toggleStatus = (studentId, status) => {
        setRecords(prev => ({ ...prev, [studentId]: prev[studentId] === status ? 'present' : status }));
    };

    const markAll = (status) => {
        const rec = {};
        students.forEach(s => { rec[s.id] = status; });
        setRecords(rec);
    };

    const handleSubmit = async () => {
        if (!selectedCourse || students.length === 0) return;
        setSaving(true);
        try {
            const attendanceRecords = students.map(s => ({
                studentId: s.id,
                status: records[s.id] || 'present',
            }));
            await api.post('/attendance', { courseId: parseInt(selectedCourse), date, records: attendanceRecords });
            alert('Attendance saved!');
        } catch (err) {
            alert(err.response?.data?.error || 'Error saving attendance');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div className="fade-in">
            {/* Controls */}
            <div className="toolbar">
                <div className="toolbar-left" style={{ gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                        <select className="form-control" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} style={{ minWidth: '240px' }}>
                            <option value="">Select Subject...</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                        <input className="form-control" type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                </div>
                <div className="toolbar-right">
                    <button className={`btn ${tab === 'mark' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('mark')}>
                        <Calendar size={16} /> Mark Attendance
                    </button>
                    <button className={`btn ${tab === 'history' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('history')}>
                        <Filter size={16} /> Report
                    </button>
                </div>
            </div>

            {!selectedCourse && (
                <div className="empty-state"><p>Select a subject to begin</p></div>
            )}

            {/* Mark Attendance Tab */}
            {selectedCourse && tab === 'mark' && (
                <div className="card">
                    <div className="card-header">
                        <h3>Attendance — {date}</h3>
                        <div className="btn-group">
                            <button className="btn btn-success btn-sm" onClick={() => markAll('present')}>All Present</button>
                            <button className="btn btn-danger btn-sm" onClick={() => markAll('absent')}>All Absent</button>
                            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                                <Save size={16} /> {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>

                    {students.length > 0 ? (
                        <div className="attendance-grid">
                            {students.map(s => (
                                <div className="attendance-row" key={s.id}>
                                    <div className="student-info">
                                        <div className="student-name">{s.name}</div>
                                        <div className="student-roll">{s.rollNo}</div>
                                    </div>
                                    <div className="attendance-toggle">
                                        <button
                                            className={records[s.id] === 'present' || !records[s.id] ? 'present' : ''}
                                            onClick={() => toggleStatus(s.id, 'present')}
                                        >Present</button>
                                        <button
                                            className={records[s.id] === 'absent' ? 'absent' : ''}
                                            onClick={() => toggleStatus(s.id, 'absent')}
                                        >Absent</button>
                                        <button
                                            className={records[s.id] === 'late' ? 'late' : ''}
                                            onClick={() => toggleStatus(s.id, 'late')}
                                        >Late</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state"><p>No students enrolled in this subject</p></div>
                    )}
                </div>
            )}

            {/* Report Tab */}
            {selectedCourse && tab === 'history' && (
                <div className="card">
                    <div className="card-header">
                        <h3>Attendance Report</h3>
                    </div>
                    {history.length > 0 ? (
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Student ID</th>
                                        <th>Total Classes</th>
                                        <th>Present</th>
                                        <th>Absent</th>
                                        <th>Late</th>
                                        <th>Attendance %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(r => (
                                        <tr key={r.studentId}>
                                            <td style={{ fontWeight: 600 }}>#{r.studentId}</td>
                                            <td>{r.total}</td>
                                            <td style={{ color: 'var(--success)' }}>{r.present}</td>
                                            <td style={{ color: 'var(--danger)' }}>{r.absent}</td>
                                            <td style={{ color: 'var(--warning)' }}>{r.late}</td>
                                            <td>
                                                <span className={`badge ${r.percentage >= 75 ? 'badge-success' : r.percentage >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                                                    {r.percentage}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state"><p>No attendance data available</p></div>
                    )}
                </div>
            )}
        </div>
    );
}
