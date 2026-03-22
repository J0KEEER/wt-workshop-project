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
    const [form, setForm] = useState({ code: '', title: '', credits: 3, semester: 1, department: '', departmentId: '', capacity: 60, facultyIds: [] });
    const [departments, setDepartments] = useState([]);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'title', direction: 'asc' });

    const fetchData = () => {
        setLoading(true);
        Promise.allSettled([
            api.get('/courses', { params: search ? { search } : {} }),
            api.get('/faculty'),
            api.get('/departments')
        ])
        .then(([coursesRes, facultyRes, departmentsRes]) => {
            if (coursesRes.status === 'fulfilled') setCourses(coursesRes.value.data);
            if (facultyRes.status === 'fulfilled') setFaculty(facultyRes.value.data);
            if (departmentsRes.status === 'fulfilled') setDepartments(departmentsRes.value.data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    const fetchCoursesOnly = () => {
        setLoading(true);
        api.get('/courses', { params: search ? { search } : {} })
            .then(res => setCourses(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedCourses = [...courses].sort((a, b) => {
        const valA = a[sortConfig.key] || '';
        const valB = b[sortConfig.key] || '';
        if (typeof valA === 'string') {
            return sortConfig.direction === 'asc' 
                ? valA.localeCompare(valB)
                : valB.localeCompare(valA);
        }
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
    });

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Load everything on mount

    // Debounce search to prevent UI unmounting/flickering
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCoursesOnly(); // Call the specific fetch function for this component
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const openCreate = () => {
        setEditing(null);
        setForm({ code: '', title: '', credits: 3, semester: 1, department: '', departmentId: '', capacity: 60, facultyIds: [] });
        setModalOpen(true);
    };

    const openEdit = (c) => {
        setEditing(c);
        setForm({ 
            code: c.code, 
            title: c.title, 
            credits: c.credits, 
            semester: c.semester, 
            department: c.department, 
            departmentId: c.departmentId || '', 
            capacity: c.capacity, 
            facultyIds: c.faculties ? c.faculties.map(f => f.id) : []
        });
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
            const data = { ...form, facultyIds: form.facultyIds.map(id => parseInt(id)) };
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

    // Removed top-level loading check

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
            </div>            <div className="table-wrapper" style={{ position: 'relative', minHeight: '200px' }}>
                {loading && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(10, 14, 26, 0.7)', backdropFilter: 'blur(2px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
                    }}>
                        <div className="spinner"></div>
                    </div>
                )}
                <table>
                    <thead>
                        <tr>
                            <th onClick={() => requestSort('code')} style={{ cursor: 'pointer' }}>Code {sortConfig.key === 'code' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th onClick={() => requestSort('title')} style={{ cursor: 'pointer' }}>Title {sortConfig.key === 'title' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th onClick={() => requestSort('department')} style={{ cursor: 'pointer' }}>Department {sortConfig.key === 'department' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th onClick={() => requestSort('credits')} style={{ cursor: 'pointer' }}>Credits {sortConfig.key === 'credits' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th onClick={() => requestSort('semester')} style={{ cursor: 'pointer' }}>Semester {sortConfig.key === 'semester' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th>Faculty</th>
                            <th onClick={() => requestSort('capacity')} style={{ cursor: 'pointer' }}>Capacity {sortConfig.key === 'capacity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedCourses.map(c => (
                            <tr key={c.id}>
                                <td style={{ fontWeight: 600, color: 'var(--accent-light)' }}>{c.code}</td>
                                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.title}</td>
                                <td>{c.department}</td>
                                <td>{c.credits}</td>
                                <td>Semester {c.semester}</td>
                                <td>
                                    {c.faculties && c.faculties.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            {c.faculties.map(f => (
                                                <span key={f.id} style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>• {f.name}</span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>
                                    )}
                                </td>
                                <td>{c.capacity}</td>
                                <td>
                                    <div className="btn-group">
                                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)} aria-label={`Edit ${c.title}`}><Edit2 size={14} /></button>
                                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(c)} aria-label={`Delete ${c.title}`}><Trash2 size={14} /></button>
                                        <button className="btn btn-success btn-sm" onClick={() => viewRoster(c.id)} title="View Students"><Users size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {sortedCourses.length === 0 && !loading && (
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
                                <select 
                                    className="form-control" 
                                    value={form.departmentId} 
                                    onChange={e => {
                                        const dept = departments.find(d => d.id === parseInt(e.target.value));
                                        setForm({ ...form, departmentId: dept ? dept.id : '', department: dept ? dept.name : '' });
                                    }} 
                                    required
                                >
                                    <option value="">Select...</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    Assigned Faculty
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{form.facultyIds.length} Selected</span>
                                </label>
                                <div style={{ 
                                    background: 'var(--bg-input)', 
                                    border: '1px solid var(--border-color-strong)', 
                                    borderRadius: 'var(--radius-md)',
                                    maxHeight: '150px',
                                    overflowY: 'auto',
                                    padding: '8px'
                                }}>
                                    {faculty.map(f => (
                                        <label key={f.id} style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '8px', 
                                            padding: '4px 8px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid var(--border-color-subtle)',
                                            fontSize: '0.85rem',
                                            textTransform: 'none',
                                            fontWeight: 400
                                        }}>
                                            <input 
                                                type="checkbox" 
                                                checked={form.facultyIds.includes(f.id)} 
                                                onChange={e => {
                                                    const newIds = e.target.checked 
                                                        ? [...form.facultyIds, f.id]
                                                        : form.facultyIds.filter(id => id !== f.id);
                                                    setForm({ ...form, facultyIds: newIds });
                                                }}
                                            />
                                            {f.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({f.department})</span>
                                        </label>
                                    ))}
                                    {faculty.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>No faculty available</p>}
                                </div>
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
