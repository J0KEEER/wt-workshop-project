import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, Search, X, FileText, AlertTriangle } from 'lucide-react';

export default function Exams() {
    const [exams, setExams] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [gradesOpen, setGradesOpen] = useState(null);
    const [results, setResults] = useState([]);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ courseId: '', title: '', type: 'midterm', date: '', totalMarks: 100 });
    const [deleteTarget, setDeleteTarget] = useState(null);

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
            fetchExams();
        } catch (err) {
            alert(err.response?.data?.error || 'Error saving');
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/exams/${deleteTarget.id}`);
            fetchExams();
        } catch (err) {
            alert(err.response?.data?.error || 'Error deleting');
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
            alert('Error loading results');
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div className="fade-in">
            <div className="toolbar">
                <div className="toolbar-left">
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{exams.length} exams scheduled</h3>
                </div>
                <div className="toolbar-right">
                    <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Schedule Exam</button>
                </div>
            </div>

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Course</th>
                            <th>Type</th>
                            <th>Date</th>
                            <th>Total Marks</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {exams.map(exam => (
                            <tr key={exam.id}>
                                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{exam.title}</td>
                                <td>{exam.course?.code} — {exam.course?.title}</td>
                                <td><span className={`badge ${exam.type === 'final' ? 'badge-danger' : exam.type === 'midterm' ? 'badge-warning' : 'badge-info'}`}>{exam.type}</span></td>
                                <td>{exam.date}</td>
                                <td>{exam.totalMarks}</td>
                                <td>
                                    <div className="btn-group">
                                        <button className="btn btn-secondary btn-sm" onClick={() => viewResults(exam.id)} title="View Results" aria-label={`View results for ${exam.title}`}><FileText size={14} /></button>
                                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(exam)} aria-label={`Edit ${exam.title}`}><Edit2 size={14} /></button>
                                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(exam)} aria-label={`Delete ${exam.title}`}><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {exams.length === 0 && (
                            <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No exams scheduled</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Results Modal */}
            {gradesOpen && (
                <div className="modal-overlay" onClick={() => setGradesOpen(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
                        <div className="modal-header">
                            <h3>Exam Results</h3>
                            <button className="modal-close" onClick={() => setGradesOpen(null)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
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
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editing ? 'Edit Exam' : 'Schedule Exam'}</h3>
                            <button className="modal-close" onClick={() => setModalOpen(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
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
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Schedule'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
                        <div className="modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertTriangle size={20} style={{ color: 'var(--danger)' }} />
                                Confirm Deletion
                            </h3>
                            <button className="modal-close" onClick={() => setDeleteTarget(null)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.title}</strong>? This action cannot be undone.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={confirmDelete}>
                                <Trash2 size={14} /> Delete Exam
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
