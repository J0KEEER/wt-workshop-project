import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, Search, AlertTriangle } from 'lucide-react';
import { ModalOverlay, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';

export default function Faculty() {
    const [facultyList, setFacultyList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', phone: '', department: '', departmentId: '', designation: 'Assistant Professor', specialization: '' });
    const [departments, setDepartments] = useState([]);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    const fetchFaculty = () => {
        setLoading(true);
        Promise.allSettled([
            api.get('/faculty', { params: search ? { search } : {} }),
            api.get('/departments')
        ])
        .then(([facultyRes, departmentsRes]) => {
            if (facultyRes.status === 'fulfilled') setFacultyList(facultyRes.value.data);
            if (departmentsRes.status === 'fulfilled') setDepartments(departmentsRes.value.data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    const fetchFacultyOnly = () => {
        setLoading(true); // Set loading to true when fetching only faculty
        api.get('/faculty', { params: search ? { search } : {} })
            .then(res => setFacultyList(res.data))
            .catch(console.error)
            .finally(() => setLoading(false)); // Set loading to false after fetch
    }

    useEffect(() => {
        // Initial fetch of all data (faculty and departments)
        fetchFaculty();
    }, []); // Run once on mount

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchFacultyOnly();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedFacultyList = [...facultyList].sort((a, b) => {
        const valA = a[sortConfig.key] || '';
        const valB = b[sortConfig.key] || '';
        if (typeof valA === 'string') {
            return sortConfig.direction === 'asc' 
                ? valA.localeCompare(valB)
                : valB.localeCompare(valA);
        }
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
    });

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', email: '', phone: '', department: '', departmentId: '', designation: 'Assistant Professor', specialization: '' });
        setModalOpen(true);
    };

    const openEdit = (f) => {
        setEditing(f);
        setForm({ 
            name: f.name, 
            email: f.email, 
            phone: f.phone || '', 
            department: f.department, 
            departmentId: f.departmentId || '', 
            designation: f.designation, 
            specialization: f.specialization || '' 
        });
        setModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await api.put(`/faculty/${editing.id}`, form);
            } else {
                await api.post('/faculty', form);
            }
            setModalOpen(false);
            fetchFacultyOnly();
        } catch (err) {
            alert(err.response?.data?.error || 'Error saving');
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/faculty/${deleteTarget.id}`);
            fetchFacultyOnly();
        } catch (err) {
            alert(err.response?.data?.error || 'Error deleting');
        } finally {
            setDeleteTarget(null);
        }
    };

    return (
        <div className="fade-in">
            <div className="toolbar">
                <div className="toolbar-left">
                    <div className="search-box">
                        <Search size={16} />
                        <input className="form-control" placeholder="Search faculty…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search faculty" />
                    </div>
                </div>
                <div className="toolbar-right">
                    <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Faculty</button>
                </div>
            </div>
            <div className="table-wrapper" style={{ position: 'relative', minHeight: '200px' }}>
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
                            <th onClick={() => requestSort('name')} style={{ cursor: 'pointer' }}>Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th onClick={() => requestSort('email')} style={{ cursor: 'pointer' }}>Email {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th onClick={() => requestSort('department')} style={{ cursor: 'pointer' }}>Department {sortConfig.key === 'department' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th onClick={() => requestSort('designation')} style={{ cursor: 'pointer' }}>Designation {sortConfig.key === 'designation' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th>Courses</th>
                            <th onClick={() => requestSort('status')} style={{ cursor: 'pointer' }}>Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedFacultyList.map(f => (
                            <tr key={f.id}>
                                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.name}</td>
                                <td>{f.email}</td>
                                <td>{f.department}</td>
                                <td><span className="badge badge-info">{f.designation}</span></td>
                                <td>{f.courses?.map(c => c.code).join(', ') || '—'}</td>
                                <td><span className={`badge ${f.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{f.status}</span></td>
                                <td>
                                    <div className="btn-group">
                                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(f)} aria-label={`Edit ${f.name}`}><Edit2 size={14} /></button>
                                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(f)} aria-label={`Delete ${f.name}`}><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {sortedFacultyList.length === 0 && !loading && (
                            <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No faculty found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <ModalOverlay isOpen={modalOpen} onClose={() => setModalOpen(false)}>
                <ModalHeader title={editing ? 'Edit Faculty' : 'Add Faculty'} onClose={() => setModalOpen(false)} />
                <form onSubmit={handleSave}>
                    <ModalBody>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input className="form-control" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
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
                                <label>Designation</label>
                                <select className="form-control" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })}>
                                    <option value="Professor">Professor</option>
                                    <option value="Associate Professor">Associate Professor</option>
                                    <option value="Assistant Professor">Assistant Professor</option>
                                    <option value="Lecturer">Lecturer</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Phone</label>
                                <input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Specialization</label>
                                <input className="form-control" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} />
                            </div>
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
                        Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget?.name}</strong>? This action cannot be undone.
                    </p>
                </ModalBody>
                <ModalFooter>
                    <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                    <button className="btn btn-danger" onClick={confirmDelete}>
                        <Trash2 size={14} /> Delete Faculty
                    </button>
                </ModalFooter>
            </ModalOverlay>
        </div>
    );
}
