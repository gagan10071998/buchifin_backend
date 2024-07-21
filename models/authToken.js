const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;
const AuthTokenModel = new Schema({
    token: {
        type: String,
        default: "",
    },
    refreshToken: {
        type: String,
        default: "",
    },
    user: {
        type: ObjectId,
    },
    expired:{
        type: Boolean,
        default: false
    },
    deviceType: {
        type: String,
        default: ""
    },
    deviceToken: {
        type: String,
        default: ""
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

// Pre 'find' middleware
AuthTokenModel.pre('find', function (next) {
    this.where({ isDeleted: false });
    next();
});

// Pre 'findOne' middleware
AuthTokenModel.pre('findOne', function (next) {
    this.where({ isDeleted: false });
    next();
});

// Pre 'findOneAndUpdate' middleware
AuthTokenModel.pre('findOneAndUpdate', function (next) {
    this.where({ isDeleted: false });
    next();
});

const AuthToken = mongoose.model('AuthToken', AuthTokenModel);
module.exports = AuthToken;