import express from 'express';
import { body, validationResult } from 'express-validator';
import Sentiment from 'sentiment';
import { Feedback, Enrollment, Student, Course } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const sentiment = new Sentiment();

// Sanitize and validate feedback content
const validateFeedback = [
    body('courseId').isInt().withMessage('Course ID must be an integer'),
    body('content')
        .isLength({ min: 1, max: 2000 })
        .withMessage('Content must be between 1 and 2000 characters')
        .trim()
        .escape(), // Basic XSS prevention
];

// POST /api/feedback - Submit course feedback
router.post('/', authenticate, validateFeedback, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errors.array()
        });
    }

    const { courseId, content } = req.body;

    if (req.user.role !== 'student') {
        return res.status(403).json({
            error: 'Only students can submit feedback',
            code: 'INSUFFICIENT_PERMISSIONS'
        });
    }

    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) {
        return res.status(404).json({
            error: 'Student profile not found',
            code: 'PROFILE_NOT_FOUND'
        });
    }

    // Verify enrollment
    const enrollment = await Enrollment.findOne({
      where: { studentId: student.id, courseId }
    });
    if (!enrollment) {
      return res.status(403).json({
          error: 'You are not enrolled in this course',
          code: 'NOT_ENROLLED'
      });
    }

    // Analyze Sentiment
    const result = sentiment.analyze(content);
    let label = 'neutral';
    if (result.score > 0) label = 'positive';
    else if (result.score < 0) label = 'negative';

    // Content is already sanitized by express-validator escape()
    const feedback = await Feedback.create({
      studentId: student.id,
      courseId,
      content,
      sentimentScore: result.score,
      sentimentLabel: label,
      date: new Date().toISOString().split('T')[0]
    });

    res.status(201).json(feedback);
  } catch (err) {
    next(err);
  }
});

// GET /api/feedback/stats - Overall sentiment stats for admin
router.get('/stats', authenticate, async (req, res) => {
  try {
    const feedbacks = await Feedback.findAll({
      attributes: ['sentimentLabel', 'sentimentScore', 'courseId'],
      include: [{ model: Course, as: 'course', attributes: ['title', 'code'] }]
    });

    const stats = {
      positive: feedbacks.filter(f => f.sentimentLabel === 'positive').length,
      negative: feedbacks.filter(f => f.sentimentLabel === 'negative').length,
      neutral: feedbacks.filter(f => f.sentimentLabel === 'neutral').length,
      avgScore: feedbacks.length > 0 
        ? feedbacks.reduce((acc, f) => acc + f.sentimentScore, 0) / feedbacks.length 
        : 0
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
