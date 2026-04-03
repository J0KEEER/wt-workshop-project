import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
    Home, Bed, Users, Plus, Trash2, CheckCircle, 
    XCircle, Info, Shield, Key, Building2, MapPin,
    ShieldCheck, Activity, Search, ShieldAlert, BedDouble, UserPlus
} from 'lucide-react';
import { ModalOverlay, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';

export default function HostelManagement() {
    const { user } = useAuth();
    const [hostels, setHostels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myAllocation, setMyAllocation] = useState(null);
    const [showAllocateModal, setShowAllocateModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [allocationData, setAllocationData] = useState({
        studentId: '',
        academicYear: new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString(),
        startDate: new Date().toISOString().split('T')[0]
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            if (user.role === 'admin' || user.role === 'faculty') {
                const res = await api.get('/hostels');
                setHostels(res.data);
            } else {
                const res = await api.get('/hostels/my-allocation');
                setMyAllocation(res.data);
                // Also fetch list for students to view availability
                const hRes = await api.get('/hostels');
                setHostels(hRes.data);
            }
        } catch (error) {
            console.error('Failed to fetch hostel data:', error);
        } finally {
            setLoading(false);
        }
    }, [user.role]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAllocate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/hostels/allocate', {
                ...allocationData,
                roomId: selectedRoom.id
            });
            setShowAllocateModal(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to allocate room');
        }
    };

    const handleVacate = async (allocationId) => {
        if (!window.confirm('Are you sure you want to vacate this student?')) return;
        try {
            await api.delete(`/hostels/allocate/${allocationId}`);
            fetchData();
        } catch (error) {
            alert('Failed to vacate room');
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div className="fade-in">
            <div className="hero-card" style={{ 
                background: 'linear-gradient(135deg, #1e1e2e 0%, #111119 100%)',
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
                        <span style={{ color: 'var(--accent-light)', fontWeight: 800, letterSpacing: '2px', fontSize: '0.75rem' }}>RESIDENTIAL OPERATIONS</span>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Building2 size={40} className="text-accent" strokeWidth={2.5} /> Campus Residency
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '12px', maxWidth: '600px', lineHeight: '1.6' }}>
                        Premium residential management portal coordinating student housing allocations, block logistics, and interactive maintenance registries.
                    </p>
                </div>
                <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.05 }}>
                    <MapPin size={300} strokeWidth={1} />
                </div>
            </div>

            {myAllocation && (
                <div className="card glass-morph fade-in shadow-accent" style={{ 
                    marginBottom: '40px', 
                    borderRadius: '28px',
                    border: '1px solid rgba(16, 185, 129, 0.2)', 
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(10, 10, 15, 0.4) 100%)'
                }}>
                    <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '32px', padding: '32px' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '24px', borderRadius: '20px', color: '#10b981' }}>
                            <ShieldCheck size={40} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Institutional Enrollment Confirmed</h3>
                                <div className="badge badge-success" style={{ padding: '8px 16px', fontSize: '0.7rem', fontWeight: 800, borderRadius: '12px', letterSpacing: '1px' }}>RESIDENT ACTIVE</div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px', color: 'var(--text-secondary)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Building2 size={18} className="text-accent" /> <strong>{myAllocation.room?.hostel?.name}</strong></div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><MapPin size={18} className="text-info" /> BLOCK {myAllocation.room?.hostel?.block}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Key size={18} className="text-warning" /> UNIT {myAllocation.room?.roomNumber}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><BedDouble size={18} className="text-accent" /> {myAllocation.room?.type?.toUpperCase()}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {hostels.map(hostel => (
                    <div key={hostel.id} className="card glass-morph fade-in" style={{ overflow: 'hidden', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="card-header" style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            padding: '32px', 
                            background: 'rgba(255,255,255,0.03)', 
                            borderBottom: '1px solid rgba(255,255,255,0.05)' 
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.5px' }}>{hostel.name} <span style={{ opacity: 0.5, fontWeight: 400 }}>|</span> BLOCK {hostel.block}</h3>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <span style={{ 
                                        textTransform: 'uppercase', 
                                        letterSpacing: '1.5px', 
                                        fontWeight: 800, 
                                        fontSize: '0.7rem', 
                                        color: 'var(--accent-light)' 
                                    }}>
                                        {hostel.type?.toUpperCase()}'S REGISTRY
                                    </span>
                                    <span style={{ opacity: 0.3 }}>|</span>
                                    <span style={{ opacity: 0.8, fontWeight: 500 }}>{hostel.description}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className={`status-dot ${hostel.status === 'active' ? 'status-online' : 'status-offline'}`}></div>
                                <span style={{ 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '1.5px', 
                                    fontSize: '0.7rem', 
                                    fontWeight: 800,
                                    color: hostel.status === 'active' ? 'var(--success)' : 'var(--warning)'
                                }}>
                                    {hostel.status}
                                </span>
                            </div>
                        </div>
                        <div className="card-body" style={{ padding: '32px' }}>
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                                gap: '32px' 
                            }}>
                                {hostel.rooms?.map(room => (
                                    <div key={room.id} className="hover-row glass-morph fade-in" style={{ 
                                        padding: '24px', 
                                        borderRadius: '24px', 
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        background: 'rgba(255,255,255,0.01)',
                                        position: 'relative'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                            <div>
                                                <div style={{ fontWeight: 900, fontSize: '1.4rem', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>UNIT {room.roomNumber}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, opacity: 0.6, marginTop: '2px' }}>FLOOR {room.floor}</div>
                                            </div>
                                            <span className={`badge ${room.status === 'available' ? 'badge-info' : room.status === 'full' ? 'badge-danger' : 'badge-warning'}`} style={{ 
                                                fontSize: '0.65rem', 
                                                textTransform: 'uppercase',
                                                padding: '6px 12px',
                                                borderRadius: '10px',
                                                letterSpacing: '0.5px'
                                            }}>
                                                {room.status}
                                            </span>
                                        </div>
                                        
                                        <div style={{ marginBottom: '24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                <BedDouble size={16} className="text-accent" />
                                                <span style={{ fontWeight: 700 }}>{room.type}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                                                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                                    <div style={{ 
                                                        height: '100%', 
                                                        width: `${((room.allocations?.length || 0) / room.capacity) * 100}%`, 
                                                        background: 'var(--accent)',
                                                        boxShadow: 'var(--accent-glow)'
                                                    }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                                                    {room.allocations?.length || 0} / {room.capacity}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {room.allocations?.map(alloc => (
                                                <div key={alloc.id} className="glass-morph" style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'center', 
                                                    background: 'rgba(255,255,255,0.03)', 
                                                    padding: '12px 16px', 
                                                    borderRadius: '14px', 
                                                    fontSize: '0.85rem',
                                                    border: '1px solid rgba(255,255,255,0.03)'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                                                        <span style={{ fontWeight: 700 }}>{alloc.student?.user?.name}</span>
                                                    </div>
                                                    {user.role === 'admin' && (
                                                        <button onClick={() => handleVacate(alloc.id)} className="btn-icon text-danger" title="Evict Record" style={{ background: 'transparent' }}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            
                                            {user.role === 'admin' && room.status === 'available' && (
                                                <button 
                                                    onClick={() => { setSelectedRoom(room); setShowAllocateModal(true); }}
                                                    className="btn btn-outline btn-sm shadow-accent" 
                                                    style={{ width: '100%', marginTop: '8px', justifyContent: 'center', padding: '10px', borderRadius: '12px', fontWeight: 700 }}
                                                >
                                                    <UserPlus size={16} /> ALLOCATE UNIT
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <ModalOverlay isOpen={showAllocateModal} onClose={() => setShowAllocateModal(false)}>
                <ModalHeader title={`Allocate Room ${selectedRoom?.roomNumber}`} onClose={() => setShowAllocateModal(false)} icon={Shield} />
                <form onSubmit={handleAllocate}>
                    <ModalBody>
                        <div className="form-group">
                            <label>Resident (Student ID)</label>
                            <input 
                                type="number" 
                                className="form-control" 
                                required 
                                value={allocationData.studentId}
                                onChange={e => setAllocationData({...allocationData, studentId: e.target.value})}
                                placeholder="Enter system Student ID"
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Academic Cycle</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    required 
                                    value={allocationData.academicYear}
                                    onChange={e => setAllocationData({...allocationData, academicYear: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Effective Date</label>
                                <input 
                                    type="date" 
                                    className="form-control" 
                                    required 
                                    value={allocationData.startDate}
                                    onChange={e => setAllocationData({...allocationData, startDate: e.target.value})}
                                />
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowAllocateModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Establish Allocation</button>
                    </ModalFooter>
                </form>
            </ModalOverlay>
        </div>
    );
}
