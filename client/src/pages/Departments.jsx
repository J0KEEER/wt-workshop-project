import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, Search, X, AlertTriangle, Building2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { ModalOverlay, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';

export default function Departments() {
    const toast = useToast();
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', code: '', description: '', headOfDepartment: '' });
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [sortBy, setSortBy] = useState('name');

    const fetchDepartments = () => {
        setLoading(true);
        api.get('/departments', { params: search ? { search } : {} })
            .then(res => setDepartments(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    // Initial load
    useEffect(() => {
        fetchDepartments();
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchDepartments();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const sortedDepartments = [...departments].sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'code') return a.code.localeCompare(b.code);
        if (sortBy === 'students') return (b.studentCount || 0) - (a.studentCount || 0);
        return 0;
    });

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', code: '', description: '', headOfDepartment: '' });
        setModalOpen(true);
    };

    const openEdit = (d) => {
        setEditing(d);
        setForm({ name: d.name, code: d.code, description: d.description || '', headOfDepartment: d.headOfDepartment || '' });
        setModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await api.put(`/departments/${editing.id}`, form);
            } else {
                await api.post('/departments', form);
            }
            setModalOpen(false);
            toast.success(editing ? 'Department updated successfully' : 'Department created successfully');
            fetchDepartments();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error saving');
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/departments/${deleteTarget.id}`);
            toast.success('Department deleted successfully');
            fetchDepartments();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error deleting');
        } finally {
            setDeleteTarget(null);
        }
    };

    // Removed top-level loading check

    return (
        <div className="fade-in">
            <div className="card hero-card" style={{ marginBottom: '32px' }}>
                <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>Institutional Departments</h2>
                            <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>Overview of academic divisions, administrative heads, and resource allocation across the campus.</p>
                        </div>
                        <Building2 size={48} style={{ opacity: 0.2 }} />
                    </div>
                </div>
            </div>

            <div className="toolbar glass-morph" style={{ marginBottom: '24px', padding: '16px 24px', borderRadius: '20px' }}>
                <div className="toolbar-left">
                    <div className="search-box">
                        <Search size={18} />
                        <input className="form-control" placeholder="Search departments…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search departments" />
                    </div>
                    <select 
                        className="form-control" 
                        style={{ width: 'auto', marginLeft: '12px', fontSize: '0.85rem', borderRadius: '10px' }} 
                        value={sortBy} 
                        onChange={e => setSortBy(e.target.value)}
                    >
                        <option value="name">Sort by Name</option>
                        <option value="code">Sort by Code</option>
                        <option value="students">Sort by Students (High to Low)</option>
                    </select>
                </div>
                <div className="toolbar-right" style={{ gap: '12px' }}>
                    <div style={{ marginRight: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <strong>{sortedDepartments.length}</strong> ACTIVE DEPARTMENTS
                    </div>
                    <button className="btn btn-primary" onClick={openCreate} id="add-department-btn" style={{ padding: '10px 20px', borderRadius: '12px', fontWeight: 700 }}>
                        <Plus size={18} /> Add Department
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px', marginTop: '8px', position: 'relative', minHeight: '300px' }}>
                {loading && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(10, 14, 26, 0.4)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                        borderRadius: '24px'
                    }}>
                        <div className="spinner"></div>
                    </div>
                )}
                {sortedDepartments.map(d => (
                    <div key={d.id} className="hover-card glass-morph fade-in" style={{ padding: '24px', borderRadius: '24px', position: 'relative', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                            <div style={{
                                width: '56px', height: '56px', borderRadius: '16px',
                                background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                color: 'var(--accent-light)'
                            }}>
                                <Building2 size={28} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 800, marginBottom: '4px', lineHeight: 1.2 }}>{d.name}</h4>
                                    <span className="badge badge-outline" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>{d.code}</span>
                                </div>
                                {d.headOfDepartment && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '8px' }}>
                                        <Users size={12} style={{ opacity: 0.6 }} /> 
                                        Head: <strong style={{ color: 'var(--accent-light)' }}>{d.headOfDepartment}</strong>
                                    </div>
                                )}
                                {d.description && (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '12px', lineHeight: 1.5, opacity: 0.8 }}>
                                        {d.description}
                                    </p>
                                )}
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '24px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{d.studentCount || 0}</p>
                                        <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>Students</p>
                                    </div>
                                    <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{d.facultyCount || 0}</p>
                                        <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>Faculty</p>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{d.courseCount || 0}</p>
                                        <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>Assets</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <span className={`badge ${d.status === 'active' ? 'badge-success' : 'badge-warning'}`} style={{ marginRight: 'auto', fontSize: '0.65rem' }}>{d.status.toUpperCase()}</span>
                            <button className="btn btn-secondary btn-sm" style={{ padding: '8px', borderRadius: '10px' }} onClick={() => openEdit(d)} aria-label={`Edit ${d.name}`}><Edit2 size={14} /></button>
                            <button className="btn btn-danger btn-sm" style={{ padding: '8px', borderRadius: '10px' }} onClick={() => setDeleteTarget(d)} aria-label={`Delete ${d.name}`}><Trash2 size={14} /></button>
                        </div>
                    </div>
                ))}
                {departments.length === 0 && !loading && (
                    <div className="empty-state glass-morph" style={{ gridColumn: '1 / -1', padding: '64px', textAlign: 'center' }}>
                        <Building2 size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                        <p style={{ fontWeight: 700, margin: 0 }}>No Divisions Located</p>
                        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>The departmental registry is currently empty.</p>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <ModalOverlay isOpen={modalOpen} onClose={() => setModalOpen(false)}>
                <ModalHeader title={editing ? 'Edit Department' : 'Add Department'} onClose={() => setModalOpen(false)} />
                <form onSubmit={handleSave}>
                    <ModalBody>
                        <div className="form-row">
                            <div className="form-group" style={{ flex: 2 }}>
                                <label>Department Name</label>
                                <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. B.Tech in Computer Science Engineering (CSE)" />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Code</label>
                                <input className="form-control" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required placeholder="e.g. CSE" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Head of Department (optional)</label>
                            <input className="form-control" value={form.headOfDepartment} onChange={e => setForm({ ...form, headOfDepartment: e.target.value })} placeholder="Faculty name" />
                        </div>
                        <div className="form-group">
                            <label>Description (optional)</label>
                            <textarea className="form-control" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the department" style={{ resize: 'vertical' }} />
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
                        <Trash2 size={14} /> Delete Department
                    </button>
                </ModalFooter>
            </ModalOverlay>
        </div>
    );
}
