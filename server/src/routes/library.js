import { Op } from "sequelize";
import express from 'express';
import {  Book, BookLoan, User, BookReservation  } from '../models/index.js';
import {  authenticate, authorize  } from '../middleware/auth.js';

const router = express.Router();

// ... (existing search and management routes up to line 80)

// POST /api/library/reserve — Reserve a book
router.post('/reserve', authenticate, async (req, res) => {
    try {
        const { bookId } = req.body;
        const userId = req.user.id;

        const book = await Book.findByPk(bookId);
        if (!book) return res.status(404).json({ error: 'Book not found' });
        if (book.availableCopies > 0) {
            return res.status(400).json({ error: 'Book is currently available for borrowing' });
        }

        // Check if user already has an active loan for this book
        const activeLoan = await BookLoan.findOne({ where: { bookId, userId, status: 'active' } });
        if (activeLoan) return res.status(400).json({ error: 'You already have this book borrowed' });

        // Check if user already has a pending reservation
        const existingReservation = await BookReservation.findOne({ 
            where: { bookId, userId, status: { [Op.in]: ['pending', 'notified'] } } 
        });
        if (existingReservation) return res.status(400).json({ error: 'You already have an active reservation for this book' });

        const reservation = await BookReservation.create({
            bookId,
            userId,
            reservationDate: new Date().toISOString().split('T')[0],
            status: 'pending'
        });

        res.status(201).json(reservation);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /api/library/my-reservations
router.get('/my-reservations', authenticate, async (req, res) => {
    try {
        const reservations = await BookReservation.findAll({
            where: { userId: req.user.id },
            include: [{ model: Book, as: 'book' }],
            order: [['reservationDate', 'DESC']]
        });
        res.json(reservations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/library/return — Return a book
router.post('/return', authenticate, async (req, res) => {
    try {
        const { loanId } = req.body;
        const loan = await BookLoan.findByPk(loanId, { include: [{ model: Book, as: 'book' }] });
        if (!loan) return res.status(404).json({ error: 'Loan not found' });
        if (loan.status === 'returned') return res.status(400).json({ error: 'Book already returned' });

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

        const book = loan.book;
        
        // Find next person in reservation queue
        const nextReservation = await BookReservation.findOne({
            where: { bookId: book.id, status: 'pending' },
            order: [['reservationDate', 'ASC'], ['id', 'ASC']]
        });

        if (nextReservation) {
            await nextReservation.update({ status: 'notified' });
            // In a real app, send Email/SMS here
        } else {
            // Only increment available copies if nobody is waiting
            await book.update({ availableCopies: book.availableCopies + 1 });
        }

        res.json({ loan, fine, notified: !!nextReservation });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /api/library/loans — List user's loans
router.get('/loans', authenticate, async (req, res) => {
    try {
        const { userId, status } = req.query;
        const targetUserId = userId ? parseInt(userId) : req.user.id;
        const where = { userId: targetUserId };
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

// POST /api/library/borrow — Borrow a book
router.post('/borrow', authenticate, async (req, res) => {
    try {
        const { bookId, userId } = req.body;
        const borrowerId = userId || req.user.id;

        const book = await Book.findByPk(bookId);
        if (!book) return res.status(404).json({ error: 'Book not found' });

        // Check if user has an active 'notified' reservation (they have priority)
        const priorityReservation = await BookReservation.findOne({
            where: { bookId, userId: borrowerId, status: 'notified' }
        });

        if (!priorityReservation && book.availableCopies <= 0) {
            return res.status(400).json({ error: 'No copies available. Please reserve this book.' });
        }

        const today = new Date();
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + 14);

        const loan = await BookLoan.create({
            bookId,
            userId: borrowerId,
            borrowDate: today.toISOString().split('T')[0],
            dueDate: dueDate.toISOString().split('T')[0],
        });

        if (priorityReservation) {
            await priorityReservation.update({ status: 'fulfilled' });
        } else {
            await book.update({ availableCopies: book.availableCopies - 1 });
        }

        res.status(201).json(loan);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

export default router;
