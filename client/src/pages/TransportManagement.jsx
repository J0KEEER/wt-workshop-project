import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
    Bus, MapPin, Navigation, Clock, UserCheck, 
    Calendar, ShieldCheck, Map, Settings, Plus, Users, 
    ChevronRight, ArrowRightLeft, Radio, Info,
    TramFront, Route, Zap, LocateFixed, ShieldAlert,
    UserPlus, Heart, History
} from 'lucide-react';
import { ModalOverlay, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';

export default function TransportManagement() {
    const { user } = useAuth();
    const [routes, setRoutes] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mySubscription, setMySubscription] = useState(null);
    const [showSubModal, setShowSubModal] = useState(false);
    const [selectedStop, setSelectedStop] = useState(null);
    const [subData, setSubData] = useState({
        startDate: new Date().toISOString().split('T')[0],
        vehicleId: ''
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const rRes = await api.get('/transport/routes');
            setRoutes(rRes.data);

            if (user.role === 'admin' || user.role === 'faculty') {
                const vRes = await api.get('/transport/vehicles');
                setVehicles(vRes.data);
            } else {
                const sRes = await api.get('/transport/my-subscription');
                setMySubscription(sRes.data);
                // Also fetch vehicles for student to choose
                const vRes = await api.get('/transport/vehicles');
                setVehicles(vRes.data);
            }
        } catch (error) {
            console.error('Failed to fetch transport data:', error);
        } finally {
            setLoading(false);
        }
    }, [user.role]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubscribe = async (e) => {
        e.preventDefault();
        try {
            await api.post('/transport/subscribe', {
                ...subData,
                stopId: selectedStop.id
            });
            setShowSubModal(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to subscribe');
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div className="fade-in">
            <div className="hero-card" style={{ 
                background: 'linear-gradient(135deg, #1e1e2e 0%, #111119 100%)',
                padding: '44px',
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
                        <span style={{ color: 'var(--accent-light)', fontWeight: 800, letterSpacing: '2px', fontSize: '0.75rem' }}>GRID LOGISTICS</span>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <TramFront size={40} className="text-accent" strokeWidth={2.5} /> Fleet Command
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '12px', maxWidth: '600px', lineHeight: '1.6' }}>
                        Institutional mobility hub monitoring high-frequency campus routes, real-time vehicle telemetry, and personalized student commute waypoints.
                    </p>
                </div>
                <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.05 }}>
                    <Route size={320} strokeWidth={1} />
                </div>
            </div>

            {mySubscription && (
                <div className="card glass-morph fade-in shadow-accent" style={{ 
                    marginBottom: '40px', 
                    borderRadius: '28px',
                    border: '1px solid rgba(59, 130, 246, 0.2)', 
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(10, 10, 15, 0.4) 100%)'
                }}>
                    <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '32px', padding: '32px' }}>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '24px', borderRadius: '20px', color: '#3b82f6' }}>
                            <LocateFixed size={40} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Commute Authority Active</h3>
                                <div className="badge badge-info" style={{ padding: '8px 16px', fontSize: '0.7rem', fontWeight: 800, borderRadius: '12px', letterSpacing: '1px' }}>GRID-LOCKED</div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', color: 'var(--text-secondary)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Route size={18} className="text-accent" /> <strong>{mySubscription.stop?.route?.routeName?.toUpperCase()}</strong></div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><MapPin size={18} className="text-info" /> {mySubscription.stop?.stopName}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Clock size={18} className="text-warning" /> DEPARTURE: {mySubscription.stop?.pickupTime}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Bus size={18} className="text-accent" /> {mySubscription.vehicle?.vehicleNumber || 'PROVISIONING...'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div className="card glass-morph shadow-premium" style={{ borderRadius: '28px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="card-header" style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '32px',
                        background: 'rgba(255,255,255,0.02)',
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Route size={28} className="text-info" strokeWidth={2.5} /> Waypoint Infrastructure
                        </h3>
                        <div className="badge badge-outline" style={{ 
                            padding: '10px 20px', 
                            borderRadius: '12px', 
                            fontSize: '0.75rem', 
                            fontWeight: 800, 
                            letterSpacing: '1.5px', 
                            borderColor: 'rgba(255,255,255,0.1)' 
                        }}>{routes.length} ACTIVE PATHWAYS</div>
                    </div>
                    <div className="card-body" style={{ padding: '32px' }}>
                        {routes.map(route => (
                            <div key={route.id} className="hover-row glass-morph fade-in" style={{ 
                                marginBottom: '32px', 
                                borderRadius: '24px', 
                                padding: '32px', 
                                background: 'rgba(255,255,255,0.01)',
                                border: '1px solid rgba(255,255,255,0.03)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <div>
                                        <div style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{route.routeName}</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 500, opacity: 0.8 }}>{route.description}</div>
                                    </div>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '20px', 
                                        background: 'rgba(var(--accent-rgb), 0.05)', 
                                        padding: '12px 24px', 
                                        borderRadius: '16px', 
                                        fontSize: '0.85rem', 
                                        color: 'var(--accent-light)', 
                                        border: '1px solid rgba(var(--accent-rgb), 0.15)',
                                        fontWeight: 800
                                    }}>
                                        <span>{route.startPoint?.toUpperCase()}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor', opacity: 0.3 }}></div>
                                            <ArrowRightLeft size={16} />
                                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor', opacity: 0.3 }}></div>
                                        </div>
                                        <span>{route.endPoint?.toUpperCase()}</span>
                                    </div>
                                </div>
                                
                                <div className="table-wrapper glass-morph" style={{ border: 'none', background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: '20px' }}>
                                    <table style={{ background: 'transparent' }}>
                                        <thead>
                                            <tr style={{ background: 'transparent' }}>
                                                <th style={{ paddingLeft: '24px' }}>DESTINATION</th>
                                                <th>PICKUP</th>
                                                <th>DROPOFF</th>
                                                <th>RATE (MONTHLY)</th>
                                                <th style={{ textAlign: 'right', paddingRight: '24px' }}>ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {route.stops?.map(stop => (
                                                <tr key={stop.id} className="hover-row">
                                                    <td style={{ paddingLeft: '24px' }}><div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{stop.stopName}</div></td>
                                                    <td><div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}><Clock size={16} className="text-warning" /> {stop.pickupTime}</div></td>
                                                    <td><div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}><Clock size={16} className="text-info" /> {stop.dropoffTime}</div></td>
                                                    <td style={{ fontWeight: 900, color: 'var(--accent-light)', fontSize: '1rem' }}>${stop.monthlyFee}</td>
                                                    <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                                                        {user.role === 'student' && !mySubscription && (
                                                            <button 
                                                                onClick={() => { setSelectedStop(stop); setShowSubModal(true); }}
                                                                className="btn btn-primary btn-sm shadow-accent"
                                                                style={{ borderRadius: '12px', padding: '8px 20px', fontWeight: 800 }}
                                                            >
                                                                SUBSCRIBE
                                                            </button>
                                                        )}
                                                        {user.role === 'student' && mySubscription?.stopId === stop.id && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', color: 'var(--success)', fontWeight: 800, fontSize: '0.7rem' }}>
                                                                <LocateFixed size={14} /> ACTIVE STATION
                                                            </div>
                                                        )}
                                                        {user.role === 'admin' && (
                                                            <button className="btn-icon text-accent" style={{ background: 'transparent' }}><Settings size={18} /></button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card glass-morph shadow-premium" style={{ borderRadius: '32px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="card-header" style={{ padding: '32px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Radio size={28} className="text-success" strokeWidth={2.5} /> Real-Time Telemetry Grid
                        </h3>
                    </div>
                    <div className="card-body" style={{ padding: '32px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px' }}>
                            {vehicles.map(v => (
                                <div key={v.id} className="hover-row glass-morph fade-in" style={{ 
                                    padding: '28px', 
                                    borderRadius: '28px', 
                                    border: '1px solid rgba(255,255,255,0.05)', 
                                    position: 'relative',
                                    background: 'rgba(255,255,255,0.02)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ 
                                                background: 'rgba(var(--accent-rgb), 0.1)', 
                                                color: 'var(--accent-light)', 
                                                padding: '12px', 
                                                borderRadius: '16px',
                                                boxShadow: 'var(--accent-glow)'
                                            }}>
                                                <Bus size={28} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{v.vehicleNumber}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '2px' }}>UNIT ID-{(v.id?.substring(0, 5) || 'ALPHA')?.toUpperCase()}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div className={`status-dot ${v.status === 'active' ? 'status-online' : 'status-offline'}`}></div>
                                            <span style={{ 
                                                fontSize: '0.7rem', 
                                                fontWeight: 800, 
                                                color: v.status === 'active' ? 'var(--success)' : 'var(--warning)',
                                                letterSpacing: '1px'
                                            }}>{v.status?.toUpperCase()}</span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.15)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><UserCheck size={18} className="text-info" /> <span style={{ flex: 1, fontWeight: 500 }}>Assigned Pilot:</span> <strong style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{v.driverName}</strong></div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}><ShieldCheck size={18} className="text-accent" /> <span style={{ flex: 1, fontWeight: 500 }}>Secure Link:</span> <strong style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{v.driverContact}</strong></div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}><Users size={18} className="text-warning" /> <span style={{ flex: 1, fontWeight: 500 }}>Occupancy Threshold:</span> <strong style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{v.capacity} PAX</strong></div>
                                    </div>
                                </div>
                            ))}
                            {user.role === 'admin' && (
                                <div className="hover-row glass-morph shadow-accent" style={{ 
                                    border: '2px dashed rgba(var(--accent-rgb), 0.3)', 
                                    background: 'rgba(var(--accent-rgb), 0.02)', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    minHeight: '220px', 
                                    color: 'var(--accent-light)', 
                                    borderRadius: '28px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ background: 'rgba(var(--accent-rgb), 0.1)', padding: '20px', borderRadius: '50%', marginBottom: '16px' }}>
                                        <Plus size={40} className="text-accent" />
                                    </div>
                                    <span style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '1px' }}>ENLIST COMMAND UNIT</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ModalOverlay isOpen={showSubModal} onClose={() => setShowSubModal(false)}>
                <ModalHeader title={`Route Subscription: ${selectedStop?.stopName}`} onClose={() => setShowSubModal(false)} icon={Navigation} />
                <form onSubmit={handleSubscribe}>
                    <ModalBody>
                        <div style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Recurring Monthly Commitment</span>
                                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#3b82f6' }}>${selectedStop?.monthlyFee}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Info size={12} /> This premium will be automatically consolidated into your monthly institutional bill.
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Subscription Activation Date</label>
                            <input 
                                type="date" 
                                className="form-control" 
                                required 
                                value={subData.startDate}
                                onChange={e => setSubData({...subData, startDate: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Preferred Fleet Unit (Optional)</label>
                            <select 
                                className="form-control"
                                value={subData.vehicleId}
                                onChange={e => setSubData({...subData, vehicleId: e.target.value})}
                            >
                                <option value="">Autonomous Assignment (Recommended)</option>
                                {vehicles.filter(v => v.status === 'active').map(v => (
                                    <option key={v.id} value={v.id}>{v.vehicleNumber} — pilot: {v.driverName}</option>
                                ))}
                            </select>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowSubModal(false)}>Cancel Request</button>
                        <button type="submit" className="btn btn-primary">Establish Subscription</button>
                    </ModalFooter>
                </form>
            </ModalOverlay>
        </div>
    );
}
