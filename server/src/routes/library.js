import { Op } from "sequelize";
import express from 'express';
import {  Book, BookLoan, User  } from '../models/index.js';
import {  authenticate, authorize  } from '../middleware/auth.js';

const router = express.Router();

// GET /api/library/books — Search books
router.get('/books', authenticate, async (req, res) => {
    try {
        const { search, category, available } = req.query;
        const where = {};
        if (category) where.category = category;
        if (available === 'true') where.availableCopies = { [Op.gt]: 0 };

        if (search) {
            where[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { author: { [Op.like]: `%${search}%` } },
                { isbn: { [Op.like]: `%${search}%` } },
            ];
        }

        const books = await Book.findAll({ where, order: [['title', 'ASC']] });
        res.json(books);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/library/books/:id
router.get('/books/:id', authenticate, async (req, res) => {
    try {
        const book = await Book.findByPk(req.params.id, {
            include: [{
                model: BookLoan, as: 'loans',
                include: [{ model: User, as: 'user', attributes: ['id', 'username', 'firstName', 'lastName'] }],
            }],
        });
        if (!book) return res.status(404).json({ error: 'Book not found' });
        res.json(book);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/library/books — Add book
router.post('/books', authenticate, authorize('admin', 'librarian'), async (req, res) => {
    try {
        const book = await Book.create(req.body);
        res.status(201).json(book);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/library/books/:id
router.put('/books/:id', authenticate, authorize('admin', 'librarian'), async (req, res) => {
    try {
        const book = await Book.findByPk(req.params.id);
        if (!book) return res.status(404).json({ error: 'Book not found' });
        await book.update(req.body);
        res.json(book);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/library/books/:id
router.delete('/books/:id', authenticate, authorize('admin', 'librarian'), async (req, res) => {
    try {
        const book = await Book.findByPk(req.params.id);
        if (!book) return res.status(404).json({ error: 'Book not found' });
        await book.destroy();
        res.json({ message: 'Book deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/library/borrow — Borrow a book
router.post('/borrow', authenticate, async (req, res) => {
    try {
        const { bookId, userId } = req.body;
        const borrowerId = userId || req.user.id;

        const book = await Book.findByPk(bookId);
        if (!book) return res.status(404).json({ error: 'Book not found' });
        if (book.availableCopies <= 0) {
            return res.status(400).json({ error: 'No copies available' });
        }

        // Check if user already has this book borrowed
        const existingLoan = await BookLoan.findOne({
            where: { bookId, userId: borrowerId, status: 'active' },
        });
        if (existingLoan) {
            return res.status(400).json({ error: 'You already have this book borrowed' });
        }

        const today = new Date();
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + 14); // 2-week loan period

        const loan = await BookLoan.create({
            bookId,
            userId: borrowerId,
            borrowDate: today.toISOString().split('T')[0],
            dueDate: dueDate.toISOString().split('T')[0],
        });

        await book.update({ availableCopies: book.availableCopies - 1 });
        res.status(201).json(loan);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST /api/library/return — Return a book
router.post('/return', authenticate, async (req, res) => {
    try {
        const { loanId } = req.body;
        const loan = await BookLoan.findByPk(loanId);
        if (!loan) return res.status(404).json({ error: 'Loan not found' });
        if (loan.status === 'returned') {
            return res.status(400).json({ error: 'Book already returned' });
        }

        const today = new Date();
        const dueDate = new Date(loan.dueDate);
        let fine = 0;
        if (today > dueDate) {
            const daysLate = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
            fine = daysLate * 5; // $5 per day
        }

        await loan.update({
            returnDate: today.toISOString().split('T')[0],
            status: 'returned',
            fine,
        });

        const book = await Book.findByPk(loan.bookId);
        await book.update({ availableCopies: book.availableCopies + 1 });

        res.json({ loan, fine });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /api/library/loans — List user's loans
router.get('/loans', authenticate, async (req, res) => {
    try {
        const { userId, status } = req.query;
        const where = {};
        if (userId) where.userId = parseInt(userId);
        if (status) where.status = status;

        const loans = await BookLoan.findAll({
            where,
            include: [
                { model: Book, as: 'book' },
                { model: User, as: 'user', attributes: ['id', 'username', 'firstName', 'lastName'] },
            ],
            order: [['borrowDate', 'DESC']],
        });
        res.json(loans);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
