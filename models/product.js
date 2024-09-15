const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;

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
  manufacturer: {
    type: String,
    required: true,
    trim: true
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
  size: {
    type: Number, // e.g., 1 for 1kg, 500 for 500ml
    required: true
  },
  unitOfMeasure: {
    type: String,
    enum: ['kg', 'g', 'liter', 'ml'],
    required: true
  },
  recommendedDose: {
    type: String,
    trim: true,
  },
  registrationNumber: {
    type: String,
    trim: true,
    required: true
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
  antidote: {
    type: String,
    trim: true,
  },
  recommendedDose: {
    type: String,
    trim: true,
  },
  hsnCode: {
    type: String,
    trim: true,
  },
  gstPercentage: {
    type: Number, // e.g., 18 for 18%
  },
  price: {
    purchasePrice: {
      type: Number,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number, // Percentage discount if applicable
      default: 0
    }
  },
  status: {
    type: String,
    enum: ["ACTIVE", "INACTIVE", "DISCONTINUED"],
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
