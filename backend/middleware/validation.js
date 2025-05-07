const { body, validationResult } = require('express-validator');

// Profile validation rules
const profileValidationRules = [
    body('firstName').trim().notEmpty().withMessage('First name is required')
        .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
    body('lastName').trim().notEmpty().withMessage('Last name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
    body('email').trim().notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    body('role').trim().notEmpty().withMessage('Role is required')
        .isIn(['mentor', 'mentee']).withMessage('Role must be either mentor or mentee'),
    body('bio').optional().trim()
        .isLength({ max: 500 }).withMessage('Bio must not exceed 500 characters'),
    body('skills').optional().isArray().withMessage('Skills must be an array')
        .custom((value) => {
            if (value && value.length > 0) {
                const isValid = value.every(skill => 
                    typeof skill === 'string' && 
                    skill.length >= 2 && 
                    skill.length <= 50
                );
                if (!isValid) throw new Error('Each skill must be between 2 and 50 characters');
            }
            return true;
        }),
    body('interests').optional().isArray().withMessage('Interests must be an array')
        .custom((value) => {
            if (value && value.length > 0) {
                const isValid = value.every(interest => 
                    typeof interest === 'string' && 
                    interest.length >= 2 && 
                    interest.length <= 50
                );
                if (!isValid) throw new Error('Each interest must be between 2 and 50 characters');
            }
            return true;
        })
];

// Connection request validation rules
const connectionValidationRules = [
    body('userId').trim().notEmpty().withMessage('User ID is required')
        .isInt().withMessage('Invalid user ID format')
];

// Validate request middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            status: 'error',
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    }
    next();
};

module.exports = {
    profileValidationRules,
    connectionValidationRules,
    validate
}; 