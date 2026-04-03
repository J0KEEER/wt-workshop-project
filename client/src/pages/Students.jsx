import { Plus, Edit2, Trash2, Search, AlertTriangle, BookOpen, Users, GraduationCap, Filter, Download } from 'lucide-react';
import { ModalOverlay, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';

export default function Students() {
    const toast = useToast();
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
            toast.success(editing ? 'Student updated successfully' : 'Student created successfully');
            fetchStudentsOnly();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error saving');
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
            toast.success('Student deleted successfully');
            fetchStudentsOnly();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error deleting');
        } finally {
            setDeleteTarget(null);
        }
    };

    // Removed top-level loading check to prevent unmounting toolbar

    return (
        <div className="fade-in">
            <div className="hero-card" style={{ 
                background: 'linear-gradient(135deg, var(--accent-dark) 0%, #1e1e2e 100%)',
                padding: '40px',
                borderRadius: '32px',
                marginBottom: '32px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                        <div className="status-dot status-online" style={{ width: '12px', height: '12px' }}></div>
                        <span style={{ color: 'var(--accent-light)', fontWeight: 800, letterSpacing: '2px', fontSize: '0.75rem' }}>INSTITUTIONAL REGISTRY</span>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <GraduationCap size={40} className="text-accent" strokeWidth={2.5} /> Scholar Directory
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '12px', maxWidth: '600px', lineHeight: '1.6' }}>
                        Comprehensive academic database managing student profiles, institutional enrollments, and performance metrics across all departments.
                    </p>
                </div>
                <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.05 }}>
                    <Users size={300} strokeWidth={1} />
                </div>
            </div>

            <div className="toolbar glass-morph" style={{ 
                padding: '20px 24px', 
                borderRadius: '24px', 
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '20px'
            }}>
                <div className="toolbar-left" style={{ flex: 1 }}>
                    <div className="search-box glass-morph" style={{ maxWidth: '400px', width: '100%' }}>
                        <Search size={18} className="text-accent" />
                        <input 
                            className="form-control" 
                            placeholder="Identify scholars by name or roll identifier..." 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            style={{ background: 'transparent', border: 'none', paddingLeft: '10px' }}
                        />
                    </div>
                </div>
                <div className="toolbar-right" style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-outline" style={{ borderRadius: '14px' }}>
                        <Filter size={16} /> Filters
                    </button>
                    <button className="btn btn-primary" onClick={openCreate} id="add-student-btn" style={{ 
                        borderRadius: '14px', 
                        padding: '10px 24px',
                        fontWeight: 700,
                        boxShadow: 'var(--accent-glow)'
                    }}>
                        <Plus size={18} strokeWidth={3} /> ADD SCHOLAR
                    </button>
                </div>
            </div>

            <div className="table-wrapper glass-morph" style={{ 
                borderRadius: '24px', 
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                {loading && (
                    <div className="loading-view" style={{ 
                        position: 'absolute', 
                        inset: 0, 
                        zIndex: 10, 
                        background: 'rgba(10, 10, 15, 0.7)', 
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div className="spinner" style={{ width: '40px', height: '40px', borderTopColor: 'var(--accent)' }}></div>
                        <span className="loading-text" style={{ marginTop: '16px', fontWeight: 600, color: 'var(--accent-light)' }}>SYNCHRONIZING RECORDS...</span>
                    </div>
                )}
                <table>
                    <thead>
                        <tr>
                            <th onClick={() => requestSort('rollNo')} style={{ cursor: 'pointer', padding: '24px' }}>
                                ROLL IDENTIFIER {sortConfig.key === 'rollNo' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => requestSort('name')} style={{ cursor: 'pointer' }}>
                                FULL NAME {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => requestSort('email')} style={{ cursor: 'pointer' }}>
                                DIGITAL CONTACT {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => requestSort('department')} style={{ cursor: 'pointer' }}>
                                FACULTY {sortConfig.key === 'department' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => requestSort('semester')} style={{ cursor: 'pointer' }}>
                                SEM {sortConfig.key === 'semester' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => requestSort('status')} style={{ cursor: 'pointer' }}>
                                STATUS {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th style={{ textAlign: 'right', paddingRight: '24px' }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedStudents.map(s => (
                            <tr key={s.id} className="fade-in hover-row">
                                <td style={{ padding: '16px 24px' }}>
                                    <code style={{ 
                                        background: 'rgba(var(--accent-rgb), 0.1)', 
                                        color: 'var(--accent-light)', 
                                        padding: '4px 8px', 
                                        borderRadius: '8px',
                                        fontWeight: 800,
                                        fontSize: '0.85rem'
                                    }}>
                                        {s.rollNo}
                                    </code>
                                </td>
                                <td>
                                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{s.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                        <BookOpen size={10} /> {s.courses?.length || 0} Subjects Enrolled
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{s.email}</div>
                                </td>
                                <td>
                                    <span className="badge badge-outline" style={{ border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem' }}>
                                        {s.department?.toUpperCase() || 'UNASSIGNED'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ 
                                        width: '28px', 
                                        height: '28px', 
                                        borderRadius: '50%', 
                                        background: 'var(--bg-card)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        fontWeight: 800,
                                        fontSize: '0.8rem',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        {s.semester}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div className={`status-dot ${s.status === 'active' ? 'status-online' : 'status-offline'}`} style={{ width: '8px', height: '8px' }}></div>
                                        <span style={{ 
                                            fontSize: '0.7rem', 
                                            fontWeight: 800, 
                                            textTransform: 'uppercase',
                                            color: s.status === 'active' ? 'var(--success)' : 'var(--danger)',
                                            letterSpacing: '1px'
                                        }}>
                                            {s.status}
                                        </span>
                                    </div>
                                </td>
                                <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                                    <div className="btn-group">
                                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)} title="Update Profile">
                                            <Edit2 size={14} />
                                        </button>
                                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(s)} title="Revoke Access">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && sortedStudents.length === 0 && (
                    <div className="empty-state" style={{ padding: '80px 0' }}>
                        <div style={{ opacity: 0.3, marginBottom: '20px' }}>
                            <Search size={64} strokeWidth={1} />
                        </div>
                        <h3 style={{ fontWeight: 800 }}>No Academic Records Found</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>The search query for "{search}" yielded zero institutional results.</p>
                        <button className="btn btn-outline" onClick={() => setSearch('')} style={{ marginTop: '20px' }}>Clear Synchronizer</button>
                    </div>
                )}
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
