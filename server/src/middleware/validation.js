import { body, validationResult } from 'express-validator';

/**
 * Sanitize request body strings to prevent XSS
 */
export const sanitizeBody = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        for (const key of Object.keys(req.body)) {
            const value = req.body[key];
            if (typeof value === 'string') {
                req.body[key] = value
                    .trim()
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '');
            }
        }
    }
    next();
};

/**
 * Common validation chains
 */
export const rules = {
    email: body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    password: body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    name: body('name').notEmpty().trim().escape().withMessage('Name is required'),
    id: body('id').optional().isInt({ min: 1 }).withMessage('ID must be a positive integer'),
};

/**
 * Middleware to handle validation results
 */
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errors.array().map(e => ({
                field: e.path,
                message: e.msg,
            })),
        });
    }
    next();
};
