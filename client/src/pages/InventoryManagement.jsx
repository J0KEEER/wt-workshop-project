import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
    Package, Tools, Calendar, Plus, AlertCircle, CheckCircle, 
    Clock, Shield, Search, MapPin, Tag, Wrench, ChevronRight,
    Box, Settings2, Activity, Filter, HardDrive, Cpu, 
    ClipboardList, AlertTriangle, CheckSquare, Layers
} from 'lucide-react';
import { ModalOverlay, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';

export default function InventoryManagement() {
    const { user } = useAuth();
    const [assets, setAssets] = useState([]);
    const [maintenance, setMaintenance] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('assets');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modals
    const [showAddAssetModal, setShowAddAssetModal] = useState(false);
    const [showReportIssueModal, setShowReportIssueModal] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [aRes, mRes, bRes] = await Promise.all([
                api.get('/inventory'),
                api.get('/inventory/maintenance'),
                api.get('/inventory/bookings')
            ]);
            setAssets(aRes.data);
            setMaintenance(mRes.data);
            setBookings(bRes.data);
        } catch (error) {
            console.error('Failed to fetch inventory data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleReportIssue = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        try {
            await api.post('/inventory/maintenance', {
                assetId: selectedAsset.id,
                issue: formData.get('issue'),
                priority: formData.get('priority')
            });
            setShowReportIssueModal(false);
            fetchData();
        } catch (error) {
            alert('Failed to report issue');
        }
    };

    const handleBooking = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        try {
            await api.post('/inventory/bookings', {
                assetId: selectedAsset.id,
                startTime: formData.get('startTime'),
                endTime: formData.get('endTime'),
                purpose: formData.get('purpose')
            });
            setShowBookingModal(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to create booking');
        }
    };

    const resolveMaintenance = async (id) => {
        try {
            await api.put(`/inventory/maintenance/${id}/resolve`, {
                condition: 'Good',
                cost: 0
            });
            fetchData();
        } catch (error) {
            alert('Failed to resolve maintenance');
        }
    };

    const filteredAssets = assets.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div className="fade-in">
            {/* Hero Header */}
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
                        <span style={{ color: 'var(--accent-light)', fontWeight: 800, letterSpacing: '2px', fontSize: '0.75rem' }}>ASSET OPERATIONS</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <Box size={40} className="text-accent" strokeWidth={2.5} /> Central Inventory
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '12px', maxWidth: '600px', lineHeight: '1.6' }}>
                                Tier-1 institutional asset management coordinating equipment lifecycles, preventative maintenance registries, and high-frequency resource reservations.
                            </p>
                        </div>
                        {(user.role === 'admin' || user.role === 'staff') && (
                            <button 
                                className="btn btn-primary shadow-accent" 
                                style={{ borderRadius: '16px', padding: '12px 24px', fontWeight: 800, letterSpacing: '0.5px' }} 
                                onClick={() => setShowAddAssetModal(true)}
                            >
                                <Plus size={20} style={{ marginRight: '10px' }} /> ENLIST ASSET
                            </button>
                        )}
                    </div>
                </div>
                <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.05 }}>
                    <Layers size={320} strokeWidth={1} />
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="tab-container glass-morph" style={{ 
                padding: '8px', 
                borderRadius: '20px', 
                marginBottom: '32px', 
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                <button className={`tab-item ${activeTab === 'assets' ? 'active' : ''}`} onClick={() => setActiveTab('assets')}>
                    <HardDrive size={18} /> Catalog Registry
                </button>
                <button className={`tab-item ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveTab('maintenance')}>
                    <Settings2 size={18} /> Maintenance Ops {maintenance.filter(m => m.status === 'Pending').length > 0 && <span className="status-dot status-online" style={{ marginLeft: '8px', width: '8px', height: '8px' }}></span>}
                </button>
                <button className={`tab-item ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
                    <Activity size={18} /> Activity Log
                </button>
            </div>

            {activeTab === 'assets' && (
                <>
                    <div className="toolbar glass-morph" style={{ 
                        padding: '20px', 
                        borderRadius: '24px', 
                        marginBottom: '32px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <div className="toolbar-left" style={{ width: '100%', maxWidth: '500px' }}>
                            <div className="search-box" style={{ 
                                width: '100%',
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: '14px',
                                padding: '12px 20px',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <Search size={20} className="text-accent" />
                                <input 
                                    type="text" 
                                    className="form-control"
                                    placeholder="Scan inventory or filter by type..." 
                                    value={searchTerm}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem' }}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="toolbar-right">
                             <div className="badge badge-outline" style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800 }}>{filteredAssets.length} UNITS TRACKED</div>
                        </div>
                    </div>

                    <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '32px' }}>
                        {filteredAssets.map(asset => (
                            <div key={asset.id} className="hover-row glass-morph fade-in" style={{ 
                                padding: '28px', 
                                borderRadius: '28px', 
                                border: '1px solid rgba(255,255,255,0.05)',
                                background: 'rgba(255,255,255,0.01)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                    <div style={{ 
                                        background: 'rgba(var(--accent-rgb), 0.1)', 
                                        padding: '16px', 
                                        borderRadius: '16px',
                                        boxShadow: 'var(--accent-glow)'
                                    }}>
                                        <Cpu size={28} className="text-accent" />
                                    </div>
                                    <span className={`badge ${asset.status === 'available' ? 'badge-success' : asset.status === 'maintenance' ? 'badge-danger' : 'badge-warning'}`} style={{ 
                                        fontSize: '0.65rem', 
                                        textTransform: 'uppercase',
                                        padding: '6px 12px',
                                        borderRadius: '10px',
                                        letterSpacing: '1px',
                                        fontWeight: 800
                                    }}>
                                        {asset.status?.toUpperCase()?.replace('_', ' ')}
                                    </span>
                                </div>
                                
                                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.5px' }}>{asset.name}</h3>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', fontWeight: 600 }}>
                                    <Tag size={16} className="text-info" /> {asset.category?.toUpperCase()}
                                    <span style={{ opacity: 0.3 }}>|</span>
                                    <MapPin size={16} className="text-warning" /> RM-{(asset.room?.roomNumber || 'EXT')?.toUpperCase()}
                                </div>

                                <div style={{ 
                                    background: 'rgba(0,0,0,0.2)', 
                                    padding: '20px', 
                                    borderRadius: '20px', 
                                    margin: '24px 0', 
                                    fontSize: '0.9rem',
                                    border: '1px solid rgba(255,255,255,0.03)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Structural Condition</span>
                                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{asset.condition?.toUpperCase()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Registry Serial</span>
                                        <span style={{ fontFamily: 'monospace', color: 'var(--accent-light)', fontWeight: 700 }}>{asset.serialNumber || 'NON-INDEXED'}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '16px' }}>
                                    {asset.status === 'available' && (
                                        <button 
                                            className="btn btn-primary btn-sm shadow-accent" 
                                            style={{ flex: 1, borderRadius: '12px', padding: '12px', fontWeight: 800 }} 
                                            onClick={() => { setSelectedAsset(asset); setShowBookingModal(true); }}
                                        >
                                            RESERVE
                                        </button>
                                    )}
                                    <button 
                                        className="btn btn-outline btn-sm" 
                                        style={{ flex: 1, borderRadius: '12px', padding: '12px', fontWeight: 800, borderColor: 'rgba(255,255,255,0.1)' }} 
                                        onClick={() => { setSelectedAsset(asset); setShowReportIssueModal(true); }}>
                                        RELOG ISSUE
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {activeTab === 'maintenance' && (
                <div className="card glass-morph shadow-premium" style={{ borderRadius: '28px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: '32px' }}>LOGGED ASSET</th>
                                    <th>CRITICAL ISSUE</th>
                                    <th>PRIORITY</th>
                                    <th>REPORTED BY</th>
                                    <th>STATUS</th>
                                    <th style={{ textAlign: 'right', paddingRight: '32px' }}>COMMANDS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {maintenance.map(req => (
                                    <tr key={req.id} className="hover-row">
                                        <td style={{ paddingLeft: '32px' }}><div style={{ fontWeight: 800, color: 'var(--accent-light)', fontSize: '1rem' }}>{req.asset?.name}</div></td>
                                        <td style={{ maxWidth: '300px' }}><div style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>{req.issue}</div></td>
                                        <td><span className={`badge ${req.priority === 'Critical' ? 'badge-danger' : req.priority === 'High' ? 'badge-warning' : 'badge-primary'}`} style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.5px' }}>{req.priority?.toUpperCase()}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent-light)' }}>
                                                    {req.reporter?.firstName[0]}{req.reporter?.lastName[0]}
                                                </div>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{req.reporter?.firstName} {req.reporter?.lastName}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div className={`status-dot ${req.status === 'Resolved' ? 'status-online' : 'status-offline'}`}></div>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: req.status === 'Resolved' ? 'var(--success)' : 'var(--warning)' }}>{req.status?.toUpperCase()}</span>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right', paddingRight: '32px' }}>
                                            {req.status === 'Pending' && (user.role === 'admin' || user.role === 'staff') && (
                                                <button 
                                                    className="btn btn-primary btn-sm shadow-accent" 
                                                    style={{ borderRadius: '10px', padding: '6px 16px', fontWeight: 800, fontSize: '0.75rem' }} 
                                                    onClick={() => resolveMaintenance(req.id)}
                                                >
                                                    RESOLVE
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'bookings' && (
                <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '32px' }}>
                    {bookings.map(booking => (
                        <div key={booking.id} className="hover-row glass-morph fade-in" style={{ 
                            padding: '24px', 
                            borderRadius: '24px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            background: 'rgba(255,255,255,0.01)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                <div style={{ 
                                    background: 'rgba(59, 130, 246, 0.1)', 
                                    color: '#3b82f6', 
                                    padding: '16px', 
                                    borderRadius: '16px',
                                    boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)'
                                }}>
                                    <ClipboardList size={28} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.5px' }}>{booking.asset?.name}</h4>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '1px' }}>RESERVATION ACCESS ID-{(booking.id?.substring(0, 5))?.toUpperCase()}</div>
                                        </div>
                                        <span className="badge badge-info" style={{ fontSize: '0.65rem', fontWeight: 800, borderRadius: '8px' }}>{booking.status?.toUpperCase()}</span>
                                    </div>
                                    <div style={{ 
                                        margin: '16px 0', 
                                        padding: '12px 16px', 
                                        background: 'rgba(0,0,0,0.15)', 
                                        borderRadius: '12px',
                                        fontSize: '0.9rem',
                                        color: 'var(--text-secondary)',
                                        borderLeft: '3px solid var(--accent)'
                                    }}>
                                        Authorized by <strong>{booking.user?.firstName} {booking.user?.lastName}</strong>
                                        <br />
                                        <span style={{ fontSize: '0.85rem', fontStyle: 'italic', opacity: 0.8 }}>" {booking.purpose} "</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                        <Clock size={14} className="text-accent" />
                                        <span>{new Date(booking.startTime).toLocaleString()}</span>
                                        <ChevronRight size={12} />
                                        <span>{new Date(booking.endTime).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            <ModalOverlay isOpen={showReportIssueModal} onClose={() => setShowReportIssueModal(false)}>
                <ModalHeader title={`Report Issue: ${selectedAsset?.name}`} onClose={() => setShowReportIssueModal(false)} icon={AlertTriangle} />
                <form onSubmit={handleReportIssue}>
                    <ModalBody>
                        <div className="form-group">
                            <label>Description of Issue</label>
                            <textarea name="issue" className="form-control" rows="4" required placeholder="Describe technical anomalies or physical damage..."></textarea>
                        </div>
                        <div className="form-group">
                            <label>Severity Protocol</label>
                            <select name="priority" className="form-control" defaultValue="Medium">
                                <option value="Low">Low Clearance</option>
                                <option value="Medium">Medium Severity</option>
                                <option value="High">High Priority</option>
                                <option value="Critical">Mission Critical</option>
                            </select>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowReportIssueModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Transmit Logistics Report</button>
                    </ModalFooter>
                </form>
            </ModalOverlay>

            <ModalOverlay isOpen={showBookingModal} onClose={() => setShowBookingModal(false)}>
                <ModalHeader title={`Reserve Infrastructure: ${selectedAsset?.name}`} onClose={() => setShowBookingModal(false)} icon={CheckSquare} />
                <form onSubmit={handleBooking}>
                    <ModalBody>
                        <div className="form-group">
                            <label>Utilization Purpose</label>
                            <input type="text" name="purpose" className="form-control" required placeholder="e.g. Advanced Bio-Analysis Lab X" />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Reservation Commencement</label>
                                <input type="datetime-local" name="startTime" className="form-control" required />
                            </div>
                            <div className="form-group">
                                <label>Projected Completion</label>
                                <input type="datetime-local" name="endTime" className="form-control" required />
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowBookingModal(false)}>Cancel Request</button>
                        <button type="submit" className="btn btn-primary">Establish Reservation</button>
                    </ModalFooter>
                </form>
            </ModalOverlay>
        </div>
    );
}
