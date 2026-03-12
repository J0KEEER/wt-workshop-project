import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, Search, X, AlertTriangle, Building2 } from 'lucide-react';

export default function Departments() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', code: '', description: '', headOfDepartment: '' });
    const [deleteTarget, setDeleteTarget] = useState(null);

    const fetchDepartments = () => {
        api.get('/departments', { params: search ? { search } : {} })
            .then(res => setDepartments(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchDepartments(); }, [search]);

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
            fetchDepartments();
        } catch (err) {
            alert(err.response?.data?.error || 'Error saving');
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/departments/${deleteTarget.id}`);
            fetchDepartments();
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
                        <input className="form-control" placeholder="Search departments…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search departments" />
                    </div>
                </div>
                <div className="toolbar-right">
                    <button className="btn btn-primary" onClick={openCreate} id="add-department-btn"><Plus size={16} /> Add Department</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px', marginTop: '8px' }}>
                {departments.map(d => (
                    <div key={d.id} className="card" style={{ padding: '20px', position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                            <div style={{
                                width: '44px', height: '44px', borderRadius: 'var(--radius-md)',
                                background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                                <Building2 size={22} style={{ color: 'var(--accent)' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 600, marginBottom: '2px', lineHeight: 1.3 }}>{d.name}</h4>
                                <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{d.code}</span>
                                {d.headOfDepartment && (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '6px' }}>
                                        HOD: <strong style={{ color: 'var(--text-secondary)' }}>{d.headOfDepartment}</strong>
                                    </p>
                                )}
                                {d.description && (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '4px', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                        {d.description}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '12px', justifyContent: 'flex-end' }}>
                            <span className={`badge ${d.status === 'active' ? 'badge-success' : 'badge-warning'}`} style={{ marginRight: 'auto' }}>{d.status}</span>
                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(d)} aria-label={`Edit ${d.name}`}><Edit2 size={14} /></button>
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(d)} aria-label={`Delete ${d.name}`}><Trash2 size={14} /></button>
                        </div>
                    </div>
                ))}
                {departments.length === 0 && (
                    <div className="empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                        <Building2 size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                        <p>No departments found</p>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editing ? 'Edit Department' : 'Add Department'}</h3>
                            <button className="modal-close" onClick={() => setModalOpen(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
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
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
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
                                Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.name}</strong>? This action cannot be undone.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={confirmDelete}>
                                <Trash2 size={14} /> Delete Department
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
