const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;
const config = require("config");
const USER_TYPES = Object.values(config.get("USER_TYPES"));

const InventorySchema = new Schema({
  retailer: { type: ObjectId, ref: 'User', required: true, index: true },
  product: { type: ObjectId, ref: 'Product', required: true, index: true },
  batch: { type: String, index: true },
  packagingSize: {
    size: { type: Number },
    unitOfMeasure: { type: String, enum: ['kg', 'g', 'liter', 'ml'] }
  },
  quantity: { type: Number, min: 0 },
  purchasePrice: { type: Number },
  sellingPrice: { type: Number },
  discount: { type: Number, default: 0 }, // assumed as percentage discount
  purchaseDate: { type: Date },
  purchasedInvoiceNumber: { type: String },
  purchasedInvoiceDocument: { type: ObjectId, ref: 'Document' },
  status: {
    type: String,
    enum: ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "EXPIRED", "RECALLED"],
    default: "IN_STOCK"
  },
  minimumStockLevel: { type: Number, default: 0 },
  // --- New Tax Fields ---
  gstPercentage: { type: Number, default: 0 },
  cgstPercentage: { type: Number, default: 0 },
  sgstPercentage: { type: Number, default: 0 },
  tcsPercentage: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
  createdBy: { type: ObjectId, ref: 'User' },
  createdByType: { type: String, enum: USER_TYPES },
  updatedBy: { type: ObjectId, ref: 'User' },
  updatedByType: { type: String, enum: USER_TYPES },
  packagingOptionIndex: { type: Number }
}, {
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true }
});

// (If you have location fields, ensure they are defined. The below index is optional.)
InventorySchema.index({ 'location.geolocation': '2dsphere' });
InventorySchema.index({ retailer: 1, product: 1 });

// Pre-save middleware to set status based on quantity
InventorySchema.pre('save', function (next) {
  if (this.quantity <= 0) {
    this.status = "OUT_OF_STOCK";
  } else if (this.quantity <= this.minimumStockLevel) {
    this.status = "LOW_STOCK";
  }
  next();
});

module.exports = mongoose.model("Inventory", InventorySchema);
