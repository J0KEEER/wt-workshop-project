import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Search, X, BookOpen, ArrowLeftRight, Trash2, Edit2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Library() {
    const { user } = useAuth();
    const [books, setBooks] = useState([]);
    const [loans, setLoans] = useState([]);
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
        api.get('/library/loans')
            .then(res => setLoans(res.data))
            .catch(console.error);
    };

    useEffect(() => { fetchBooks(); fetchLoans(); }, [search]);

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
            fetchBooks();
        } catch (err) {
            alert(err.response?.data?.error || 'Error saving');
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/library/books/${deleteTarget.id}`);
            fetchBooks();
        } catch (err) {
            alert(err.response?.data?.error || 'Error deleting');
        } finally {
            setDeleteTarget(null);
        }
    };

    const handleBorrow = async (bookId) => {
        try {
            await api.post('/library/borrow', { bookId, userId: user.id });
            fetchBooks();
            fetchLoans();
            alert('Book borrowed successfully!');
        } catch (err) {
            alert(err.response?.data?.error || 'Error borrowing');
        }
    };

    const handleReturn = async (loanId) => {
        try {
            const res = await api.post('/library/return', { loanId });
            fetchBooks();
            fetchLoans();
            if (res.data.fine > 0) {
                alert(`Book returned. Overdue fine: $${res.data.fine}`);
            } else {
                alert('Book returned successfully!');
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Error returning');
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    const isLibrarian = user?.role === 'admin' || user?.role === 'librarian';

    return (
        <div className="fade-in">
            <div className="toolbar">
                <div className="toolbar-left">
                    <div className="search-box">
                        <Search size={16} />
                        <input className="form-control" placeholder="Search books…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search books" />
                    </div>
                    <button className={`btn ${tab === 'books' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('books')}>
                        <BookOpen size={16} /> Catalog
                    </button>
                    <button className={`btn ${tab === 'loans' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('loans')}>
                        <ArrowLeftRight size={16} /> Loans
                    </button>
                </div>
                <div className="toolbar-right">
                    {isLibrarian && <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Book</button>}
                </div>
            </div>

            {/* Books Tab */}
            {tab === 'books' && (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Author</th>
                                <th>ISBN</th>
                                <th>Category</th>
                                <th>Available</th>
                                <th>Location</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {books.map(b => (
                                <tr key={b.id}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.title}</td>
                                    <td>{b.author}</td>
                                    <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{b.isbn || '—'}</td>
                                    <td><span className="badge badge-info">{b.category}</span></td>
                                    <td>
                                        <span className={b.availableCopies > 0 ? '' : ''} style={{ color: b.availableCopies > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                                            {b.availableCopies} / {b.totalCopies}
                                        </span>
                                    </td>
                                    <td>{b.location || '—'}</td>
                                    <td>
                                        <div className="btn-group">
                                            {b.availableCopies > 0 && (
                                                <button className="btn btn-success btn-sm" onClick={() => handleBorrow(b.id)}>Borrow</button>
                                            )}
                                            {isLibrarian && (
                                                <>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(b)} aria-label={`Edit ${b.title}`}><Edit2 size={14} /></button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(b)} aria-label={`Delete ${b.title}`}><Trash2 size={14} /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {books.length === 0 && (
                                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No books found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Loans Tab */}
            {tab === 'loans' && (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Book</th>
                                <th>Borrower</th>
                                <th>Borrow Date</th>
                                <th>Due Date</th>
                                <th>Return Date</th>
                                <th>Fine</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loans.map(l => (
                                <tr key={l.id}>
                                    <td style={{ fontWeight: 500 }}>{l.book?.title}</td>
                                    <td>{l.user?.firstName} {l.user?.lastName}</td>
                                    <td>{l.borrowDate}</td>
                                    <td>{l.dueDate}</td>
                                    <td>{l.returnDate || '—'}</td>
                                    <td style={{ color: l.fine > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{l.fine > 0 ? `$${l.fine}` : '—'}</td>
                                    <td>
                                        <span className={`badge ${l.status === 'returned' ? 'badge-success' : l.status === 'overdue' ? 'badge-danger' : 'badge-warning'}`}>
                                            {l.status}
                                        </span>
                                    </td>
                                    <td>
                                        {l.status === 'active' && (
                                            <button className="btn btn-secondary btn-sm" onClick={() => handleReturn(l.id)}>Return</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {loans.length === 0 && (
                                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No loans found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create/Edit Book Modal */}
            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editing ? 'Edit Book' : 'Add Book'}</h3>
                            <button className="modal-close" onClick={() => setModalOpen(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
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
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add Book'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
                        <div className="modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertTriangle size={20} style={{ color: 'var(--danger)' }} />
                                Confirm Deletion
                            </h3>
                            <button className="modal-close" onClick={() => setDeleteTarget(null)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.title}</strong>? This action cannot be undone.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={confirmDelete}>
                                <Trash2 size={14} /> Delete Book
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
