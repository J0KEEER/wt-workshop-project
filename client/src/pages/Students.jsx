import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, Search, AlertTriangle, BookOpen } from 'lucide-react';
import { ModalOverlay, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';

export default function Students() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ rollNo: '', name: '', email: '', semester: 1, department: '', phone: '', dob: '', guardianName: '' });
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [courses, setCourses] = useState([]);
    const [selectedCourses, setSelectedCourses] = useState([]);

    const fetchData = () => {
        setLoading(true);
        // Vercel async-parallel rule: fetch independent queries simultaneously
        Promise.allSettled([
            api.get('/students', { params: search ? { search } : {} }),
            api.get('/courses')
        ])
        .then(([studentsRes, coursesRes]) => {
            if (studentsRes.status === 'fulfilled') setStudents(studentsRes.value.data);
            if (coursesRes.status === 'fulfilled') setCourses(coursesRes.value.data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    const fetchStudentsOnly = () => {
        api.get('/students', { params: search ? { search } : {} })
            .then(res => setStudents(res.data))
            .catch(console.error);
    }

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const openCreate = () => {
        setEditing(null);
        setForm({ rollNo: '', name: '', email: '', semester: 1, department: '', phone: '', dob: '', guardianName: '' });
        setSelectedCourses([]);
        setModalOpen(true);
    };

    const openEdit = (s) => {
        setEditing(s);
        setForm({ rollNo: s.rollNo, name: s.name, email: s.email, semester: s.semester, department: s.department, phone: s.phone || '', dob: s.dob || '', guardianName: s.guardianName || '' });
        setSelectedCourses(s.courses?.map(c => c.id) || []);
        setModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            let student;
            if (editing) {
                await api.put(`/students/${editing.id}`, form);
                student = editing;
            } else {
                const res = await api.post('/students', form);
                student = res.data;
            }
            // Enroll in selected courses
            if (selectedCourses.length > 0 && student?.id) {
                const existingIds = editing ? (editing.courses?.map(c => c.id) || []) : [];
                const newCourses = selectedCourses.filter(id => !existingIds.includes(id));
                await Promise.allSettled(
                    newCourses.map(courseId => api.post(`/students/${student.id}/enroll`, { courseId }))
                );
            }
            setModalOpen(false);
            fetchStudentsOnly();
        } catch (err) {
            alert(err.response?.data?.error || 'Error saving');
        }
    };

    const toggleCourse = (courseId) => {
        setSelectedCourses(prev =>
            prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
        );
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/students/${deleteTarget.id}`);
            fetchStudentsOnly();
        } catch (err) {
            alert(err.response?.data?.error || 'Error deleting');
        } finally {
            setDeleteTarget(null);
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div className="fade-in">
            <div className="toolbar">
                <div className="toolbar-left">
                    <div className="search-box">
                        <Search size={16} />
                        <input className="form-control" placeholder="Search students…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search students" />
                    </div>
                </div>
                <div className="toolbar-right">
                    <button className="btn btn-primary" onClick={openCreate} id="add-student-btn"><Plus size={16} /> Add Student</button>
                </div>
            </div>

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Roll No</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Department</th>
                            <th>semester</th>
                            <th>Status</th>
                            <th>Subjects</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(s => (
                            <tr key={s.id}>
                                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.rollNo}</td>
                                <td>{s.name}</td>
                                <td>{s.email}</td>
                                <td>{s.department}</td>
                                <td>{s.semester}</td>
                                <td><span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{s.status}</span></td>
                                <td>{s.courses?.length || 0}</td>
                                <td>
                                    <div className="btn-group">
                                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)} aria-label={`Edit ${s.name}`}><Edit2 size={14} /></button>
                                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(s)} aria-label={`Delete ${s.name}`}><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {students.length === 0 && (
                            <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No students found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <ModalOverlay isOpen={modalOpen} onClose={() => setModalOpen(false)}>
                <ModalHeader title={editing ? 'Edit Student' : 'Add Student'} onClose={() => setModalOpen(false)} />
                <form onSubmit={handleSave}>
                    <ModalBody>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Roll Number</label>
                                <input className="form-control" value={form.rollNo} onChange={e => setForm({ ...form, rollNo: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Email</label>
                                <input className="form-control" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Department</label>
                                <select className="form-control" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} required>
                                    <option value="">Select...</option>
                                    <option value="Computer Science">Computer Science</option>
                                    <option value="Mathematics">Mathematics</option>
                                    <option value="Physics">Physics</option>
                                    <option value="Chemistry">Chemistry</option>
                                    <option value="English">English</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Semester</label>
                                <select className="form-control" value={form.semester} onChange={e => setForm({ ...form, semester: parseInt(e.target.value) })}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Date of Birth</label>
                                <input className="form-control" type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Guardian Name</label>
                                <input className="form-control" value={form.guardianName} onChange={e => setForm({ ...form, guardianName: e.target.value })} />
                            </div>
                        </div>
                        {/* Course Selection */}
                        <div className="form-group" style={{ marginTop: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                <BookOpen size={14} /> Enroll in Subjects
                            </label>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                gap: '6px',
                                maxHeight: '180px',
                                overflowY: 'auto',
                                padding: '8px',
                                background: 'var(--bg-input)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-color)',
                            }}>
                                {courses.length === 0 && (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', gridColumn: '1 / -1', textAlign: 'center', padding: '8px 0' }}>No subjects available</p>
                                )}
                                {courses.map(c => (
                                    <label key={c.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '6px 10px',
                                        borderRadius: 'var(--radius-sm)',
                                        cursor: 'pointer',
                                        background: selectedCourses.includes(c.id) ? 'var(--accent-glow)' : 'transparent',
                                        border: selectedCourses.includes(c.id) ? '1px solid var(--accent)' : '1px solid transparent',
                                        fontSize: '0.85rem',
                                        transition: 'all 0.15s ease',
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedCourses.includes(c.id)}
                                            onChange={() => toggleCourse(c.id)}
                                            style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }}
                                        />
                                        <span style={{ fontWeight: 600, color: 'var(--accent-light)' }}>{c.code}</span>
                                        <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                                    </label>
                                ))}
                            </div>
                            {selectedCourses.length > 0 && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
                                    {selectedCourses.length} subject{selectedCourses.length !== 1 ? 's' : ''} selected
                                </p>
                            )}
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
                    </ModalFooter>
                </form>
            </ModalOverlay>

            {/* Delete Confirmation Modal */}
            <ModalOverlay isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
                <ModalHeader title="Confirm Deletion" icon={AlertTriangle} onClose={() => setDeleteTarget(null)} />
                <ModalBody>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget?.name}</strong> ({deleteTarget?.rollNo})?  This action cannot be undone.
                    </p>
                </ModalBody>
                <ModalFooter>
                    <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                    <button className="btn btn-danger" onClick={confirmDelete}>
                        <Trash2 size={14} /> Delete Student
                    </button>
                </ModalFooter>
            </ModalOverlay>
        </div>
    );
}
