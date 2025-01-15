const { Types } = require('mongoose');

const validateId = (req, res, next) => {
    const { id } = req.params;
    if (!id || !Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid or missing ID parameter'
        });
    }
    next();
};

module.exports = validateId; 