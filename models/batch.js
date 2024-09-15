const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;
const config = require("config");
const USER_TYPES = Object.values(config.get("USER_TYPES"));
const BatchSchema = new Schema({
  manufacturer: {
    type: ObjectId,
    ref: 'User', 
    required: true,
  },
  company: {
    type: ObjectId,
    ref: 'Company', 
    required: true,
  },
  batchNumber: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    index: true
  },
  manufacturingDate: {
    type: Date,
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  totalQuantity: {
    type: Number,
    required: true,
    default: 0,
  },
  unitOfMeasure: {
    type: String,
    enum: ['kg', 'g', 'liter', 'ml'],
    required: true
  },
  status: {
    type: String,
    enum: ["ACTIVE", "EXPIRED", "RECALLED", "INACTIVE"],
    default: "ACTIVE",
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  createdByType: {
    type: String,
    enum: USER_TYPES,
  },
  updatedBy: {
    type: ObjectId,
    ref: 'User'
  },
  updatedByType: {
    type: String,
    enum: USER_TYPES
  }
},
{
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
});

// Middleware to filter out deleted batches
BatchSchema.pre("find", function (next) {
  this.where({ isDeleted: false });
  next();
});

BatchSchema.pre("findOne", function (next) {
  this.where({ isDeleted: false });
  next();
});

BatchSchema.pre("findOneAndUpdate", function (next) {
  this.where({ isDeleted: false });
  next();
});

const Batch = mongoose.model("Batch", BatchSchema);
module.exports = Batch;
