// models/User.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;
const config = require("config");
const USER_TYPES = Object.values(config.get("USER_TYPES"));

const UserSchema = new Schema({
  profilePic: {
    type: String,
    default: "/profilepics/defaultuser.jpg",
  },
  qualificationDocs: [
    {
      name: { type: String },
      doc: { type: ObjectId, ref: 'Document' },
    }
  ],
  aadhaar: {
    number: { type: String },
    doc: {
      front: { type: ObjectId, ref: 'Document' },
      back: { type: ObjectId, ref: 'Document' }
    },
    note: { type: String }
  },
  pan: {
    number: { type: String },
    doc: {
      front: { type: ObjectId, ref: 'Document' },
      back: { type: ObjectId, ref: 'Document' }
    },
    note: { type: String }
  },
  bankDetails: {
    accountName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    bankName: { type: String },
    cancelCheque: {
      front: { type: ObjectId, ref: 'Document' },
      back: { type: ObjectId, ref: 'Document' }
    },
    note: { type: String }
  },
  name: {
    type: String,
    lowercase: true,
    trim: true,
    required: true,
    index: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    required: true,
    unique: true, // enforcing uniqueness on email
    index: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['MALE', 'FEMALE', 'OTHER'],
    default: 'OTHER'
  },
  dob: { type: Date },
  address: [{
    addressType: { type: String },
    lat: { type: Number },
    long: { type: Number },
    address: String,
    city: String,
    state: String,
    district: String,
    country: String,
    zip: String,
  }],
  phone: [{
    phoneType: { type: String },
    phone: {
      type: String,
      trim: true,
      required: true,
    },
    countryCode: {
      type: String,
      trim: true,
      default: "91",
    }
  }],
  password: { type: String, required: true },
  type: [{
    type: String,
    enum: USER_TYPES,
  }],
  status: {
    type: String,
    enum: ["ACTIVE", "INACTIVE", "BLOCKED", "PENDING", "REJECTED"],
    default: "ACTIVE",
  },
  isDeleted: { type: Boolean, default: false },
  createdBy: { type: ObjectId, ref: 'User' },
  createdByType: { type: String, enum: USER_TYPES },
  updatedBy: { type: ObjectId, ref: 'User' },
  updatedByType: { type: String, enum: USER_TYPES },
  isPhoneVerified: { type: Boolean, default: false }
}, {
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
});

// Ensure all queries filter out soft-deleted records
["find", "findOne", "findOneAndUpdate"].forEach(method => {
  UserSchema.pre(method, function (next) {
    this.where({ isDeleted: false });
    next();
  });
});

module.exports = mongoose.model("User", UserSchema);
