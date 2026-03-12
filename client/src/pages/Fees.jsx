import { useState, useEffect } from 'react';
import api from '../services/api';
import { DollarSign, CreditCard, Search, X, Plus } from 'lucide-react';

export default function Fees() {
    const [fees, setFees] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [payModalOpen, setPayModalOpen] = useState(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [payAmount, setPayAmount] = useState('');
    const [payMethod, setPayMethod] = useState('online');
    const [newFee, setNewFee] = useState({ studentId: '', description: '', type: 'tuition', amount: '', dueDate: '' });

    const fetchFees = () => {
        api.get('/fees', { params: filterStatus ? { status: filterStatus } : {} })
            .then(res => setFees(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        api.get('/students').then(res => setStudents(res.data)).catch(() => { });
        fetchFees();
    }, [filterStatus]);

    const handlePayment = async (feeId) => {
        if (!payAmount || parseFloat(payAmount) <= 0) return alert('Enter valid amount');
        try {
            await api.post('/fees/payment', { feeId, amount: parseFloat(payAmount), method: payMethod });
            setPayModalOpen(null);
            setPayAmount('');
            fetchFees();
        } catch (err) {
            alert(err.response?.data?.error || 'Payment failed');
        }
    };

    const handleCreateFee = async (e) => {
        e.preventDefault();
        try {
            await api.post('/fees', { ...newFee, studentId: parseInt(newFee.studentId), amount: parseFloat(newFee.amount) });
            setCreateModalOpen(false);
            setNewFee({ studentId: '', description: '', type: 'tuition', amount: '', dueDate: '' });
            fetchFees();
        } catch (err) {
            alert(err.response?.data?.error || 'Error creating fee');
        }
    };

    const totalAmount = fees.reduce((acc, f) => acc + f.amount, 0);
    const totalPaid = fees.reduce((acc, f) => acc + f.paidAmount, 0);
    const totalPending = totalAmount - totalPaid;

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div className="fade-in">
            {/* Summary Cards */}
            <div className="stat-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                    <div className="stat-icon green"><DollarSign size={24} /></div>
                    <div className="stat-info">
                        <h4>Total Fees</h4>
                        <div className="stat-value">${totalAmount.toLocaleString()}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue"><CreditCard size={24} /></div>
                    <div className="stat-info">
                        <h4>Collected</h4>
                        <div className="stat-value">${totalPaid.toLocaleString()}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange"><DollarSign size={24} /></div>
                    <div className="stat-info">
                        <h4>Pending</h4>
                        <div className="stat-value">${totalPending.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="toolbar">
                <div className="toolbar-left">
                    <select className="form-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: '160px' }}>
                        <option value="">All Statuses</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="overdue">Overdue</option>
                        <option value="partial">Partial</option>
                    </select>
                </div>
                <div className="toolbar-right">
                    <button className="btn btn-primary" onClick={() => setCreateModalOpen(true)}><Plus size={16} /> Create Fee</button>
                </div>
            </div>

            {/* Fee Table */}
            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Description</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Paid</th>
                            <th>Balance</th>
                            <th>Due Date</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fees.map(f => (
                            <tr key={f.id}>
                                <td style={{ fontWeight: 500 }}>{f.student?.name || '—'}<br /><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.student?.rollNo}</span></td>
                                <td>{f.description}</td>
                                <td><span className="badge badge-default">{f.type}</span></td>
                                <td style={{ fontWeight: 600 }}>${f.amount.toLocaleString()}</td>
                                <td style={{ color: 'var(--success)' }}>${f.paidAmount.toLocaleString()}</td>
                                <td style={{ color: 'var(--warning)' }}>${(f.amount - f.paidAmount).toLocaleString()}</td>
                                <td>{f.dueDate}</td>
                                <td>
                                    <span className={`badge ${f.status === 'paid' ? 'badge-success' : f.status === 'overdue' ? 'badge-danger' : 'badge-warning'}`}>
                                        {f.status}
                                    </span>
                                </td>
                                <td>
                                    {f.status !== 'paid' && (
                                        <button className="btn btn-success btn-sm" onClick={() => { setPayModalOpen(f); setPayAmount(String(f.amount - f.paidAmount)); }}>
                                            <CreditCard size={14} /> Pay
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {fees.length === 0 && (
                            <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No fees found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Payment Modal */}
            {payModalOpen && (
                <div className="modal-overlay" onClick={() => setPayModalOpen(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Record Payment</h3>
                            <button className="modal-close" onClick={() => setPayModalOpen(null)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                {payModalOpen.description} — Balance: <strong>${(payModalOpen.amount - payModalOpen.paidAmount).toLocaleString()}</strong>
                            </p>
                            <div className="form-group">
                                <label>Payment Amount</label>
                                <input className="form-control" type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} min={1} max={payModalOpen.amount - payModalOpen.paidAmount} />
                            </div>
                            <div className="form-group">
                                <label>Payment Method</label>
                                <select className="form-control" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                                    <option value="online">Online</option>
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="cheque">Cheque</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setPayModalOpen(null)}>Cancel</button>
                            <button className="btn btn-success" onClick={() => handlePayment(payModalOpen.id)}>
                                <CreditCard size={16} /> Confirm Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Fee Modal */}
            {createModalOpen && (
                <div className="modal-overlay" onClick={() => setCreateModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create Fee</h3>
                            <button className="modal-close" onClick={() => setCreateModalOpen(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreateFee}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Student</label>
                                    <select className="form-control" value={newFee.studentId} onChange={e => setNewFee({ ...newFee, studentId: e.target.value })} required>
                                        <option value="">Select student...</option>
                                        {students.map(s => <option key={s.id} value={s.id}>{s.rollNo} — {s.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <input className="form-control" value={newFee.description} onChange={e => setNewFee({ ...newFee, description: e.target.value })} required placeholder="e.g. Tuition Fee - Fall 2024" />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Type</label>
                                        <select className="form-control" value={newFee.type} onChange={e => setNewFee({ ...newFee, type: e.target.value })}>
                                            <option value="tuition">Tuition</option>
                                            <option value="library">Library</option>
                                            <option value="laboratory">Laboratory</option>
                                            <option value="hostel">Hostel</option>
                                            <option value="transport">Transport</option>
                                            <option value="exam">Exam</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Amount</label>
                                        <input className="form-control" type="number" min={1} value={newFee.amount} onChange={e => setNewFee({ ...newFee, amount: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Due Date</label>
                                    <input className="form-control" type="date" value={newFee.dueDate} onChange={e => setNewFee({ ...newFee, dueDate: e.target.value })} required />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setCreateModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Fee</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
