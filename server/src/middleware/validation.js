import { body, validationResult, matchedData, sanitize } from 'express-validator';

/**
 * Common validation rules for string inputs to prevent XSS and injection
 */
export const stringRules = {
    trim: sanitize(san => san.trim()),
    escape: sanitize(san => san.escape()),
    isLength: (min, max) => body().isLength({ min, max }),
    notEmpty: body().notEmpty(),
    optional: body().optional({ nullable: true })
};

/**
 * Sanitize and validate request body with common rules
 */
export const validateSanitize = (rules) => [
    ...rules,
    (req, res, next) => {
        // Manually sanitize any remaining fields
        if (req.body && typeof req.body === 'object') {
            Object.keys(req.body).forEach(key => {
                const value = req.body[key];
                if (typeof value === 'string') {
                    req.body[key] = value.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
                }
            });
        }
        next();
    }
];

/**
 * Middleware to handle validation results consistently
 */
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errors.array()
        });
    }
    next();
};
