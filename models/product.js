const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;
const config = require("config");
const USER_TYPES = Object.values(config.get("USER_TYPES"));

const ProductSchema = new Schema({
  sku: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  technicalName: {
    type: String,
    trim: true,
    required: true,
  },
  category: {
    type: ObjectId,
    ref: 'Category',
    required: true
  },
  manufacturer: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  marketedBy: {
    type: String,
    trim: true,
    required: true
  },
  photos: [{
    type: ObjectId,
    ref: 'Document',
    required: true
  }],
  packagingOptions: [{
    size: {
      type: Number,
      required: true
    },
    unitOfMeasure: {
      type: String,
      enum: ['kg', 'g', 'liter', 'ml'],
      required: true
    },
    mrp: {
      type: Number,
      required: true
    },
    dealerPrice: {
      type: Number,
      required: true
    }
  }],
  composition: [{
    ingredient: {
      type: String,
      required: true
    },
    percentage: {
      type: Number,
      required: true
    }
  }],
  recommendedDose: {
    type: String,
    trim: true,
    required: true
  },
  registrationNumber: {
    type: String,
    trim: true,
    required: true,
    unique: true
  },
  description: {
    type: String,
    trim: true,
    required: true
  },
  pamphlet: {
    type: ObjectId,
    ref: 'Document'
  },
  safetyInstructions: {
    type: String,
    trim: true,
    required: true
  },
  antidote: {
    type: String,
    trim: true,
  },
  storageInstructions: {
    type: String,
    trim: true,
    required: true
  },
  hsnCode: {
    type: String,
    trim: true,
    required: true
  },
  gstPercentage: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["ACTIVE", "INACTIVE", "DISCONTINUED", "PENDING_APPROVAL"],
    default: "PENDING_APPROVAL",
  },
  approvedBy: {
    type: ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
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
    required: true
  },
  updatedBy: {
    type: ObjectId,
    ref: 'User'
  },
  updatedByType: {
    type: String,
    enum: USER_TYPES
  }
}, {
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true }
});

// Middleware to filter out deleted products
ProductSchema.pre("find", function (next) {
  this.where({ isDeleted: false });
  next();
});

ProductSchema.pre("findOne", function (next) {
  this.where({ isDeleted: false });
  next();
});

ProductSchema.pre("findOneAndUpdate", function (next) {
  this.where({ isDeleted: false });
  next();
});

const Product = mongoose.model("Product", ProductSchema);
module.exports = Product;
