const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;
const config = require("config");
const USER_TYPES = Object.values(config.get("USER_TYPES"));

const InventorySchema = new Schema({
  retailer: {
    type: ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  product: {
    type: ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  batch: {
    type: ObjectId,
    ref: 'Batch',
    required: true,
    index: true
  },
  packagingSize: {
    size: {
      type: Number,
      required: true
    },
    unitOfMeasure: {
      type: String,
      enum: ['kg', 'g', 'liter', 'ml'],
      required: true
    }
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  purchasePrice: {
    type: Number,
    required: true
  },
  sellingPrice: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true
  },
  invoiceDocument: {
    type: ObjectId,
    ref: 'Document',
    required: true
  },
  supplier: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    warehouse: {
      type: String,
      required: true
    },
    rack: String,
    shelf: String
  },
  status: {
    type: String,
    enum: ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "EXPIRED", "RECALLED"],
    default: "IN_STOCK"
  },
  minimumStockLevel: {
    type: Number,
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false
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

// Add pre-save middleware to check and update status based on quantity
InventorySchema.pre('save', function(next) {
  if (this.quantity <= 0) {
    this.status = "OUT_OF_STOCK";
  } else if (this.quantity <= this.minimumStockLevel) {
    this.status = "LOW_STOCK";
  }
  next();
}); 