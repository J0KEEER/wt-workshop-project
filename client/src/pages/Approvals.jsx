import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    UserCheck, UserX, Clock, Calendar, Mail, User, 
    ShieldCheck, ShieldAlert, BadgeCheck, AlertCircle,
    ArrowRightCircle, Search, Filter, History
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Approvals() {
    const toast = useToast();
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPending = async () => {
        try {
            const res = await api.get('/admin/approvals');
            setPending(res.data);
        } catch (err) {
            toast.error("Failed to load approvals");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleAction = async (id, action) => {
        try {
            await api.patch(`/admin/approvals/${id}`, { action });
            toast.success(action === 'approve' ? 'User approved' : 'Request rejected');
            fetchPending();
        } catch (err) {
            toast.error("Operation failed");
        }
    };

    if (loading) return (
        <div className="loading-container">
            <div className="spinner"></div>
            <p>Accessing Secure Registry...</p>
        </div>
    );

    return (
        <div className="fade-in">
            {/* Premium Toolbar */}
            <div className="toolbar" style={{ marginBottom: '32px', borderRadius: '16px' }}>
                <div className="toolbar-left">
                    <div className="search-box">
                        <Search size={18} />
                        <input className="form-control" placeholder="Search by name, email or ID..." />
                    </div>
                    <button className="btn btn-icon"><Filter size={18} /></button>
                </div>
                <div className="toolbar-right">
                    <button className="btn btn-secondary" style={{ gap: '8px' }}>
                        <History size={16} /> Audit Logs
                    </button>
                    <div className="v-separator"></div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                        Institutional Trust Level: <span className="text-success">HIGH</span>
                    </span>
                </div>
            </div>

            {pending.length > 0 ? (
                <div className="approvals-grid" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', 
                    gap: '24px' 
                }}>
                    {pending.map(user => (
                        <div key={user.id} className="card fade-in" style={{ padding: '28px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, right: 0, width: '4px', height: '100%', background: 'var(--warning)' }}></div>
                            
                            <div className="user-info-header" style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
                                <div className="avatar-premium" style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '16px',
                                    background: 'var(--accent-subtle)',
                                    display: 'flex',
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    color: 'var(--accent-light)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                                }}>
                                    <User size={32} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{user.firstName} {user.lastName}</h3>
                                        {user.role === 'faculty' && <BadgeCheck size={16} className="text-info" />}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <span className="badge" style={{ 
                                            background: 'rgba(255,255,255,0.05)', 
                                            border: '1px solid rgba(255,255,255,0.1)', 
                                            textTransform: 'uppercase',
                                            fontSize: '0.65rem',
                                            fontWeight: 700,
                                            letterSpacing: '0.5px'
                                        }}>
                                            {user.role}
                                        </span>
                                        <span className="badge badge-warning" style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.5px' }}>
                                            REVIEWING
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="user-details-premium" style={{ 
                                display: 'grid', 
                                gridTemplateColumns: '1fr', 
                                gap: '12px', 
                                marginBottom: '28px',
                                padding: '16px',
                                borderRadius: '12px',
                                background: 'rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    <Mail size={16} className="text-accent" /> 
                                    <span style={{ color: 'var(--text-primary)' }}>{user.email}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    <Calendar size={16} className="text-accent" /> 
                                    <span>Requested on <strong style={{ color: 'var(--text-primary)' }}>{new Date(user.createdAt).toLocaleDateString()}</strong></span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    <ShieldAlert size={16} className="text-accent" /> 
                                    <span>Identity Identifier: <strong style={{ color: 'var(--text-primary)' }}>{user.username}</strong></span>
                                </div>
                            </div>

                            <div className="approval-actions" style={{ display: 'flex', gap: '16px' }}>
                                <button 
                                    className="btn btn-primary" 
                                    style={{ flex: 1.5, gap: '8px', padding: '12px 20px', borderRadius: '12px', fontWeight: 600 }}
                                    onClick={() => handleAction(user.id, 'approve')}
                                >
                                    <UserCheck size={18} /> Authorize Access
                                </button>
                                <button 
                                    className="btn btn-danger btn-outline" 
                                    style={{ flex: 1, gap: '8px', padding: '12px 16px', borderRadius: '12px', fontWeight: 600 }}
                                    onClick={() => handleAction(user.id, 'reject')}
                                >
                                    <UserX size={18} /> Deny
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state fade-in" style={{ padding: '80px 40px', textAlign: 'center' }}>
                    <div style={{ 
                        width: '100px', 
                        height: '100px', 
                        borderRadius: '50%', 
                        background: 'rgba(34, 197, 94, 0.1)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        margin: '0 auto 24px auto',
                        color: 'var(--success)',
                        border: '2px solid rgba(34, 197, 94, 0.2)'
                    }}>
                        <UserCheck size={48} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>Operational Clearance</h3>
                    <p style={{ maxWidth: '450px', margin: '0 auto', color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.6' }}>
                        All caught up! Every access request has been reviewed. The institutional gateway is currently clear.
                    </p>
                    <button className="btn btn-secondary" style={{ marginTop: '32px', gap: '8px' }} onClick={fetchPending}>
                        <ArrowRightCircle size={18} /> Refresh Registry
                    </button>
                </div>
            )}
        </div>
    );
}
