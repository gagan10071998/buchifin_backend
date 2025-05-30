// models/Order.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;
const config = require("config");
const UNIT_TYPES = config.get("UNIT_TYPES");

// Order status and payment status constants
const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  READY_TO_SHIP: 'READY_TO_SHIP',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  RETURNED: 'RETURNED'
};

const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
  FAILED: 'FAILED'
};

// Reusable sub-schemas
const AddressSchema = new Schema({
  street: { type: String, trim: true, maxlength: 255 },
  city: { type: String, trim: true, maxlength: 50 },
  state: { type: String, trim: true, maxlength: 50 },
  postalCode: { type: String, trim: true, maxlength: 20 },
  country: { type: String, trim: true, maxlength: 50, default: 'India' }
}, { _id: false });

const ContactSchema = new Schema({
  phone: { type: String, required: true, trim: true, maxlength: 15 },
  email: { type: String, trim: true, lowercase: true, maxlength: 100 }
}, { _id: false });

const OrderItemSchema = new Schema({
  product: { type: ObjectId, ref: 'Product', required: true },
  productSnapshot: {
    name: { type: String, required: true },
    sku: { type: String, required: true },
    hsnCode: { type: String, required: true },
    basePrice: { type: Number, required: true },
    mrp: { type: Number },
    batchNumber: String,
    expiryDate: Date
  },
  quantity: { type: Number, required: true, min: 0.01 },
  unit: { type: String, enum: UNIT_TYPES, required: true },
  pricePerUnit: { type: Number, required: true, min: 0.01 },
  cgstPercentage: { type: Number, min: 0, max: 100 },
  cgstAmount: { type: Number, min: 0 },
  sgstPercentage: { type: Number, min: 0, max: 100 },
  sgstAmount: { type: Number, min: 0 },
  igstPercentage: { type: Number, min: 0, max: 100 },
  igstAmount: { type: Number, min: 0 },
  discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
  discountAmount: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 }
}, { _id: false });

const OrderSchema = new Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  orderDate: { type: Date, required: true, default: Date.now, index: true },

  // Reference to the customer (User or Company)
  customer: {
    type: ObjectId,
    required: true,
    refPath: 'customerModel',
    index: true
  },
  customerModel: {
    type: String,
    required: true,
    enum: ['User', 'Company']
  },

  // Optional order-level addresses (if different from the customer's default)
  billingAddress: { type: AddressSchema },
  shippingAddress: { type: AddressSchema },

  // Order items
  items: { 
    type: [OrderItemSchema], 
    required: true, 
    validate: [array => array.length > 0, 'At least one item is required'] 
  },

  // Financial details
  subTotal: { type: Number, required: true, min: 0 },
  taxDetails: {
    totalCGST: { type: Number, default: 0, min: 0 },
    totalSGST: { type: Number, default: 0, min: 0 },
    totalIGST: { type: Number, default: 0, min: 0 }
  },
  shippingCharges: { type: Number, default: 0, min: 0 },
  packagingCharges: { type: Number, default: 0, min: 0 },
  totalDiscount: { type: Number, default: 0, min: 0 },
  couponCode: { type: String, trim: true },
  couponDiscount: { type: Number, default: 0, min: 0 },
  grandTotal: { type: Number, required: true, min: 0 },

  // Payment details grouped into a sub-document
  payment: {
    status: { type: String, enum: Object.values(PAYMENT_STATUS), default: 'PENDING', index: true },
    method: { type: String, enum: ['CASH', 'CHEQUE', 'ONLINE', 'UPI', 'CREDIT'], required: true },
    transactionId: { type: String },
    paidAmount: { type: Number },
    paidAt: { type: Date },
    paymentGateway: { type: String },
    paymentNotes: { type: String }
  },

  // Order status and history
  status: { type: String, enum: Object.values(ORDER_STATUS), default: 'PENDING', index: true },
  statusHistory: [{
    status: { type: String, enum: Object.values(ORDER_STATUS) },
    timestamp: { type: Date, default: Date.now },
    comment: String,
    updatedBy: { type: ObjectId, ref: 'User' }
  }],

  // Shipping details (such as carrier info and tracking)
  shippingDetails: {
    provider: { type: String },
    trackingNumber: { type: String },
    trackingUrl: { type: String },
    expectedDeliveryDate: { type: Date },
    actualDeliveryDate: { type: Date },
    shippingNotes: { type: String }
  },

  // Additional fields
  notes: { type: String },
  tags: [{ type: String }],
  source: {
    type: String,
    enum: ['WEB', 'MOBILE', 'POS', 'MARKETPLACE'],
    default: 'WEB'
  },

  // Soft-delete and audit fields
  deletedAt: { type: Date },
  createdBy: { type: ObjectId, ref: 'User', required: true },
  updatedBy: { type: ObjectId, ref: 'User' }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.deletedAt;
      return ret;
    }
  }
});

// Sample indexes for performance
OrderSchema.index({ orderDate: -1, status: 1 });
OrderSchema.index({ orderNumber: 1, orderDate: -1 });

/**
 * Instance method to update order status and maintain history.
 */
OrderSchema.methods.updateStatus = async function(newStatus, comment, userId) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    comment,
    updatedBy: userId
  });
  await this.save();
};

OrderSchema.methods.cancel = async function(reason, userId) {
  if (this.status === ORDER_STATUS.DELIVERED) {
    throw new Error('Cannot cancel delivered order');
  }
  await this.updateStatus(ORDER_STATUS.CANCELLED, reason, userId);
};

module.exports = mongoose.model("Order", OrderSchema);
