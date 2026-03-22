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
    const [form, setForm] = useState({ rollNo: '', name: '', email: '', semester: 1, department: '', departmentId: '', phone: '', dob: '', guardianName: '' });
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [courses, setCourses] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [selectedCourses, setSelectedCourses] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    const fetchData = () => {
        setLoading(true);
        // Vercel async-parallel rule: fetch independent queries simultaneously
        Promise.allSettled([
            api.get('/students', { params: search ? { search } : {} }),
            api.get('/courses'),
            api.get('/departments')
        ])
        .then(([studentsRes, coursesRes, departmentsRes]) => {
            if (studentsRes.status === 'fulfilled') setStudents(studentsRes.value.data);
            if (coursesRes.status === 'fulfilled') setCourses(coursesRes.value.data);
            if (departmentsRes.status === 'fulfilled') setDepartments(departmentsRes.value.data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    const fetchStudentsOnly = () => {
        setLoading(true);
        api.get('/students', { params: search ? { search } : {} })
            .then(res => setStudents(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStudentsOnly();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const openCreate = () => {
        setEditing(null);
        setForm({ rollNo: '', name: '', email: '', semester: 1, department: '', departmentId: '', phone: '', dob: '', guardianName: '' });
        setSelectedCourses([]);
        setModalOpen(true);
    };

    const openEdit = (s) => {
        setEditing(s);
        setForm({ 
            rollNo: s.rollNo, 
            name: s.name, 
            email: s.email, 
            semester: s.semester, 
            department: s.department, 
            departmentId: s.departmentId || '', 
            phone: s.phone || '', 
            dob: s.dob || '', 
            guardianName: s.guardianName || '' 
        });
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

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedCourses(courses.map(c => c.id));
        } else {
            setSelectedCourses([]);
        }
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedStudents = [...students].sort((a, b) => {
        const valA = a[sortConfig.key] || '';
        const valB = b[sortConfig.key] || '';
        if (typeof valA === 'string') {
            return sortConfig.direction === 'asc' 
                ? valA.localeCompare(valB)
                : valB.localeCompare(valA);
        }
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
    });

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

    // Removed top-level loading check to prevent unmounting toolbar

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

            <div className="table-wrapper" style={{ position: 'relative', minHeight: '200px' }}>
                {loading && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(var(--bg-rgb), 0.7)', backdropFilter: 'blur(2px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
                    }}>
                        <div className="spinner"></div>
                    </div>
                )}
                <table>
                    <thead>
                        <tr>
                            <th onClick={() => requestSort('rollNo')} style={{ cursor: 'pointer' }}>Roll No {sortConfig.key === 'rollNo' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th onClick={() => requestSort('name')} style={{ cursor: 'pointer' }}>Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th onClick={() => requestSort('email')} style={{ cursor: 'pointer' }}>Email {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th onClick={() => requestSort('department')} style={{ cursor: 'pointer' }}>Department {sortConfig.key === 'department' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th onClick={() => requestSort('semester')} style={{ cursor: 'pointer' }}>semester {sortConfig.key === 'semester' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th onClick={() => requestSort('status')} style={{ cursor: 'pointer' }}>Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th>Subjects</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedStudents.map(s => (
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
                        {sortedStudents.length === 0 && !loading && (
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
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', justifyContent: 'space-between' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><BookOpen size={14} /> Enroll in Subjects</span>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 400, cursor: 'pointer' }}>
                                    <input type="checkbox" onChange={handleSelectAll} checked={selectedCourses.length === (courses?.length || 0) && (courses?.length || 0) > 0} />
                                    Select All
                                </label>
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
