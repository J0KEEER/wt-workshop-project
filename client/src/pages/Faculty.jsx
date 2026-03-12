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
    const [form, setForm] = useState({ name: '', email: '', phone: '', department: '', designation: 'Assistant Professor', specialization: '' });
    const [deleteTarget, setDeleteTarget] = useState(null);

    const fetchFaculty = () => {
        setLoading(true);
        api.get('/faculty', { params: search ? { search } : {} })
            .then(res => setFacultyList(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const fetchFacultyOnly = () => {
        api.get('/faculty', { params: search ? { search } : {} })
            .then(res => setFacultyList(res.data))
            .catch(console.error);
    }

    useEffect(() => { fetchFaculty(); }, [search]);

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', email: '', phone: '', department: '', designation: 'Assistant Professor', specialization: '' });
        setModalOpen(true);
    };

    const openEdit = (f) => {
        setEditing(f);
        setForm({ name: f.name, email: f.email, phone: f.phone || '', department: f.department, designation: f.designation, specialization: f.specialization || '' });
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

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

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

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Department</th>
                            <th>Designation</th>
                            <th>Courses</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {facultyList.map(f => (
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
                        {facultyList.length === 0 && (
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
                                <select className="form-control" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} required>
                                    <option value="">Select...</option>
                                    <option value="Computer Science">Computer Science</option>
                                    <option value="Mathematics">Mathematics</option>
                                    <option value="Physics">Physics</option>
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
