import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
    Users, Calendar, CreditCard, Plus,
    CheckCircle, XCircle, AlertCircle, Search, Clock, MapPin,
    DollarSign, Fingerprint
} from 'lucide-react';
import { ModalOverlay, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';

export default function Personnel() {
    const { user } = useAuth();
    const toast = useToast();
    const isAdmin = user.role === 'admin' || user.role === 'staff';

    const [staff, setStaff] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [payroll, setPayroll] = useState([]);
    const [schedule, setSchedule] = useState({ day: null, schedule: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(isAdmin ? 'staff-list' : 'my-leaves');
    const [search, setSearch] = useState('');

    const [salaryModal, setSalaryModal] = useState(null);
    const [leaveModal, setLeaveModal] = useState(false);
    const [payrollModal, setPayrollModal] = useState(false);

    const [newSalary, setNewSalary] = useState('');
    const [newLeave, setNewLeave] = useState({ type: 'casual', startDate: '', endDate: '', reason: '' });

    const fetchData = async () => {
        try {
            setLoading(true);
            if (isAdmin) {
                if (activeTab === 'staff-list') {
                    const res = await api.get('/personnel/staff');
                    setStaff(res.data);
                } else if (activeTab === 'leaves') {
                    const res = await api.get('/personnel/leaves');
                    setLeaves(res.data);
                } else if (activeTab === 'payroll') {
                    const res = await api.get('/personnel/payroll/my-pay');
                    setPayroll(res.data);
                }
            } else {
                if (activeTab === 'my-leaves') {
                    const res = await api.get('/personnel/leaves');
                    setLeaves(res.data);
                } else if (activeTab === 'my-pay') {
                    const res = await api.get('/personnel/payroll/my-pay');
                    setPayroll(res.data);
                } else if (activeTab === 'my-schedule') {
                    const res = await api.get('/personnel/schedule');
                    setSchedule(res.data);
                }
            }
        } catch (err) {
            toast.error('Failed to load personnel data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handleUpdateSalary = async () => {
        try {
            await api.post(`/personnel/staff/${salaryModal.id}/salary`, { baseSalary: parseFloat(newSalary) });
            toast.success('Salary updated');
            setSalaryModal(null);
            fetchData();
        } catch (err) {
            toast.error('Error updating salary');
        }
    };

    const handleRequestLeave = async (e) => {
        e.preventDefault();
        try {
            await api.post('/personnel/leaves', newLeave);
            toast.success('Leave request submitted!');
            setLeaveModal(false);
            setNewLeave({ type: 'casual', startDate: '', endDate: '', reason: '' });
            fetchData();
        } catch (err) {
            toast.error('Error submitting leave');
        }
    };

    const handleLeaveAction = async (id, status) => {
        try {
            await api.patch(`/personnel/leaves/${id}`, { status });
            toast.success(`Leave ${status}`);
            fetchData();
        } catch (err) {
            toast.error('Error updating leave status');
        }
    };

    const handleGeneratePayroll = async () => {
        try {
            const today = new Date();
            await api.post('/personnel/payroll/generate', {
                month: today.getMonth() + 1,
                year: today.getFullYear()
            });
            toast.info('Payroll generation process started');
            setPayrollModal(false);
            fetchData();
        } catch (err) {
            toast.error('Error generating payroll');
        }
    };

    const filteredStaff = staff.filter(s =>
        s.firstName.toLowerCase().includes(search.toLowerCase()) ||
        s.lastName?.toLowerCase().includes(search.toLowerCase()) ||
        s.username.toLowerCase().includes(search.toLowerCase())
    );

    if (loading && staff.length === 0 && leaves.length === 0 && payroll.length === 0) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div className="fade-in">
            {/* Navigation Tabs */}
            <div className="tab-container">
                {isAdmin ? (
                    <button className={`tab-item ${activeTab === 'staff-list' ? 'active' : ''}`} onClick={() => setActiveTab('staff-list')}>
                        <Users size={18} /> Staff Directory
                    </button>
                ) : null}
                <button className={`tab-item ${activeTab === 'leaves' || activeTab === 'my-leaves' ? (isAdmin ? 'active' : '') : ''}`} onClick={() => setActiveTab(isAdmin ? 'leaves' : 'my-leaves')}>
                    <Calendar size={18} /> {isAdmin ? 'Leave Reviews' : 'Personal Leaves'}
                </button>
                <button className={`tab-item ${activeTab === 'payroll' || activeTab === 'my-pay' ? (isAdmin ? 'active' : '') : ''}`} onClick={() => setActiveTab(isAdmin ? 'payroll' : 'my-pay')}>
                    <DollarSign size={18} /> Financial History
                </button>
                {!isAdmin && user.role === 'faculty' && (
                    <button className={`tab-item ${activeTab === 'my-schedule' ? 'active' : ''}`} onClick={() => setActiveTab('my-schedule')}>
                        <Clock size={18} /> Academic Schedule
                    </button>
                )}
            </div>

            <div className="page-body" style={{ paddingTop: '24px' }}>
                {/* Staff List */}
                {activeTab === 'staff-list' && (
                    <>
                        <div className="toolbar" style={{ marginBottom: '20px' }}>
                            <div className="search-box">
                                <Search size={16} />
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search by name or username..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <span className="badge badge-info">{filteredStaff.length} Active Personnel</span>
                        </div>

                        {filteredStaff.length > 0 ? (
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Professional</th>
                                            <th>Institutional Role</th>
                                            <th>Department</th>
                                            <th>Base Salary</th>
                                            <th>Operations</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStaff.map(s => (
                                            <tr key={s.id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{
                                                            width: '36px', height: '36px', borderRadius: 'var(--radius-full)',
                                                            background: 'var(--accent-subtle)', color: 'var(--accent-light)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: '0.75rem', fontWeight: 600, flexShrink: 0
                                                        }}>
                                                            {s.firstName[0]}{s.lastName ? s.lastName[0] : ''}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</div>
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {s.username}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td><span className="badge badge-info">{s.role}</span></td>
                                                <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                                                    {s.facultyProfile?.department || 'Administration'}
                                                </td>
                                                <td style={{ fontWeight: 600 }}>${(s.baseSalary || 0).toLocaleString()}</td>
                                                <td>
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => { setSalaryModal(s); setNewSalary(s.baseSalary || 0); }}
                                                        title="Adjust Compensation"
                                                    >
                                                        <TrendingUp size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <Users size={48} />
                                <h3>No Personnel Records</h3>
                                <p>No staff members match your search.</p>
                            </div>
                        )}
                    </>
                )}

                {/* Leaves Tab */}
                {(activeTab === 'leaves' || activeTab === 'my-leaves') && (
                    <>
                        <div style={{ marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Leave Registry</h2>
                        </div>
                        {leaves.length > 0 ? (
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            {isAdmin && <th>Staff Member</th>}
                                            <th>Leave Type</th>
                                            <th>Duration</th>
                                            <th>Reason</th>
                                            <th>Status</th>
                                            {isAdmin && <th>Review</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaves.map(l => (
                                            <tr key={l.id}>
                                                {isAdmin && (
                                                    <td>
                                                        <div style={{ fontWeight: 600 }}>{l.user?.firstName} {l.user?.lastName}</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{l.user?.role}</div>
                                                    </td>
                                                )}
                                                <td><span className="badge badge-default">{l.type}</span></td>
                                                <td>
                                                    <div style={{ fontWeight: 500 }}>{l.startDate}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>→ {l.endDate}</div>
                                                </td>
                                                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.reason}</td>
                                                <td>
                                                    {l.status === 'approved' ? (
                                                        <span className="badge badge-success">Approved</span>
                                                    ) : l.status === 'rejected' ? (
                                                        <span className="badge badge-danger">Rejected</span>
                                                    ) : (
                                                        <span className="badge badge-warning">Pending</span>
                                                    )}
                                                </td>
                                                {isAdmin && (
                                                    <td>
                                                        {l.status === 'pending' ? (
                                                            <div className="btn-group">
                                                                <button className="btn btn-success btn-sm" onClick={() => handleLeaveAction(l.id, 'approved')}>
                                                                    <CheckCircle size={14} />
                                                                </button>
                                                                <button className="btn btn-danger btn-sm" onClick={() => handleLeaveAction(l.id, 'rejected')}>
                                                                    <XCircle size={14} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Archived</span>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <Calendar size={48} />
                                <h3>No Leave Records</h3>
                                <p>No leave requests have been submitted.</p>
                            </div>
                        )}
                    </>
                )}

                {/* Payroll Tab */}
                {(activeTab === 'payroll' || activeTab === 'my-pay') && (
                    <>
                        <div style={{ marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Payroll History</h2>
                        </div>
                        {payroll.length > 0 ? (
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Period</th>
                                            <th style={{ textAlign: 'right' }}>Base Salary</th>
                                            <th style={{ textAlign: 'right' }}>Deductions</th>
                                            <th style={{ textAlign: 'right' }}>Net Pay</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payroll.map(p => (
                                            <tr key={p.id}>
                                                <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                                                    {p.month.toString().padStart(2, '0')}/{p.year}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>${p.baseSalary.toLocaleString()}</td>
                                                <td style={{ textAlign: 'right', color: 'var(--danger)' }}>-${p.deductions.toLocaleString()}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 600, fontSize: '1.05rem' }}>${p.netPay.toLocaleString()}</td>
                                                <td>
                                                    {p.status === 'paid' ? (
                                                        <span className="badge badge-success">Paid</span>
                                                    ) : (
                                                        <span className="badge badge-warning">Pending</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <CreditCard size={48} />
                                <h3>No Payroll Records</h3>
                                <p>No payroll entries found.</p>
                            </div>
                        )}
                    </>
                )}

                {/* Schedule Tab (Faculty only) */}
                {activeTab === 'my-schedule' && (
                    <>
                        <div className="toolbar" style={{ marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Today's Schedule</h2>
                            <span className="badge badge-info">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                            </span>
                        </div>

                        {schedule.schedule.length === 0 ? (
                            <div className="empty-state">
                                <Clock size={48} />
                                <h3>No Classes Today</h3>
                                <p>No classes are assigned for the remainder of this cycle.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                                {schedule.schedule.map((session, idx) => (
                                    <div key={idx} className="card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                            <div style={{
                                                width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
                                                background: 'var(--accent-subtle)', color: 'var(--accent-light)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <Clock size={24} />
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{session.startTime} — {session.endTime}</div>
                                            </div>
                                        </div>

                                        <h4 style={{ margin: '0 0 12px 0', fontSize: '1.1rem' }}>{session.courseName}</h4>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                                            <span className="badge badge-default" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Fingerprint size={12} /> {session.courseCode}
                                            </span>
                                            <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <MapPin size={12} /> {session.room || 'Main Hall'}
                                            </span>
                                        </div>

                                        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                            Start Attendance
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Salary Modal */}
            {salaryModal && (
                <ModalOverlay isOpen={!!salaryModal} onClose={() => setSalaryModal(null)}>
                    <div className="modal-content">
                        <ModalHeader title="Adjust Salary" onClose={() => setSalaryModal(null)} />
                        <ModalBody>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: 'var(--radius-full)',
                                    background: 'var(--accent-subtle)', color: 'var(--accent-light)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600
                                }}>
                                    {salaryModal?.firstName[0]}
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Staff Member</div>
                                    <div style={{ fontWeight: 600 }}>{salaryModal?.firstName} {salaryModal?.lastName}</div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>New Monthly Base (USD)</label>
                                <input
                                    className="form-control"
                                    type="number"
                                    value={newSalary}
                                    onChange={e => setNewSalary(e.target.value)}
                                />
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <button className="btn btn-secondary" onClick={() => setSalaryModal(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleUpdateSalary}>Apply Changes</button>
                        </ModalFooter>
                    </div>
                </ModalOverlay>
            )}

            {/* Leave Request Modal */}
            <ModalOverlay isOpen={leaveModal} onClose={() => setLeaveModal(false)}>
                <div className="modal-content">
                    <ModalHeader title="Request Leave" onClose={() => setLeaveModal(false)} />
                    <form onSubmit={handleRequestLeave}>
                        <ModalBody>
                            <div className="form-group">
                                <label>Leave Type</label>
                                <select className="form-control" value={newLeave.type} onChange={e => setNewLeave({ ...newLeave, type: e.target.value })}>
                                    <option value="casual">Casual</option>
                                    <option value="sick">Sick</option>
                                    <option value="annual">Annual</option>
                                    <option value="unpaid">Unpaid</option>
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Start Date</label>
                                    <input type="date" className="form-control" value={newLeave.startDate} onChange={e => setNewLeave({ ...newLeave, startDate: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>End Date</label>
                                    <input type="date" className="form-control" value={newLeave.endDate} onChange={e => setNewLeave({ ...newLeave, endDate: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Reason</label>
                                <textarea className="form-control" placeholder="Reason for leave..." value={newLeave.reason} onChange={e => setNewLeave({ ...newLeave, reason: e.target.value })} required />
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} type="submit">Submit Request</button>
                        </ModalFooter>
                    </form>
                </div>
            </ModalOverlay>

            {/* Payroll Generation Modal */}
            <ModalOverlay isOpen={payrollModal} onClose={() => setPayrollModal(false)}>
                <div className="modal-content">
                    <div style={{ padding: '32px', textAlign: 'center' }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: 'var(--radius-lg)',
                            background: 'var(--accent-subtle)', color: 'var(--accent-light)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 20px'
                        }}>
                            <CreditCard size={36} />
                        </div>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', fontWeight: 700 }}>Generate Payroll?</h3>
                        <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)' }}>
                            This will process payroll for <strong>{new Date().toLocaleString('default', { month: 'long' })} {new Date().getFullYear()}</strong>
                        </p>
                        <div className="btn-group" style={{ width: '100%' }}>
                            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setPayrollModal(false)}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleGeneratePayroll}>Confirm & Run</button>
                        </div>
                    </div>
                </div>
            </ModalOverlay>
        </div>
    );
}
