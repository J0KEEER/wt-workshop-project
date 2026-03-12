import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, Search, Users, AlertTriangle } from 'lucide-react';
import { ModalOverlay, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';

export default function Courses() {
    const [courses, setCourses] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [rosterOpen, setRosterOpen] = useState(null);
    const [roster, setRoster] = useState([]);
    const [form, setForm] = useState({ code: '', title: '', credits: 3, semester: 1, department: '', capacity: 60, facultyId: '' });
    const [deleteTarget, setDeleteTarget] = useState(null);

    const fetchData = () => {
        setLoading(true);
        Promise.allSettled([
            api.get('/courses', { params: search ? { search } : {} }),
            api.get('/faculty')
        ])
        .then(([coursesRes, facultyRes]) => {
            if (coursesRes.status === 'fulfilled') setCourses(coursesRes.value.data);
            if (facultyRes.status === 'fulfilled') setFaculty(facultyRes.value.data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    const fetchCoursesOnly = () => {
        api.get('/courses', { params: search ? { search } : {} })
            .then(res => setCourses(res.data))
            .catch(console.error);
    }

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const openCreate = () => {
        setEditing(null);
        setForm({ code: '', title: '', credits: 3, semester: 1, department: '', capacity: 60, facultyId: '' });
        setModalOpen(true);
    };

    const openEdit = (c) => {
        setEditing(c);
        setForm({ code: c.code, title: c.title, credits: c.credits, semester: c.semester, department: c.department, capacity: c.capacity, facultyId: c.facultyId || '' });
        setModalOpen(true);
    };

    const viewRoster = async (courseId) => {
        try {
            const res = await api.get(`/courses/${courseId}/roster`);
            setRoster(res.data);
            setRosterOpen(courseId);
        } catch (err) {
            alert('Error loading roster');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const data = { ...form, facultyId: form.facultyId ? parseInt(form.facultyId) : null };
            if (editing) {
                await api.put(`/courses/${editing.id}`, data);
            } else {
                await api.post('/courses', data);
            }
            setModalOpen(false);
            fetchCoursesOnly();
        } catch (err) {
            alert(err.response?.data?.error || 'Error saving');
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/courses/${deleteTarget.id}`);
            fetchCoursesOnly();
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
                        <input className="form-control" placeholder="Search subjects…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search subjects" />
                    </div>
                </div>
                <div className="toolbar-right">
                    <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Subject</button>
                </div>
            </div>

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Title</th>
                            <th>Department</th>
                            <th>Credits</th>
                            <th>Semester</th>
                            <th>Faculty</th>
                            <th>Capacity</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses.map(c => (
                            <tr key={c.id}>
                                <td style={{ fontWeight: 600, color: 'var(--accent-light)' }}>{c.code}</td>
                                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.title}</td>
                                <td>{c.department}</td>
                                <td>{c.credits}</td>
                                <td>{c.semester}</td>
                                <td>{c.faculty?.name || '—'}</td>
                                <td>{c.capacity}</td>
                                <td>
                                    <div className="btn-group">
                                        <button className="btn btn-secondary btn-sm" onClick={() => viewRoster(c.id)} title="View Roster" aria-label={`View roster for ${c.title}`}><Users size={14} /></button>
                                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)} aria-label={`Edit ${c.title}`}><Edit2 size={14} /></button>
                                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(c)} aria-label={`Delete ${c.title}`}><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {courses.length === 0 && (
                            <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No subjects found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Roster Modal */}
            <ModalOverlay isOpen={!!rosterOpen} onClose={() => setRosterOpen(null)}>
                <ModalHeader title="Enrolled Students" onClose={() => setRosterOpen(null)} />
                <ModalBody>
                    {roster.length > 0 ? (
                        <div className="table-wrapper">
                            <table>
                                <thead><tr><th>Roll No</th><th>Name</th><th>Email</th></tr></thead>
                                <tbody>
                                    {roster.map(s => (
                                        <tr key={s.id}>
                                            <td style={{ fontWeight: 600 }}>{s.rollNo}</td>
                                            <td>{s.name}</td>
                                            <td>{s.email}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state"><p>No students enrolled</p></div>
                    )}
                </ModalBody>
            </ModalOverlay>

            {/* Create/Edit Modal */}
            <ModalOverlay isOpen={modalOpen} onClose={() => setModalOpen(false)}>
                <ModalHeader title={editing ? 'Edit Subject' : 'Add Subject'} onClose={() => setModalOpen(false)} />
                <form onSubmit={handleSave}>
                    <ModalBody>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Subject Code</label>
                                <input className="form-control" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required placeholder="e.g. CS301" />
                            </div>
                            <div className="form-group">
                                <label>Title</label>
                                <input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
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
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Assigned Faculty</label>
                                <select className="form-control" value={form.facultyId} onChange={e => setForm({ ...form, facultyId: e.target.value })}>
                                    <option value="">None</option>
                                    {faculty.map(f => <option key={f.id} value={f.id}>{f.name} ({f.department})</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Credits</label>
                                <input className="form-control" type="number" min={1} max={6} value={form.credits} onChange={e => setForm({ ...form, credits: parseInt(e.target.value) })} />
                            </div>
                            <div className="form-group">
                                <label>Semester</label>
                                <select className="form-control" value={form.semester} onChange={e => setForm({ ...form, semester: parseInt(e.target.value) })}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Capacity</label>
                            <input className="form-control" type="number" min={1} value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) })} />
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
                        Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget?.title}</strong> ({deleteTarget?.code})? This action cannot be undone.
                    </p>
                </ModalBody>
                <ModalFooter>
                    <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                    <button className="btn btn-danger" onClick={confirmDelete}>
                        <Trash2 size={14} /> Delete Subject
                    </button>
                </ModalFooter>
            </ModalOverlay>
        </div>
    );
}
