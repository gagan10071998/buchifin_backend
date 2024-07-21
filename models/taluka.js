const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;
const TalukaModel = new Schema({
    government: {
        type: ObjectId,
        ref: 'governments'
    },
    district:{
        type: ObjectId,
        ref: 'districts'
    },
    user:{
        type: ObjectId,
    },
    state:{
        type: String,
        default: ''
    },
    district: {
        type: String,
        default: ''
    },
    taluka:{
        type: String,
        default:''
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'BLOCKED','PENDING','REJECTED'],
        default: 'ACTIVE'
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

// Pre 'find' middleware
TalukaModel.pre('find', function (next) {
    this.where({ isDeleted: false });
    next();
});

// Pre 'findOne' middleware
TalukaModel.pre('findOne', function (next) {
    this.where({ isDeleted: false });
    next();
});

// Pre 'findOneAndUpdate' middleware
TalukaModel.pre('findOneAndUpdate', function (next) {
    this.where({ isDeleted: false });
    next();
});

const Taluka = mongoose.model('Taluka', TalukaModel);
module.exports = Taluka;