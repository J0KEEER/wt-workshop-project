import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, Search, X, FileText, AlertTriangle, BarChart2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { ModalOverlay, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';

export default function Exams() {
    const navigate = useNavigate();
    const toast = useToast();
    const [exams, setExams] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [gradesOpen, setGradesOpen] = useState(null);
    const [results, setResults] = useState([]);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ courseId: '', title: '', type: 'midterm', date: '', totalMarks: 100 });
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [gradingOpen, setGradingOpen] = useState(null);
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [tempResults, setTempResults] = useState({});

    const fetchExams = () => {
        api.get('/exams')
            .then(res => setExams(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        api.get('/courses').then(res => setCourses(res.data)).catch(() => { });
        fetchExams();
    }, []);

    const openCreate = () => {
        setEditing(null);
        setForm({ courseId: '', title: '', type: 'midterm', date: '', totalMarks: 100 });
        setModalOpen(true);
    };

    const openEdit = (exam) => {
        setEditing(exam);
        setForm({ courseId: exam.courseId, title: exam.title, type: exam.type, date: exam.date, totalMarks: exam.totalMarks });
        setModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const data = { ...form, courseId: parseInt(form.courseId), totalMarks: parseInt(form.totalMarks) };
            if (editing) {
                await api.put(`/exams/${editing.id}`, data);
            } else {
                await api.post('/exams', data);
            }
            setModalOpen(false);
            toast.success(editing ? 'Exam updated successfully' : 'Exam scheduled successfully');
            fetchExams();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error saving');
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/exams/${deleteTarget.id}`);
            toast.success('Exam deleted successfully');
            fetchExams();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error deleting');
        } finally {
            setDeleteTarget(null);
        }
    };

    const viewResults = async (examId) => {
        try {
            const res = await api.get(`/exams/${examId}/results`);
            setResults(res.data);
            setGradesOpen(examId);
        } catch (err) {
            toast.error('Error loading results');
        }
    };

    const openGrading = async (exam) => {
        try {
            const [enrollRes, resultsRes] = await Promise.all([
                api.get(`/exams/${exam.id}/enrollment`),
                api.get(`/exams/${exam.id}/results`)
            ]);
            setEnrolledStudents(enrollRes.data);
            
            // Pre-fill existing results
            const existing = {};
            resultsRes.data.forEach(r => {
                existing[r.studentId] = { marks: r.marksObtained, remarks: r.remarks || '' };
            });
            setTempResults(existing);
            setGradingOpen(exam);
        } catch (err) {
            toast.error('Error loading enrollment');
        }
    };

    const handleGradeSave = async () => {
        try {
            const resultsPayload = Object.entries(tempResults).map(([studentId, data]) => ({
                studentId: parseInt(studentId),
                marksObtained: parseFloat(data.marks),
                remarks: data.remarks
            }));
            
            await api.post(`/exams/${gradingOpen.id}/results`, { results: resultsPayload });
            toast.success('Grades submitted successfully');
            setGradingOpen(null);
            fetchExams();
        } catch (err) {
            toast.error('Error saving grades');
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div className="fade-in">
            <div className="toolbar">
                <div className="toolbar-left">
                    <div className="search-box">
                        <Search size={16} />
                        <input className="form-control" placeholder="Search exams by title or course..." aria-label="Search exams" />
                    </div>
                </div>
                <div className="toolbar-right">
                    <span className="badge badge-outline">{exams.length} Active Exams</span>
                </div>
            </div>

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Subject</th>
                            <th>Type</th>
                            <th>Date</th>
                            <th>Marks</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {exams.map(exam => (
                            <tr key={exam.id} className="fade-in">
                                <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{exam.title}</td>
                                <td><span style={{ fontWeight: 600, color: 'var(--accent-light)' }}>{exam.course?.code}</span> — {exam.course?.title}</td>
                                <td><span className={`badge ${exam.type === 'final' ? 'badge-danger' : exam.type === 'midterm' ? 'badge-warning' : 'badge-primary'}`}>{exam.type}</span></td>
                                <td>{exam.date}</td>
                                <td style={{ fontWeight: 600 }}>{exam.totalMarks}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <div className="btn-group">
                                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/exams/${exam.id}/analytics`)} title="Performance Analytics"><BarChart2 size={14} /></button>
                                        <button className="btn btn-secondary btn-sm" onClick={() => viewResults(exam.id)} title="View Results"><FileText size={14} /></button>
                                        <button className="btn btn-primary btn-sm" onClick={() => openGrading(exam)} title="Grade Students"><Plus size={14} /></button>
                                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(exam)}><Edit2 size={14} /></button>
                                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(exam)}><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {exams.length === 0 && (
                    <div className="empty-state" style={{ border: 'none', background: 'transparent' }}>
                        <FileText size={48} />
                        <h3>No exams scheduled</h3>
                        <p>Get started by scheduling an upcoming examination for your courses.</p>
                    </div>
                )}
            </div>

            {/* Results Modal */}
            <ModalOverlay isOpen={!!gradesOpen} onClose={() => setGradesOpen(null)}>
                <ModalHeader title="Exam Results" onClose={() => setGradesOpen(null)} />
                <ModalBody>
                    {results.length > 0 ? (
                        <div className="table-wrapper">
                            <table>
                                <thead><tr><th>Roll No</th><th>Name</th><th>Marks</th><th>Grade</th></tr></thead>
                                <tbody>
                                    {results.map(r => (
                                        <tr key={r.id}>
                                            <td style={{ fontWeight: 600 }}>{r.student?.rollNo}</td>
                                            <td>{r.student?.name}</td>
                                            <td>{r.marksObtained}</td>
                                            <td><span className={`badge ${r.grade === 'F' ? 'badge-danger' : r.grade?.startsWith('A') ? 'badge-success' : 'badge-info'}`}>{r.grade}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state"><p>No results submitted yet</p></div>
                    )}
                </ModalBody>
            </ModalOverlay>

            {/* Create/Edit Modal */}
            <ModalOverlay isOpen={modalOpen} onClose={() => setModalOpen(false)}>
                <ModalHeader title={editing ? 'Edit Exam' : 'Schedule Exam'} onClose={() => setModalOpen(false)} />
                <form onSubmit={handleSave}>
                    <ModalBody>
                        <div className="form-group">
                            <label>Exam Title</label>
                            <input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="e.g. CS101 Midterm" />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Course</label>
                                <select className="form-control" value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })} required>
                                    <option value="">Select...</option>
                                    {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Type</label>
                                <select className="form-control" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                    <option value="midterm">Midterm</option>
                                    <option value="final">Final</option>
                                    <option value="quiz">Quiz</option>
                                    <option value="assignment">Assignment</option>
                                    <option value="practical">Practical</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Date</label>
                                <input className="form-control" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Total Marks</label>
                                <input className="form-control" type="number" min={1} value={form.totalMarks} onChange={e => setForm({ ...form, totalMarks: e.target.value })} required />
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Schedule'}</button>
                    </ModalFooter>
                </form>
            </ModalOverlay>

            {/* Delete Confirmation Modal */}
            <ModalOverlay isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
                <ModalHeader title="Confirm Deletion" icon={AlertTriangle} onClose={() => setDeleteTarget(null)} />
                <ModalBody>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget?.title}</strong>? This action cannot be undone.
                    </p>
                </ModalBody>
                <ModalFooter>
                    <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                    <button className="btn btn-danger" onClick={confirmDelete}>
                        <Trash2 size={14} /> Delete Exam
                    </button>
                </ModalFooter>
            </ModalOverlay>
            {/* Grading Modal */}
            <ModalOverlay isOpen={!!gradingOpen} onClose={() => setGradingOpen(null)}>
                <ModalHeader title={`Student Grading: ${gradingOpen?.title}`} onClose={() => setGradingOpen(null)} />
                <ModalBody>
                    <div className="" style={{ marginBottom: '24px', padding: '16px', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Subject</div>
                            <div style={{ fontWeight: 700 }}>{gradingOpen?.course?.title} ({gradingOpen?.course?.code})</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Marks</div>
                            <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--accent-light)' }}>{gradingOpen?.totalMarks}</div>
                        </div>
                    </div>

                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Roll No</th>
                                    <th style={{ width: '120px' }}>Marks obtained</th>
                                    <th>Feedback / Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrolledStudents.map(s => (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                                        <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{s.rollNo}</td>
                                        <td>
                                            <input 
                                                type="number" 
                                                className="form-control" 
                                                style={{ border: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}
                                                value={tempResults[s.id]?.marks || ''} 
                                                max={gradingOpen?.totalMarks}
                                                onChange={e => setTempResults({...tempResults, [s.id]: {...(tempResults[s.id] || {}), marks: e.target.value}})}
                                                placeholder="0"
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                value={tempResults[s.id]?.remarks || ''} 
                                                onChange={e => setTempResults({...tempResults, [s.id]: {...(tempResults[s.id] || {}), remarks: e.target.value}})}
                                                placeholder="Enter observations..."
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {enrolledStudents.length === 0 && (
                            <div className="empty-state">
                                <Search size={32} />
                                <h3>No Students Enrolled</h3>
                                <p>There are no students currently enrolled in this course to grade.</p>
                            </div>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <button className="btn btn-secondary" onClick={() => setGradingOpen(null)}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleGradeSave} disabled={enrolledStudents.length === 0}>
                        <CheckCircle size={16} /> Submit All Grades
                    </button>
                </ModalFooter>
            </ModalOverlay>
        </div>
    );
}
