import { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, Trash2, Shield, AlertTriangle, X } from 'lucide-react';

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);

    const fetchUsers = () => {
        const params = {};
        if (search) params.search = search;
        if (filterRole) params.role = filterRole;
        api.get('/users', { params })
            .then(res => setUsers(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchUsers(); }, [search, filterRole]);

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/users/${deleteTarget.id}`);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.error || 'Error deleting');
        } finally {
            setDeleteTarget(null);
        }
    };

    const toggleActive = async (user) => {
        try {
            await api.put(`/users/${user.id}`, { isActive: !user.isActive });
            fetchUsers();
        } catch (err) {
            alert('Error updating');
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    const roleColors = {
        admin: 'badge-danger',
        faculty: 'badge-info',
        student: 'badge-success',
        librarian: 'badge-warning',
        staff: 'badge-default',
    };

    return (
        <div className="fade-in">
            <div className="toolbar">
                <div className="toolbar-left">
                    <div className="search-box">
                        <Search size={16} />
                        <input className="form-control" placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search users" />
                    </div>
                    <select className="form-control" value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ minWidth: '140px' }}>
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="faculty">Faculty</option>
                        <option value="student">Student</option>
                        <option value="librarian">Librarian</option>
                        <option value="staff">Staff</option>
                    </select>
                </div>
                <div className="toolbar-right">
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{users.length} users</span>
                </div>
            </div>

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Active</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id}>
                                <td style={{ color: 'var(--text-muted)' }}>#{u.id}</td>
                                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.username}</td>
                                <td>{u.firstName} {u.lastName}</td>
                                <td>{u.email}</td>
                                <td>
                                    <span className={`badge ${roleColors[u.role] || 'badge-default'}`}>
                                        <Shield size={10} style={{ marginRight: 4 }} />
                                        {u.role}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className={`btn btn-sm ${u.isActive ? 'btn-success' : 'btn-danger'}`}
                                        onClick={() => toggleActive(u)}
                                    >
                                        {u.isActive ? 'Active' : 'Disabled'}
                                    </button>
                                </td>
                                <td>
                                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(u)} aria-label={`Delete user ${u.username}`}><Trash2 size={14} /></button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No users found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

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
                                Are you sure you want to delete user <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.username}</strong>? This action cannot be undone.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={confirmDelete}>
                                <Trash2 size={14} /> Delete User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
