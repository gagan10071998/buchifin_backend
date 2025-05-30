// models/Transaction.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;

const TRANSACTION_TYPES = {
  ORDER_PAYMENT: 'ORDER_PAYMENT',
  REFUND: 'REFUND',
  CREDIT_PAYMENT: 'CREDIT_PAYMENT',
  INVENTORY_ADJUSTMENT: 'INVENTORY_ADJUSTMENT',
  PURCHASE_PAYMENT: 'PURCHASE_PAYMENT'
};

const TRANSACTION_STATUS = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  PENDING: 'PENDING',
  REVERSED: 'REVERSED'
};

const TransactionSchema = new Schema({
  // References to related documents
  order: { type: ObjectId, ref: 'Order', index: true },
  invoice: { type: ObjectId, ref: 'Billing', index: true },

  // Transaction details
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    enum: Object.values(TRANSACTION_TYPES),
    required: true,
    index: true
  },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' }, // added currency field
  method: {
    type: String,
    enum: ['CASH', 'CHEQUE', 'ONLINE', 'UPI', 'CREDIT'],
    required: true
  },
  status: {
    type: String,
    enum: Object.values(TRANSACTION_STATUS),
    default: 'PENDING',
    index: true
  },

  // Payment Gateway details (if applicable)
  gateway: {
    name: String,
    referenceId: String,
    response: Schema.Types.Mixed
  },

  // Additional metadata
  notes: { type: String },
  createdBy: { type: ObjectId, ref: 'User', required: true },
  updatedBy: { type: ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Sample indexes for performance
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ type: 1, status: 1 });

module.exports = {
  TransactionModel: mongoose.model("Transaction", TransactionSchema),
  TRANSACTION_TYPES,
  TRANSACTION_STATUS
};
