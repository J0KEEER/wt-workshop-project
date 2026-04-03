import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, Search, AlertTriangle, Users, GraduationCap, Mail, Phone, BookOpen } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { ModalOverlay, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';

export default function Faculty() {
    const toast = useToast();
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
            toast.success(editing ? 'Faculty updated successfully' : 'Faculty created successfully');
            fetchFacultyOnly();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error saving');
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/faculty/${deleteTarget.id}`);
            toast.success('Faculty deleted successfully');
            fetchFacultyOnly();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error deleting');
        } finally {
            setDeleteTarget(null);
        }
    };

    return (
        <div className="fade-in">
            <div className="card hero-card" style={{ marginBottom: '32px' }}>
                <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>Institutional Faculty</h2>
                            <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>Digital registry of academic staff, scholarly specializations, and departmental designations.</p>
                        </div>
                        <Users size={48} style={{ opacity: 0.2 }} />
                    </div>
                </div>
            </div>

            <div className="toolbar glass-morph" style={{ marginBottom: '24px', padding: '16px 24px', borderRadius: '20px' }}>
                <div className="toolbar-left">
                    <div className="search-box">
                        <Search size={18} />
                        <input className="form-control" placeholder="Identify record by name or expertise…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search faculty" />
                    </div>
                </div>
                <div className="toolbar-right" style={{ gap: '12px' }}>
                    <div style={{ marginRight: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <strong>{sortedFacultyList.length}</strong> ACTIVE RECORDS
                    </div>
                    <button className="btn btn-primary" onClick={openCreate} style={{ padding: '10px 20px', borderRadius: '12px', fontWeight: 700 }}>
                        <Plus size={18} /> Add Faculty
                    </button>
                </div>
            </div>
            <div className="table-wrapper glass-morph" style={{ position: 'relative', minHeight: '200px', borderRadius: '24px', overflow: 'hidden' }}>
                {loading && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(10, 14, 26, 0.4)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
                    }}>
                        <div className="spinner"></div>
                    </div>
                )}
                <table>
                    <thead>
                        <tr>
                            <th onClick={() => requestSort('name')} style={{ cursor: 'pointer', padding: '20px' }}>IDENTIFIED NAME {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th onClick={() => requestSort('email')} style={{ cursor: 'pointer' }}>CONTACT CHANNELS {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th onClick={() => requestSort('department')} style={{ cursor: 'pointer' }}>DEPARTMENT {sortConfig.key === 'department' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th onClick={() => requestSort('designation')} style={{ cursor: 'pointer' }}>DESIGNATION {sortConfig.key === 'designation' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th>COURSE LOAD</th>
                            <th onClick={() => requestSort('status')} style={{ cursor: 'pointer' }}>STATUS {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th style={{ textAlign: 'right', paddingRight: '24px' }}>OPERATIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedFacultyList.map(f => (
                            <tr key={f.id} className="fade-in">
                                <td style={{ padding: '16px 20px' }}>
                                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{f.name}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><GraduationCap size={10} /> {f.specialization || 'Generalist'}</div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}><Mail size={12} style={{ opacity: 0.5 }} /> {f.email}</div>
                                        {f.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}><Phone size={12} style={{ opacity: 0.5 }} /> {f.phone}</div>}
                                    </div>
                                </td>
                                <td>
                                    <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>{f.department}</span>
                                </td>
                                <td>
                                    <span className="badge badge-info" style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '8px', fontWeight: 700 }}>{f.designation}</span>
                                </td>
                                <td>
                                    {f.courses && f.courses.length > 0 ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {f.courses.map(c => (
                                                <span key={c.id} className="badge badge-outline" style={{ fontSize: '0.65rem', borderColor: 'rgba(var(--accent-rgb), 0.3)' }}>{c.code}</span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None Assigned</span>
                                    )}
                                </td>
                                <td><span className={`badge ${f.status === 'active' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>{f.status.toUpperCase()}</span></td>
                                <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                                    <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
                                        <button className="btn btn-secondary btn-sm" style={{ padding: '8px', borderRadius: '10px' }} onClick={() => openEdit(f)} aria-label={`Edit ${f.name}`}><Edit2 size={14} /></button>
                                        <button className="btn btn-danger btn-sm" style={{ padding: '8px', borderRadius: '10px' }} onClick={() => setDeleteTarget(f)} aria-label={`Delete ${f.name}`}><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {sortedFacultyList.length === 0 && !loading && (
                            <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '64px' }}>
                                <div className="empty-state">
                                    <Users size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                                    <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>No Educators Identified</p>
                                    <p style={{ margin: '4px 0 0 0', opacity: 0.7 }}>Try adjusting your search criteria to locate staff.</p>
                                </div>
                            </td></tr>
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
