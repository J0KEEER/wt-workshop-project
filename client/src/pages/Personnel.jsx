import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
    Users, Calendar, CreditCard, Plus, 
    CheckCircle, XCircle, AlertCircle, TrendingUp, Search, Clock, MapPin,
    Briefcase, DollarSign, Fingerprint, ChevronRight, UserCheck
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
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="fade-in space-y-6">
            {/* Premium HR Hero Card */}
            <div className="card hero-card overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Briefcase size={160} />
                </div>
                <div className="card-body relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                    <Users className="text-white" size={24} />
                                </div>
                                <h1 className="text-3xl font-bold text-white m-0 tracking-tight">Administrative Operations</h1>
                            </div>
                            <p className="text-white/80 max-w-2xl text-lg leading-relaxed">
                                {isAdmin 
                                    ? 'Command center for institutional human capital. Orchestrate staff deployments, review leave transitions, and supervise payroll integrity.' 
                                    : 'Institutional personnel portal. Access your professional engagements, track attendance metrics, and manage benefit transitions.'}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            {!isAdmin ? (
                                <button className="btn bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-md" onClick={() => setLeaveModal(true)}>
                                    <Plus size={18} /> <span className="ml-2">Request Leave</span>
                                </button>
                            ) : (
                                activeTab === 'staff-list' && (
                                    <button className="btn bg-white text-primary hover:bg-white/90 shadow-xl" onClick={() => setPayrollModal(true)}>
                                        <CreditCard size={18} /> <span className="ml-2">Run Payroll Cycle</span>
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="tab-container glass-morph p-1">
                {isAdmin ? (
                    <div className="flex gap-1">
                        <button onClick={() => setActiveTab('staff-list')} className={`tab-item px-6 py-3 rounded-xl transition-all flex items-center gap-2 ${activeTab === 'staff-list' ? 'active bg-primary text-white shadow-lg' : 'hover:bg-white/5'}`}>
                            <Users size={18} /> Staff Directory
                        </button>
                        <button onClick={() => setActiveTab('leaves')} className={`tab-item px-6 py-3 rounded-xl transition-all flex items-center gap-2 ${activeTab === 'leaves' ? 'active bg-primary text-white shadow-lg' : 'hover:bg-white/5'}`}>
                            <Calendar size={18} /> Leave Reviews
                        </button>
                        <button onClick={() => setActiveTab('payroll')} className={`tab-item px-6 py-3 rounded-xl transition-all flex items-center gap-2 ${activeTab === 'payroll' ? 'active bg-primary text-white shadow-lg' : 'hover:bg-white/5'}`}>
                            <DollarSign size={18} /> Financial History
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-1">
                        {user.role === 'faculty' && (
                            <button onClick={() => setActiveTab('my-schedule')} className={`tab-item px-6 py-3 rounded-xl transition-all flex items-center gap-2 ${activeTab === 'my-schedule' ? 'active bg-primary text-white shadow-lg' : 'hover:bg-white/5'}`}>
                                <Clock size={18} /> Academic Schedule
                            </button>
                        )}
                        <button onClick={() => setActiveTab('my-leaves')} className={`tab-item px-6 py-3 rounded-xl transition-all flex items-center gap-2 ${activeTab === 'my-leaves' ? 'active bg-primary text-white shadow-lg' : 'hover:bg-white/5'}`}>
                            <Calendar size={18} /> Personal Leaves
                        </button>
                        <button onClick={() => setActiveTab('my-pay')} className={`tab-item px-6 py-3 rounded-xl transition-all flex items-center gap-2 ${activeTab === 'my-pay' ? 'active bg-primary text-white shadow-lg' : 'hover:bg-white/5'}`}>
                            <CreditCard size={18} /> Compensation
                        </button>
                    </div>
                )}
            </div>

            <div className="content-area mt-6">
                {activeTab === 'staff-list' && (
                    <div className="glass-morph rounded-2xl border border-white/10 overflow-hidden shadow-2xl transition-all hover:shadow-primary/5">
                        <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="relative w-full md:w-96 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search by name, ID or role..." 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all backdrop-blur-md"
                                    value={search} 
                                    onChange={e => setSearch(e.target.value)} 
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="bg-primary/20 text-primary-light px-4 py-1.5 rounded-full text-sm font-semibold border border-primary/20">
                                    {filteredStaff.length} Active Personnel
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white/5">
                                        <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-white/60">Professional</th>
                                        <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-white/60">Institutional Role</th>
                                        <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-white/60">Department</th>
                                        <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-white/60 text-right">Base Salary</th>
                                        <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-white/60">Operations</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredStaff.map(s => (
                                        <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center text-white font-bold border border-white/20">
                                                        {s.firstName[0]}{s.lastName ? s.lastName[0] : ''}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white group-hover:text-primary-light transition-colors">{s.firstName} {s.lastName}</div>
                                                        <div className="text-xs text-white/40 font-mono tracking-tighter">ID: {s.username.toUpperCase()}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="px-3 py-1 bg-primary/10 text-primary-light rounded-lg text-xs font-bold uppercase tracking-widest border border-primary/20">
                                                    {s.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-white/70">
                                                <div className="flex items-center gap-2">
                                                    <Briefcase size={14} className="text-white/30" />
                                                    {s.facultyProfile?.department || 'Administration'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right font-bold text-accent-light">
                                                ${(s.baseSalary || 0).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-5">
                                                <button 
                                                    className="p-2 bg-white/5 hover:bg-primary/20 text-white/60 hover:text-primary rounded-lg transition-all border border-white/10 hover:border-primary/30"
                                                    onClick={() => { setSalaryModal(s); setNewSalary(s.baseSalary || 0); }}
                                                    title="Adjust Compensation"
                                                >
                                                    <TrendingUp size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {filteredStaff.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                <Users size={64} className="mb-4" />
                                <h3 className="text-xl font-bold">No Personnel Records</h3>
                                <p className="text-white/60">No staff members match your current institutional criteria.</p>
                            </div>
                        )}
                    </div>
                )}

                {(activeTab === 'leaves' || activeTab === 'my-leaves') && (
                    <div className="glass-morph rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="text-xl font-bold text-white m-0">Institutional Leave Registry</h3>
                            <button className="text-white/40 hover:text-primary transition-colors">
                                <AlertCircle size={20} />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white/2">
                                        {isAdmin && <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-white/60">Staff Member</th>}
                                        <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-white/60">Leave Type</th>
                                        <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-white/60">Duration</th>
                                        <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-white/60">Protocol</th>
                                        <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-white/60">Outcome</th>
                                        {isAdmin && <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-white/60">Review</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {leaves.map(l => (
                                        <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                                            {isAdmin && (
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-white">{l.user?.firstName} {l.user?.lastName}</div>
                                                    <div className="text-xs text-white/40 uppercase tracking-widest">{l.user?.role}</div>
                                                </td>
                                            )}
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-white/10 rounded text-[10px] font-black uppercase text-white/80 border border-white/10">
                                                    {l.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white">{l.startDate}</span>
                                                    <span className="text-[10px] text-white/40 uppercase">to {l.endDate}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs text-sm text-white/60 truncate" title={l.reason}>{l.reason}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border w-fit ${
                                                    l.status === 'approved' ? 'bg-success/10 text-success border-success/20' : 
                                                    l.status === 'rejected' ? 'bg-danger/10 text-danger border-danger/20' : 
                                                    'bg-warning/10 text-warning border-warning/20'
                                                }`}>
                                                    <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                                                        l.status === 'approved' ? 'bg-success' : 
                                                        l.status === 'rejected' ? 'bg-danger' : 
                                                        'bg-warning'
                                                    }`}></div>
                                                    {l.status}
                                                </div>
                                            </td>
                                            {isAdmin && (
                                                <td className="px-6 py-4">
                                                    {l.status === 'pending' ? (
                                                        <div className="flex gap-2">
                                                            <button 
                                                                className="h-8 w-8 flex items-center justify-center bg-success/20 hover:bg-success text-success hover:text-white rounded-lg transition-all border border-success/30" 
                                                                onClick={() => handleLeaveAction(l.id, 'approved')}
                                                            >
                                                                <CheckCircle size={14} />
                                                            </button>
                                                            <button 
                                                                className="h-8 w-8 flex items-center justify-center bg-danger/20 hover:bg-danger text-danger hover:text-white rounded-lg transition-all border border-danger/30" 
                                                                onClick={() => handleLeaveAction(l.id, 'rejected')}
                                                            >
                                                                <XCircle size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-black uppercase text-white/20 tracking-widest bg-white/5 px-2 py-1 rounded">Archived</span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {(activeTab === 'payroll' || activeTab === 'my-pay') && (
                    <div className="glass-morph rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="text-xl font-bold text-white m-0">Compensation Registry</h3>
                            <div className="p-2 bg-accent/20 rounded-lg text-accent-light">
                                <DollarSign size={20} />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white/2">
                                        <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-white/60">Financial Period</th>
                                        <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-white/60 text-right">Base Statement</th>
                                        <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-white/60 text-right">Adjustments</th>
                                        <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-white/60 text-right">Net Disbursement</th>
                                        <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-white/60">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {payroll.map(p => (
                                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-white flex items-center gap-2">
                                                    <Calendar size={14} className="text-white/30" />
                                                    {p.month.toString().padStart(2, '0')}/{p.year}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-white/70">${p.baseSalary.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right text-danger font-medium opacity-80">-${p.deductions.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-lg font-black text-white group-hover:text-accent-light transition-colors">
                                                    ${p.netPay.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-tighter w-fit ${
                                                    p.status === 'paid' ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'
                                                }`}>
                                                    {p.status}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'my-schedule' && (
                    <div className="space-y-6">
                        <div className="glass-morph p-6 rounded-2xl border border-white/10 flex justify-between items-center shadow-xl">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1">Elite Engagement Summary</h3>
                                <p className="text-white/50 text-sm">Professional deployment metrics for localized faculty operations.</p>
                            </div>
                            <div className="bg-primary/20 text-primary-light px-5 py-2 rounded-xl font-black text-sm border border-primary/20 shadow-inner">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
                            </div>
                        </div>
                        
                        {schedule.schedule.length === 0 ? (
                            <div className="glass-morph py-24 rounded-3xl border border-white/10 flex flex-col items-center justify-center opacity-40 grayscale group hover:grayscale-0 transition-all hover:opacity-70">
                                <Clock size={80} className="mb-6 group-hover:scale-110 transition-transform duration-500" />
                                <h3 className="text-2xl font-bold mb-2 tracking-tight">Zero Professional Engagements</h3>
                                <p className="text-white/60">Your localized academic schedule is currently unassigned for the remainder of this cycle.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-12">
                                {schedule.schedule.map((session, idx) => (
                                    <div key={idx} className="glass-morph p-8 rounded-3xl border border-white/10 relative overflow-hidden group hover:border-primary/50 transition-all duration-500 shadow-xl hover:-translate-y-2">
                                        <div className="absolute top-0 right-0 p-4 transform translate-x-1/2 -translate-y-1/2 transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110">
                                            <div className="h-32 w-32 bg-primary/5 rounded-full blur-3xl"></div>
                                        </div>
                                        
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-8">
                                                <div className="h-14 w-14 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500">
                                                    <Clock size={28} />
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-1">
                                                        Temporal Window
                                                    </div>
                                                    <div className="text-2xl font-black text-white">
                                                        {session.startTime} — {session.endTime}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mb-8">
                                                <h4 className="text-2xl font-bold text-white mb-2 leading-tight group-hover:text-primary transition-colors">{session.courseName}</h4>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                                                        <Fingerprint size={12} /> {session.courseCode}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-success text-xs font-bold uppercase tracking-widest bg-success/10 px-2 py-1 rounded border border-success/20">
                                                        <MapPin size={12} /> {session.room || 'Main Hall'}
                                                    </div>
                                                </div>
                                            </div>

                                            <button className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-black uppercase tracking-[0.15em] text-sm rounded-2xl shadow-xl hover:shadow-primary/40 transition-all active:scale-95 flex items-center justify-center group/btn">
                                                Init Attendance Protocol
                                                <ChevronRight size={18} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Premium Salary Adjustment Modal */}
            <ModalOverlay isOpen={!!salaryModal} onClose={() => setSalaryModal(null)}>
                <div className="bg-[#0f172a]/90 backdrop-blur-2xl rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl max-w-lg w-full">
                    <ModalHeader title="Financial Readjustment" onClose={() => setSalaryModal(null)} />
                    <ModalBody>
                        <div className="flex items-center gap-4 mb-8 p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black border border-primary/20">
                                {salaryModal?.firstName[0]}
                            </div>
                            <div>
                                <div className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-0.5">Recalibrating Personnel</div>
                                <div className="text-lg font-bold text-white">{salaryModal?.firstName} {salaryModal?.lastName}</div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">New Monthly Base Statements (USD)</label>
                            <div className="relative group">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={24} />
                                <input 
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-2xl font-black text-white focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-white/10 shadow-inner" 
                                    type="number" 
                                    value={newSalary} 
                                    placeholder="00.00"
                                    onChange={e => setNewSalary(e.target.value)} 
                                />
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <div className="flex gap-4 w-full">
                            <button className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white/60 font-bold rounded-2xl transition-all border border-white/10" onClick={() => setSalaryModal(null)}>Cancel</button>
                            <button className="flex-2 py-4 bg-primary hover:bg-primary-dark text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-primary/30 transition-all" onClick={handleUpdateSalary}>Apply Changes</button>
                        </div>
                    </ModalFooter>
                </div>
            </ModalOverlay>

            {/* Leave Request Modernized Modal */}
            <ModalOverlay isOpen={leaveModal} onClose={() => setLeaveModal(false)}>
                <div className="bg-[#0f172a]/95 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl max-w-xl w-full">
                    <ModalHeader title="Transition Proposal" onClose={() => setLeaveModal(false)} />
                    <form onSubmit={handleRequestLeave} className="p-2">
                        <ModalBody>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Modular Classification</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none" value={newLeave.type} onChange={e => setNewLeave({...newLeave, type: e.target.value})}>
                                        <option value="casual" className="bg-slate-900">Casual Transition</option>
                                        <option value="sick" className="bg-slate-900">Wellness Period</option>
                                        <option value="annual" className="bg-slate-900">Annual Recess</option>
                                        <option value="unpaid" className="bg-slate-900">Exceptional Unpaid</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Initiation</label>
                                        <input type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono" value={newLeave.startDate} onChange={e => setNewLeave({...newLeave, startDate: e.target.value})} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Termination</label>
                                        <input type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono" value={newLeave.endDate} onChange={e => setNewLeave({...newLeave, endDate: e.target.value})} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Justification Matrix</label>
                                    <textarea className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[120px] resize-none" placeholder="Provide strategic rationale for leave transition..." value={newLeave.reason} onChange={e => setNewLeave({...newLeave, reason: e.target.value})} required />
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <button className="w-full py-5 bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent-dark text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl hover:shadow-primary/50 transition-all active:scale-[0.98]" type="submit">Submit Proposal</button>
                        </ModalFooter>
                    </form>
                </div>
            </ModalOverlay>

            {/* Payroll Generation Premium Modal */}
            <ModalOverlay isOpen={payrollModal} onClose={() => setPayrollModal(false)}>
                <div className="bg-[#0f172a]/95 backdrop-blur-3xl rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl max-w-lg w-full p-8">
                    <div className="flex flex-col items-center py-10">
                        <div className="h-24 w-24 bg-gradient-to-tr from-accent to-primary rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl mb-8 animate-pulse">
                            <CreditCard size={48} />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-4 tracking-tighter">Initiate Fiscal Cycle?</h3>
                        <p className="text-center text-white/50 text-lg max-w-sm leading-relaxed mb-10">
                            Synchronize institutional base statements for <strong className="text-white font-bold">{new Date().toLocaleString('default', { month: 'long' })} {new Date().getFullYear()}</strong>. This action triggers batch disbursement calculations.
                        </p>
                        
                        <div className="w-full grid grid-cols-2 gap-4">
                            <button className="py-5 bg-white/5 hover:bg-white/10 text-white/60 font-black uppercase tracking-widest rounded-[1.5rem] transition-all border border-white/10" onClick={() => setPayrollModal(false)}>Abort</button>
                            <button className="py-5 bg-white text-primary hover:bg-white/90 font-black uppercase tracking-widest rounded-[1.5rem] transition-all shadow-xl" onClick={handleGeneratePayroll}>Confirm & Run</button>
                        </div>
                    </div>
                </div>
            </ModalOverlay>
        </div>
    );
}
