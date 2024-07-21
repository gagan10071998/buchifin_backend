const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ErrorHandlerSchema = new Schema({
    errorMessage: {
        type: String,
        trim: true
    },
    status: {
        type: Number,
        default: 400
    },
    details: {
        type: String,
        trim: true
    },
    stack: {
        type: String,
        trim: true
    },
    method: {
        type: String,
        trim: true
    },
    url: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

// To make sure the latest errors are retrieved first when using `find()`
ErrorHandlerSchema.index({ 'createdAt': -1 });

const ErrorHandlerModel = mongoose.model('ErrorHandler', ErrorHandlerSchema);
module.exports = ErrorHandlerModel;
