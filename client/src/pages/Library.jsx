import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    Plus, Search, X, BookOpen, ArrowLeftRight, Trash2, Edit2, 
    AlertTriangle, Clock, LibraryBig, ScrollText, BookmarkCheck, 
    History, BookMarked, Info, ChevronRight, Hash, User, 
    Calendar, MapPin, Gauge
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ModalOverlay, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';

export default function Library() {
    const { user } = useAuth();
    const toast = useToast();
    const [books, setBooks] = useState([]);
    const [loans, setLoans] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('books');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ title: '', author: '', isbn: '', category: 'textbook', publisher: '', year: '', totalCopies: 1, availableCopies: 1, location: '' });
    const [deleteTarget, setDeleteTarget] = useState(null);

    const fetchBooks = () => {
        api.get('/library/books', { params: search ? { search } : {} })
            .then(res => setBooks(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const fetchLoans = () => {
        api.get('/library/my-loans')
            .then(res => setLoans(res.data))
            .catch(console.error);
    };

    const fetchReservations = () => {
        api.get('/library/my-reservations')
            .then(res => setReservations(res.data))
            .catch(console.error);
    };

    useEffect(() => { 
        fetchBooks(); 
        fetchLoans(); 
        fetchReservations();
    }, [search]);

    const openCreate = () => {
        setEditing(null);
        setForm({ title: '', author: '', isbn: '', category: 'textbook', publisher: '', year: '', totalCopies: 1, availableCopies: 1, location: '' });
        setModalOpen(true);
    };

    const openEdit = (b) => {
        setEditing(b);
        setForm({ title: b.title, author: b.author, isbn: b.isbn || '', category: b.category, publisher: b.publisher || '', year: b.year || '', totalCopies: b.totalCopies, availableCopies: b.availableCopies, location: b.location || '' });
        setModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const data = { ...form, totalCopies: parseInt(form.totalCopies), availableCopies: parseInt(form.availableCopies), year: form.year ? parseInt(form.year) : null };
            if (editing) {
                await api.put(`/library/books/${editing.id}`, data);
            } else {
                await api.post('/library/books', data);
            }
            setModalOpen(false);
            toast.success(editing ? 'Book updated successfully' : 'Book added successfully');
            fetchBooks();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error saving');
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/library/books/${deleteTarget.id}`);
            toast.success('Book deleted successfully');
            fetchBooks();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error deleting');
        } finally {
            setDeleteTarget(null);
        }
    };

    const handleBorrow = async (bookId) => {
        try {
            await api.post('/library/borrow', { bookId });
            fetchBooks();
            fetchLoans();
            fetchReservations();
            toast.success('Book borrowed successfully!');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error borrowing');
        }
    };

    const handleReserve = async (bookId) => {
        try {
            await api.post('/library/reserve', { bookId });
            fetchBooks();
            fetchReservations();
            toast.success('Book reserved! You will be notified when it is available.');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error reserving');
        }
    };

    const handleReturn = async (loanId) => {
        try {
            const res = await api.post('/library/return', { loanId });
            fetchBooks();
            fetchLoans();
            if (res.data.fine > 0) {
                toast.info(`Book returned. Overdue fine: $${res.data.fine}`);
            } else if (res.data.notified) {
                toast.success('Book returned! Next person in queue has been notified.');
            } else {
                toast.success('Book returned successfully!');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error returning');
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    const isLibrarian = user?.role === 'admin' || user?.role === 'librarian';

    return (
        <div className="fade-in">
            <div className="tab-container" style={{ 
                padding: '8px', 
                borderRadius: '20px', 
                marginBottom: '32px', 
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                <button className={`tab-item ${tab === 'books' ? 'active' : ''}`} onClick={() => setTab('books')}>
                    <BookMarked size={18} /> Global Catalog
                </button>
                <button className={`tab-item ${tab === 'loans' ? 'active' : ''}`} onClick={() => setTab('loans')}>
                    <History size={18} /> Circulation Log {loans.length > 0 && <span className="status-dot status-online" style={{ marginLeft: '8px', width: '8px', height: '8px' }}></span>}
                </button>
                <button className={`tab-item ${tab === 'reservations' ? 'active' : ''}`} onClick={() => setTab('reservations')}>
                    <BookmarkCheck size={18} /> Waitlist Portal
                </button>
            </div>

            <div className="toolbar" style={{ 
                padding: '20px', 
                borderRadius: 'var(--radius-lg)', 
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
                            className="form-control" 
                            placeholder={`Scan registry ${tab === 'books' ? 'by ISBN, Title or Faculty...' : 'records...'}`} 
                            value={search} 
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem' }}
                            onChange={e => setSearch(e.target.value)} 
                            aria-label="Search library" 
                        />
                    </div>
                </div>
                <div className="toolbar-right">
                    <div className="badge badge-outline" style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600 }}>
                        {tab === 'books' ? books.length : tab === 'loans' ? loans.length : reservations.length} RESOURCES INDEXED
                    </div>
                </div>
            </div>

            {/* Books Tab */}
            {tab === 'books' && (
                <div className="card" style={{ borderRadius: '28px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: '32px' }}>TITLE & METADATA</th>
                                    <th>AUTHOR / PUBLISHER</th>
                                    <th>CLASSIFICATION</th>
                                    <th>AVAILABILITY METRIC</th>
                                    <th>STOWAGE</th>
                                    <th style={{ textAlign: 'right', paddingRight: '32px' }}>PROTOCOLS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {books.map(b => (
                                    <tr key={b.id} className="hover-row">
                                        <td style={{ paddingLeft: '32px' }}>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>{b.title}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--accent-light)', fontFamily: 'monospace', textTransform: 'uppercase', marginTop: '4px', fontWeight: 700 }}>REF-ID: {b.isbn || 'INTERNAL-INDEX'}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{b.author}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{b.publisher || 'UNIVERSAL PRESS'}</div>
                                        </td>
                                        <td>
                                            <span className="badge badge-outline" style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', borderRadius: '8px', padding: '4px 10px' }}>{b.category}</span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '160px' }}>
                                                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.02)' }}>
                                                    <div style={{ 
                                                        width: `${Math.min((b.availableCopies / b.totalCopies) * 100, 100)}%`, 
                                                        height: '100%', 
                                                        background: b.availableCopies > 0 ? 'var(--success)' : 'var(--danger)',
                                                        boxShadow: b.availableCopies > 0 ? '0 0 10px var(--success)' : '0 0 10px var(--danger)'
                                                    }}></div>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 600, color: b.availableCopies > 0 ? 'var(--success)' : 'var(--danger)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                                                        {b.availableCopies} Units In Stock
                                                    </span>
                                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL: {b.totalCopies}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td><div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--info)', fontSize: '0.85rem' }}>[{b.location || 'QUEUE-ONLY'}]</div></td>
                                        <td style={{ textAlign: 'right', paddingRight: '32px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                                {b.availableCopies > 0 ? (
                                                    <button className="btn btn-primary btn-sm" style={{ padding: '8px 20px', borderRadius: '12px', fontWeight: 600, fontSize: '0.75rem' }} onClick={() => handleBorrow(b.id)}>BORROW</button>
                                                ) : (
                                                    <button className="btn btn-warning btn-sm" style={{ padding: '8px 20px', borderRadius: '12px', fontWeight: 600, fontSize: '0.75rem' }} onClick={() => handleReserve(b.id)}>WAITLIST</button>
                                                )}
                                                {isLibrarian && (
                                                    <div className="btn-group" style={{ padding: '4px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)' }}>
                                                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(b)} title="Modify Registry"><Edit2 size={14} className="text-info" /></button>
                                                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleteTarget(b)} title="Purge Record"><Trash2 size={14} className="text-danger" /></button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {books.length === 0 && (
                        <div className="empty-state" style={{ padding: '80px 0' }}>
                            <LibraryBig size={64} className="text-muted" strokeWidth={1} style={{ marginBottom: '24px' }} />
                            <h3 style={{ fontWeight: 700, letterSpacing: '-0.5px' }}>Archive Void</h3>
                            <p style={{ opacity: 0.6, fontSize: '1.1rem' }}>Registry scan complete. No direct matches found within the specified parameters.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Loans Tab */}
            {tab === 'loans' && (
                <div className="card" style={{ borderRadius: '28px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: '32px' }}>RESOURCE TITLE</th>
                                    <th>BORROWER ENTITY</th>
                                    <th>LOGISTICS TIMELINE</th>
                                    <th>OUTSTANDING LIABILITIES</th>
                                    <th>STATUS</th>
                                    <th style={{ textAlign: 'right', paddingRight: '32px' }}>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loans.map(l => (
                                    <tr key={l.id} className="hover-row">
                                        <td style={{ paddingLeft: '32px' }}><div style={{ fontWeight: 600, color: 'var(--accent-light)', fontSize: '1rem' }}>{l.book?.title}</div></td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(var(--accent-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 600, color: 'var(--accent-light)' }}>
                                                    {l.user?.firstName[0]}{l.user?.lastName[0]}
                                                </div>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{l.user?.firstName} {l.user?.lastName}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>INITIATED: {l.borrowDate}</div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: l.status === 'active' && new Date() > new Date(l.dueDate) ? 'var(--danger)' : 'var(--text-primary)' }}>TERMINATION: {l.dueDate}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: (l.fine > 0 || (l.status === 'active' && new Date() > new Date(l.dueDate))) ? 'var(--danger)' : 'var(--success)', fontSize: '1rem' }}>
                                                {l.fine > 0 ? `$${l.fine}.00` : (l.status === 'active' && new Date() > new Date(l.dueDate)) ? 
                                                    `$${Math.ceil((new Date() - new Date(l.dueDate)) / (1000 * 60 * 60 * 24)) * 5}.00` : '$0.00'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div className={`status-dot ${l.status === 'returned' ? 'status-online' : (l.status === 'active' && new Date() > new Date(l.dueDate)) ? 'status-offline' : 'status-away'}`}></div>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: l.status === 'returned' ? 'var(--success)' : (l.status === 'active' && new Date() > new Date(l.dueDate)) ? 'var(--danger)' : 'var(--warning)', letterSpacing: '0.5px' }}>
                                                    {(l.status === 'active' && new Date() > new Date(l.dueDate)) ? 'OVERDUE' : l.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right', paddingRight: '32px' }}>
                                            {l.status === 'active' && (
                                                <button className="btn btn-primary btn-sm" style={{ borderRadius: '10px', padding: '8px 16px', fontWeight: 600 }} onClick={() => handleReturn(l.id)}>RETURN HUB</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {loans.length === 0 && (
                        <div className="empty-state" style={{ padding: '80px 0' }}>
                            <History size={64} className="text-muted" strokeWidth={1} style={{ marginBottom: '24px' }} />
                            <h3 style={{ fontWeight: 700, letterSpacing: '-0.5px' }}>No Active Circulation</h3>
                            <p style={{ opacity: 0.6, fontSize: '1.1rem' }}>Knowledge streams are currently stagnant. No active resource circulations detected.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Waitlist Tab */}
            {tab === 'reservations' && (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Book</th>
                                <th>Author</th>
                                <th>Reserved Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservations.map(r => (
                                <tr key={r.id}>
                                    <td style={{ fontWeight: 500 }}>{r.book?.title}</td>
                                    <td>{r.book?.author}</td>
                                    <td>{r.reservationDate}</td>
                                    <td>
                                        <span className={`badge ${
                                            r.status === 'fulfilled' ? 'badge-success' : 
                                            r.status === 'notified' ? 'badge-info' : 
                                            r.status === 'cancelled' ? 'badge-danger' : 'badge-warning'
                                        }`}>
                                            {r.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {reservations.length === 0 && (
                                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No active reservations</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            <ModalOverlay isOpen={modalOpen} onClose={() => setModalOpen(false)}>
                <ModalHeader title={editing ? 'Edit Book' : 'Add Book'} onClose={() => setModalOpen(false)} />
                <form onSubmit={handleSave}>
                    <ModalBody>
                        <div className="form-group">
                            <label>Title</label>
                            <input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Author</label>
                                <input className="form-control" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>ISBN</label>
                                <input className="form-control" value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Category</label>
                                <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                    <option value="textbook">Textbook</option>
                                    <option value="reference">Reference</option>
                                    <option value="fiction">Fiction</option>
                                    <option value="journal">Journal</option>
                                    <option value="magazine">Magazine</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Publisher</label>
                                <input className="form-control" value={form.publisher} onChange={e => setForm({ ...form, publisher: e.target.value })} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Total Copies</label>
                                <input className="form-control" type="number" min={1} value={form.totalCopies} onChange={e => setForm({ ...form, totalCopies: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Location</label>
                                <input className="form-control" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. A-101" />
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add Book'}</button>
                    </ModalFooter>
                </form>
            </ModalOverlay>

            {/* Delete Confirmation Modal */}
            <ModalOverlay isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
                <ModalHeader title="Confirm Deletion" icon={AlertTriangle} onClose={() => setDeleteTarget(null)} />
                <ModalBody>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget?.title}</strong>? This action cannot be undone.
                    </p>
                </ModalBody>
                <ModalFooter>
                    <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                    <button className="btn btn-danger" onClick={confirmDelete}>
                        <Trash2 size={14} /> Delete Book
                    </button>
                </ModalFooter>
            </ModalOverlay>
        </div>
    );
}
