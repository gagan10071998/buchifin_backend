const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;

const TransactionSchema = new Schema({
  inventory: {
    type: ObjectId,
    ref: 'Inventory',
    required: true
  },
  product: {
    type: ObjectId,
    ref: 'Product',
    required: true
  },
  type: {
    type: String,
    enum: ['ADD', 'REMOVE', 'SALE', 'PURCHASE', 'UPDATE'],
    required: true
  },
  details: {
    type: Object,
    required: true
  },
  user: {
    type: ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Transaction", TransactionSchema); 