import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    Calendar, Plus, Trash2, MapPin, Tag, Info, AlertTriangle, 
    Search, Filter, Sparkles, Clock, Globe, ChevronRight,
    Users, PartyPopper, BookOpen, Mic2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ModalOverlay, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';

export default function Events() {
    const { user } = useAuth();
    const toast = useToast();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', date: '', type: 'workshop', location: '' });
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchEvents = async () => {
        try {
            const res = await api.get('/events');
            setEvents(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEvents(); }, []);

    const isAdmin = user?.role === 'admin';

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await api.post('/events', form);
            setModalOpen(false);
            toast.success('Event created successfully');
            setForm({ title: '', description: '', date: '', type: 'workshop', location: '' });
            fetchEvents();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error creating event');
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/events/${deleteTarget.id}`);
            toast.success('Event deleted');
            fetchEvents();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error deleting');
        } finally {
            setDeleteTarget(null);
        }
    };

    if (loading) return (
        <div className="loading-container">
            <div className="spinner"></div>
            <p>Syncing Campus Calendar...</p>
        </div>
    );

    const getTypeConfig = (type) => {
        switch (type) {
            case 'workshop': return { color: '#38bdf8', icon: <BookOpen size={14} />, label: 'Workshop' };
            case 'seminar': return { color: '#fbbf24', icon: <Mic2 size={14} />, label: 'Seminar' };
            case 'cultural': return { color: '#f472b6', icon: <PartyPopper size={14} />, label: 'Cultural' };
            case 'holiday': return { color: '#f87171', icon: <Globe size={14} />, label: 'Holiday' };
            default: return { color: '#94a3b8', icon: <Info size={14} />, label: 'Other' };
        }
    };

    const filteredEvents = events.filter(e => 
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        e.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fade-in">
            {/* Campus Events Hero */}
            <div className="card hero-card shadow-accent" style={{ marginBottom: '32px' }}>
                <div className="card-body" style={{ padding: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div className="badge badge-primary" style={{ marginBottom: '12px', background: 'rgba(var(--primary-rgb), 0.2)', color: 'var(--accent-light)' }}>
                                <Sparkles size={12} style={{ marginRight: '6px' }} /> HAPPENING ON CAMPUS
                            </div>
                            <h1 style={{ margin: 0, fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                                Campus Activities
                            </h1>
                            <p style={{ margin: '12px 0 0 0', fontSize: '1.1rem', opacity: 0.9, maxWidth: '600px', lineHeight: '1.6' }}>
                                Stay engaged with workshops, seminars, and cultural festivals. Your hub for all campus life updates.
                            </p>
                        </div>
                        {isAdmin && (
                            <button 
                                className="btn btn-secondary glass-morph" 
                                style={{ padding: '12px 24px', borderRadius: '14px', gap: '8px', fontWeight: 600 }} 
                                onClick={() => setModalOpen(true)}
                            >
                                <Plus size={20} /> Launch New Event
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Premium Toolbar */}
            <div className="toolbar glass-morph" style={{ marginBottom: '32px', borderRadius: '16px' }}>
                <div className="toolbar-left">
                    <div className="search-box glass-morph">
                        <Search size={18} />
                        <input 
                            className="form-control" 
                            placeholder="Find workshops, seminars..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-icon glass-morph"><Filter size={18} /></button>
                </div>
                <div className="toolbar-right">
                    <div className="tab-group glass-morph" style={{ padding: '4px' }}>
                        <button className="tab active">Upcoming</button>
                        <button className="tab">Passed</button>
                    </div>
                    <div className="v-separator"></div>
                    <span className="badge badge-outline" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        {filteredEvents.length} ACTIVITIES FOUND
                    </span>
                </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '28px' }}>
                {filteredEvents.map(event => {
                    const config = getTypeConfig(event.type);
                    return (
                        <div key={event.id} className="card glass-morph hover-card fade-in" style={{ 
                            padding: '0', 
                            display: 'flex', 
                            flexDirection: 'column',
                            overflow: 'hidden',
                            minHeight: '280px'
                        }}>
                            <div style={{ 
                                height: '8px', 
                                width: '100%', 
                                background: `linear-gradient(90deg, ${config.color}, transparent)` 
                            }}></div>
                            
                            <div style={{ padding: '28px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '8px', 
                                        padding: '6px 12px', 
                                        borderRadius: '20px', 
                                        background: `${config.color}15`, 
                                        color: config.color,
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        border: `1px solid ${config.color}30`
                                    }}>
                                        {config.icon} {config.label}
                                    </div>
                                    {isAdmin && (
                                        <button 
                                            className="btn btn-icon text-danger" 
                                            style={{ background: 'rgba(255,107,107,0.1)', borderRadius: '10px' }} 
                                            onClick={() => setDeleteTarget(event)}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>

                                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px', lineHeight: 1.3 }}>
                                    {event.title}
                                </h3>
                                
                                <p style={{ 
                                    color: 'var(--text-secondary)', 
                                    fontSize: '0.95rem', 
                                    lineHeight: '1.6', 
                                    marginBottom: '24px',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    flex: 1
                                }}>
                                    {event.description}
                                </p>

                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: '1fr', 
                                    gap: '12px', 
                                    paddingTop: '20px', 
                                    borderTop: '1px solid rgba(255,255,255,0.05)' 
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--accent-light)', fontWeight: 600 }}>
                                        <Calendar size={16} /> 
                                        {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        <MapPin size={16} style={{ opacity: 0.7 }} /> 
                                        {event.location || 'Main Campus'}
                                    </div>
                                </div>
                                
                                <button className="btn btn-primary glass-morph" style={{ marginTop: '24px', width: '100%', justifyContent: 'center', borderRadius: '12px', padding: '12px' }}>
                                    View Details <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {filteredEvents.length === 0 && (
                    <div className="empty-state glass-morph fade-in" style={{ gridColumn: '1/-1', padding: '100px 40px', textAlign: 'center' }}>
                        <div style={{ 
                            width: '80px', 
                            height: '80px', 
                            borderRadius: '50%', 
                            background: 'rgba(255,255,255,0.05)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            margin: '0 auto 24px auto',
                            color: 'var(--text-secondary)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <Calendar size={40} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>No matching events</h3>
                        <p style={{ maxWidth: '400px', margin: '0 auto', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                            We couldn't find any events matching your search criteria. Try a different term or check later!
                        </p>
                    </div>
                )}
            </div>

            {/* Create Event Modal */}
            <ModalOverlay isOpen={modalOpen} onClose={() => setModalOpen(false)}>
                <div className="glass-morph" style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <ModalHeader title="Initialize Campus Event" onClose={() => setModalOpen(false)} />
                    <form onSubmit={handleSave}>
                        <ModalBody style={{ padding: '32px' }}>
                            <div className="form-group">
                                <label style={{ fontWeight: 600, marginBottom: '10px', display: 'block' }}>Event Title</label>
                                <input className="form-control glass-morph" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Annual Tech Symposium" />
                            </div>
                            <div className="form-group">
                                <label style={{ fontWeight: 600, marginBottom: '10px', display: 'block' }}>Description</label>
                                <textarea className="form-control glass-morph" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Tell us more about the event..." />
                            </div>
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="form-group">
                                    <label style={{ fontWeight: 600, marginBottom: '10px', display: 'block' }}>Event Date</label>
                                    <input type="date" className="form-control glass-morph" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontWeight: 600, marginBottom: '10px', display: 'block' }}>Event Type</label>
                                    <select className="form-control glass-morph" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        <option value="workshop">Workshop</option>
                                        <option value="seminar">Seminar</option>
                                        <option value="cultural">Cultural</option>
                                        <option value="holiday">Holiday</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label style={{ fontWeight: 600, marginBottom: '10px', display: 'block' }}>Campus Location</label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-light)' }} />
                                    <input className="form-control glass-morph" style={{ paddingLeft: '44px' }} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Auditorium A, Main Campus" />
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter style={{ padding: '24px 32px', background: 'rgba(0,0,0,0.2)' }}>
                            <button type="button" className="btn btn-secondary btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary shadow-accent" style={{ padding: '12px 32px', borderRadius: '12px' }}>Publish Event</button>
                        </ModalFooter>
                    </form>
                </div>
            </ModalOverlay>

            {/* Delete Confirmation */}
            <ModalOverlay isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
                <div className="glass-morph" style={{ borderRadius: '24px', overflow: 'hidden', maxWidth: '450px' }}>
                    <ModalHeader title="Confirm Termination" icon={AlertTriangle} onClose={() => setDeleteTarget(null)} />
                    <ModalBody style={{ padding: '32px', textAlign: 'center' }}>
                        <div style={{ color: 'var(--danger)', marginBottom: '20px' }}>
                            <AlertTriangle size={48} style={{ margin: '0 auto' }} />
                        </div>
                        <h3 style={{ marginBottom: '12px', fontSize: '1.3rem' }}>Are you sure?</h3>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            Deleting <strong>{deleteTarget?.title}</strong> will permanently remove it from all institutional records and calendars.
                        </p>
                    </ModalBody>
                    <ModalFooter style={{ padding: '20px 32px', background: 'rgba(0,0,0,0.2)' }}>
                        <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                        <button className="btn btn-danger" onClick={confirmDelete}>Terminate Permanently</button>
                    </ModalFooter>
                </div>
            </ModalOverlay>
        </div>
    );
}
