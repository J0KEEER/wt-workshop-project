import { 
    DollarSign, CreditCard, Plus, 
    AlertCircle, CheckCircle, TrendingUp, Calendar, Send,
    ShieldCheck, AlertTriangle, Activity, Wallet, Receipt, PieChart
} from 'lucide-react';
import { ModalOverlay, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';

export default function Fees() {
    const { user } = useAuth();
    const toast = useToast();
    const [fees, setFees] = useState([]);
    const [defaulters, setDefaulters] = useState([]);
    const [students, setStudents] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(user.role === 'student' ? 'my-fees' : 'overview');
    
    const [payModalOpen, setPayModalOpen] = useState(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [payAmount, setPayAmount] = useState('');
    const [newFee, setNewFee] = useState({ studentId: '', description: '', type: 'tuition', amount: '', dueDate: '' });

    const fetchData = async () => {
        try {
            setLoading(true);
            if (user.role === 'student') {
                const res = await api.get('/fees/my-fees');
                setFees(res.data);
            } else {
                if (activeTab === 'overview') {
                    const res = await api.get('/fees/stats');
                    setStats(res.data);
                    const allFees = await api.get('/fees');
                    setFees(allFees.data);
                } else if (activeTab === 'overdue') {
                    const res = await api.get('/fees/defaulters');
                    setDefaulters(res.data);
                }
                if (students.length === 0) {
                    const sRes = await api.get('/students');
                    setStudents(sRes.data);
                }
            }
        } catch (err) {
            toast.error('Failed to load financial data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handlePayment = async (feeId) => {
        if (!payAmount || parseFloat(payAmount) <= 0) return toast.warning('Enter valid amount');
        try {
            await api.post('/fees/payment', { feeId, amount: parseFloat(payAmount), method: 'online' });
            setPayModalOpen(null);
            setPayAmount('');
            toast.success('Payment recorded successfully!');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Payment failed');
        }
    };

    const handleCreateFee = async (e) => {
        e.preventDefault();
        try {
            await api.post('/fees', { ...newFee, studentId: parseInt(newFee.studentId), amount: parseFloat(newFee.amount) });
            setCreateModalOpen(false);
            setNewFee({ studentId: '', description: '', type: 'tuition', amount: '', dueDate: '' });
            toast.success('Fee record created');
            fetchData();
        } catch (err) {
            toast.error('Error creating fee record');
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            paid: 'badge-success',
            pending: 'badge-warning',
            overdue: 'badge-danger',
            partial: 'badge-info'
        };
        return <span className={`badge ${styles[status] || 'badge-primary'}`}>{status.toUpperCase()}</span>;
    };

    if (loading && fees.length === 0) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div className="fade-in">
            <div className="hero-card" style={{ 
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                padding: '40px',
                borderRadius: '32px',
                marginBottom: '32px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                        <div className="status-dot status-online" style={{ width: '12px', height: '12px' }}></div>
                        <span style={{ color: 'var(--accent-light)', fontWeight: 800, letterSpacing: '2px', fontSize: '0.75rem' }}>FINANCIAL OPERATIONS</span>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Wallet size={40} className="text-accent" strokeWidth={2.5} /> Treasury Oversight
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '12px', maxWidth: '600px', lineHeight: '1.6' }}>
                        Unified fiscal management system for tracking institutional revenue, scholarship allocations, and synchronized billing cycles.
                    </p>
                </div>
                {user.role !== 'student' && (
                    <div style={{ position: 'absolute', right: '40px', bottom: '40px', zIndex: 3 }}>
                        <button className="btn btn-primary" onClick={() => setCreateModalOpen(true)} style={{ 
                            borderRadius: '16px', 
                            padding: '12px 28px',
                            fontWeight: 800,
                            boxShadow: 'var(--accent-glow)'
                        }}>
                            <Plus size={18} strokeWidth={3} /> GENERATE BILLING
                        </button>
                    </div>
                )}
                <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.05 }}>
                    <DollarSign size={300} strokeWidth={1} />
                </div>
            </div>

            {/* Admin Stats Overview */}
            {user.role !== 'student' && stats && activeTab === 'overview' && (
                <div className="stats-grid" style={{ marginBottom: '32px' }}>
                    <div className="stat-card glass-morph" style={{ borderRadius: '24px' }}>
                        <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                            <Activity size={24} />
                        </div>
                        <div className="stat-info">
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.6, display: 'block', marginBottom: '4px' }}>Total Potential</label>
                            <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900 }}>${stats.totalFees?.toLocaleString()}</h3>
                        </div>
                    </div>
                    <div className="stat-card glass-morph" style={{ borderRadius: '24px' }}>
                        <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                            <ShieldCheck size={24} />
                        </div>
                        <div className="stat-info">
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.6, display: 'block', marginBottom: '4px' }}>Actual Revenue</label>
                            <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: 'var(--success)' }}>${stats.totalCollected?.toLocaleString()}</h3>
                        </div>
                    </div>
                    <div className="stat-card glass-morph" style={{ borderRadius: '24px' }}>
                        <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                            <AlertTriangle size={24} />
                        </div>
                        <div className="stat-info">
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.6, display: 'block', marginBottom: '4px' }}>Critical Arrears</label>
                            <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: 'var(--danger)' }}>{stats.overdueCount}</h3>
                        </div>
                    </div>
                </div>
            )}

            {/* Role-Based Tabs */}
            {user.role !== 'student' && (
                <div className="tab-container glass-morph" style={{ marginBottom: '32px', padding: '6px', borderRadius: '18px', maxWidth: 'fit-content' }}>
                    <div onClick={() => setActiveTab('overview')} className={`tab-item ${activeTab === 'overview' ? 'active' : ''}`} style={{ borderRadius: '14px', padding: '10px 24px' }}>
                        <PieChart size={16} /> TRANSACTION CLOUD
                    </div>
                    <div onClick={() => setActiveTab('overdue')} className={`tab-item ${activeTab === 'overdue' ? 'active' : ''}`} style={{ borderRadius: '14px', padding: '10px 24px' }}>
                        <AlertTriangle size={16} /> DEFAULTERS REGISTRY
                    </div>
                </div>
            )}

            <div className="content-area" style={{ marginTop: '24px' }}>
                {user.role === 'student' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '32px' }}>
                        {fees.map(fee => (
                            <div key={fee.id} className="card glass-morph hover-row fade-in" style={{ padding: '32px', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                                    <div style={{ background: 'rgba(var(--accent-rgb), 0.1)', color: 'var(--accent-light)', padding: '14px', borderRadius: '16px' }}>
                                        <Receipt size={28} />
                                    </div>
                                    <div>{getStatusBadge(fee.status)}</div>
                                </div>
                                <h4 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>{fee.description}</h4>
                                <div style={{ fontSize: '0.75rem', color: 'var(--accent-light)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px' }}>
                                    INVOICE REF: ACC-{fee.id}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>NET PAYABLE</span>
                                        <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.1rem' }}>${fee.amount.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>SETTLEMENT DEADLINE</span>
                                        <span style={{ fontWeight: 700, color: fee.status === 'overdue' ? 'var(--danger)' : 'var(--text-primary)' }}>{new Date(fee.dueDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="divider" style={{ margin: '4px 0' }}></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}>
                                        <span style={{ fontWeight: 800, color: 'var(--success)' }}>SETTLED AMOUNT</span>
                                        <span style={{ fontWeight: 900, color: 'var(--success)' }}>${(fee.paidAmount || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                                {fee.status !== 'paid' && (
                                    <button 
                                        className="btn btn-primary" 
                                        style={{ width: '100%', justifyContent: 'center', padding: '16px', borderRadius: '16px', fontWeight: 800, boxShadow: 'var(--accent-glow)' }}
                                        onClick={() => { setPayModalOpen(fee); setPayAmount(String(fee.amount - (fee.paidAmount || 0))); }}
                                    >
                                        <CreditCard size={20} /> AUTHORIZE PAYMENT
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : activeTab === 'overview' ? (
                    <div className="table-wrapper glass-morph" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ padding: '24px' }}>ACADEMIC CANDIDATE</th>
                                    <th>FISCAL CATEGORY</th>
                                    <th>TOTAL BILLED</th>
                                    <th>SETTLED FUNDS</th>
                                    <th>DUE DATE</th>
                                    <th>STATUS</th>
                                    <th style={{ textAlign: 'right', paddingRight: '24px' }}>OPERATIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fees.map(f => (
                                    <tr key={f.id} className="fade-in hover-row">
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{f.student?.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.student?.rollNo}</div>
                                        </td>
                                        <td><span className="badge badge-outline" style={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 800 }}>{f.type}</span></td>
                                        <td style={{ fontWeight: 900, color: 'var(--text-primary)' }}>${f.amount?.toLocaleString()}</td>
                                        <td style={{ color: 'var(--success)', fontWeight: 800 }}>${f.paidAmount?.toLocaleString()}</td>
                                        <td style={{ fontWeight: 600 }}>{new Date(f.dueDate).toLocaleDateString()}</td>
                                        <td>{getStatusBadge(f.status)}</td>
                                        <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => { setPayModalOpen(f); setPayAmount(String(f.amount - f.paidAmount)); }} title="Record External Payment">
                                                <DollarSign size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="table-wrapper glass-morph">
                        <div className="toolbar" style={{ padding: '0 0 20px 0', border: 'none', background: 'transparent' }}>
                            <div className="toolbar-left">
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--danger)' }}>Payment Defaulters Registry</h3>
                            </div>
                            <div className="toolbar-right">
                                <button className="btn btn-danger btn-sm"><Send size={14} /> Remind All</button>
                            </div>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Candidate</th>
                                    <th>Outstanding Balance</th>
                                    <th>Exceeded Deadline</th>
                                    <th style={{ textAlign: 'right' }}>Direct Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {defaulters.map(f => (
                                    <tr key={f.id} className="fade-in">
                                        <td>
                                            <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{f.student?.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.student?.rollNo}</div>
                                        </td>
                                        <td style={{ color: 'var(--danger)', fontWeight: 800 }}>${(f.amount - f.paidAmount).toLocaleString()}</td>
                                        <td>{new Date(f.dueDate).toLocaleDateString()}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button className="btn btn-secondary btn-sm" title="Send Official Notice">
                                                <Send size={14} /> Send Notice
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {defaulters.length === 0 && (
                            <div className="empty-state">
                                <CheckCircle size={48} style={{ color: 'var(--success)', opacity: 0.5 }} />
                                <h3>No Defaulters Found</h3>
                                <p>All students are currently up to date with their financial obligations.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ModalOverlay isOpen={!!payModalOpen} onClose={() => setPayModalOpen(null)}>
                <ModalHeader title="Record Payment" onClose={() => setPayModalOpen(null)} />
                <ModalBody>
                    <p style={{ marginBottom: '16px' }}>Recording payment for: <strong>{payModalOpen?.description}</strong></p>
                    <div className="form-group">
                        <label>Amount to Pay</label>
                        <input className="form-control" type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
                    </div>
                </ModalBody>
                <ModalFooter>
                    <button className="btn btn-secondary" onClick={() => setPayModalOpen(null)}>Cancel</button>
                    <button className="btn btn-success" onClick={() => handlePayment(payModalOpen.id)}>Confirm</button>
                </ModalFooter>
            </ModalOverlay>

            <ModalOverlay isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)}>
                <ModalHeader title="Generate Fee Account" onClose={() => setCreateModalOpen(false)} />
                <form onSubmit={handleCreateFee}>
                    <ModalBody>
                        <div className="form-group">
                            <label>Student</label>
                            <select className="form-control" value={newFee.studentId} onChange={e => setNewFee({ ...newFee, studentId: e.target.value })} required>
                                <option value="">Select student...</option>
                                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.rollNo})</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <input className="form-control" value={newFee.description} onChange={e => setNewFee({ ...newFee, description: e.target.value })} required />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Amount</label>
                                <input className="form-control" type="number" value={newFee.amount} onChange={e => setNewFee({ ...newFee, amount: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Due Date</label>
                                <input className="form-control" type="date" value={newFee.dueDate} onChange={e => setNewFee({ ...newFee, dueDate: e.target.value })} required />
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <button className="btn btn-primary" type="submit">Create Record</button>
                    </ModalFooter>
                </form>
            </ModalOverlay>
        </div>
    );
}
