import { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, Trash2, Shield, AlertTriangle, X, RefreshCw, Clock } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { ModalOverlay, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';

export default function Users() {
    const toast = useToast();
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
            toast.success('User deleted successfully');
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error deleting');
        } finally {
            setDeleteTarget(null);
        }
    };

    const toggleActive = async (user) => {
        try {
            await api.put(`/users/${user.id}`, { isActive: !user.isActive });
            toast.success(`User ${user.isActive ? 'disabled' : 'activated'} successfully`);
            fetchUsers();
        } catch (err) {
            toast.error('Error updating user status');
        }
    };

    const handleRenew = async (user) => {
        try {
            const newExpiry = new Date();
            newExpiry.setHours(newExpiry.getHours() + 168); // +7 days
            await api.put(`/users/${user.id}`, { batchExpiresAt: newExpiry });
            toast.success(`Access extended for ${user.username}`);
            fetchUsers();
        } catch (err) {
            toast.error('Error extending access');
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

    const renderExpiry = (user) => {
        if (user.role !== 'student' || !user.batchExpiresAt) return '-';
        
        const expiry = new Date(user.batchExpiresAt);
        const now = new Date();
        const diffHours = (expiry - now) / (1000 * 60 * 60);

        if (diffHours < 0) {
            return <span className="badge badge-danger"><AlertTriangle size={10} style={{ marginRight: 4 }} /> Expired</span>;
        }
        if (diffHours < 24) {
            return <span className="badge badge-warning"><Clock size={10} style={{ marginRight: 4 }} /> Soon</span>;
        }
        
        return (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {expiry.toLocaleDateString()}
            </span>
        );
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
                            <th>Expiry</th>
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
                                <td>{renderExpiry(u)}</td>
                                <td>
                                    <button
                                        className={`btn btn-sm ${u.isActive ? 'btn-success' : 'btn-danger'}`}
                                        onClick={() => toggleActive(u)}
                                    >
                                        {u.isActive ? 'Active' : 'Disabled'}
                                    </button>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {u.role === 'student' && (
                                            <button 
                                                className="btn btn-secondary btn-sm" 
                                                onClick={() => handleRenew(u)} 
                                                title="Renew Access (7 days)"
                                                aria-label="Renew user access"
                                            >
                                                <RefreshCw size={14} />
                                            </button>
                                        )}
                                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(u)} aria-label={`Delete user ${u.username}`}><Trash2 size={14} /></button>
                                    </div>
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
            <ModalOverlay isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
                <ModalHeader title="Confirm Deletion" icon={AlertTriangle} onClose={() => setDeleteTarget(null)} />
                <ModalBody>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        Are you sure you want to delete user <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget?.username}</strong>? This action cannot be undone.
                    </p>
                </ModalBody>
                <ModalFooter>
                    <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                    <button className="btn btn-danger" onClick={confirmDelete}>
                        <Trash2 size={14} /> Delete User
                    </button>
                </ModalFooter>
            </ModalOverlay>
        </div>
    );
}
