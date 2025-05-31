const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;
const config = require("config");
const USER_TYPES = Object.values(config.get("USER_TYPES"));
const GSTIN_REGEX = config.get("REGEX_PATTERNS").GSTIN;
const UNIT_TYPES = config.get("UNIT_TYPES");
const BUSINESS_RELATIONS = config.get("BUSINESS_RELATIONS");

// Constants
const BUYER_TYPES = {
  CUSTOMER: 'CUSTOMER',
  RETAILER: 'RETAILER',
  DISTRIBUTOR: 'DISTRIBUTOR',
  MANUFACTURER: 'MANUFACTURER'
};

const SELLER_TYPES = {
  RETAILER: 'RETAILER',
  DISTRIBUTOR: 'DISTRIBUTOR',
  MANUFACTURER: 'MANUFACTURER'
};

const GSTRegistrationType = {
  REGULAR: 'REGULAR',
  COMPOSITION: 'COMPOSITION',
  UNREGISTERED: 'UNREGISTERED'
};

// Sub-schemas
const AddressSchema = new Schema({
  street: { type: String, trim: true, maxlength: 255 },
  city: { type: String, trim: true, maxlength: 50 },
  state: { type: String, trim: true, maxlength: 50 },
  postalCode: { type: String, trim: true, maxlength: 20 },
  country: { type: String, trim: true, maxlength: 50, default: 'India' }
});

const ContactSchema = new Schema({
  phone: { type: String, required: true, trim: true, maxlength: 15 },
  email: { type: String, trim: true, lowercase: true, maxlength: 100 }
});

const GSTDetailsSchema = new Schema({
  legalName: { type: String, trim: true, maxlength: 100 },
  tradeName: { type: String, trim: true, maxlength: 100 },
  gstin: {
    type: String,
    trim: true,
    uppercase: true,
    validate: {
      validator: v => GSTIN_REGEX.test(v),
      message: "Invalid GSTIN format"
    }
  },
  registrationType: {
    type: String,
    enum: Object.values(GSTRegistrationType),
    required: true
  },
  registrationDate: Date,
  businessPAN: { 
    type: String, 
    trim: true, 
    uppercase: true,
    validate: {
      validator: v => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v),
      message: "Invalid PAN format"
    }
  },
  businessAddress: { type: AddressSchema, required: true },
  taxLiability: {
    sgst: { type: Boolean, default: false },
    cgst: { type: Boolean, default: false },
    igst: { type: Boolean, default: false }
  },
  eCommerceOperator: { type: Boolean, default: false },
  thresholdLimit: Number,
  verified: { type: Boolean, default: false }
});

const BuyerSnapshotSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  contact: { type: ContactSchema, required: true },
  billingAddress: { type: AddressSchema, required: true },
  shippingAddress: AddressSchema,
  gstDetails: GSTDetailsSchema,
  registeredSince: { type: Date, required: true }
});

const BillItemSchema = new Schema({
  product: { 
    type: ObjectId, 
    ref: 'Product',
    required: true 
  },
  productSnapshot: {
    name: { type: String, required: true },
    hsnCode: { type: String, required: true },
    basePrice: { type: Number, required: true },
    mrp: { type: Number },
    batchNumber: String,
    expiryDate: Date
  },
  quantity: { type: Number, required: true, min: 0.01 },
  unit: { type: String, enum: UNIT_TYPES, required: true },
  pricePerUnit: { type: Number, required: true, min: 0.01 },
  cgstPercentage: { type: Number, required: true, min: 0, max: 100 },
  cgstAmount: { type: Number, required: true, min: 0 },
  sgstPercentage: { type: Number, required: true, min: 0, max: 100 },
  sgstAmount: { type: Number, required: true, min: 0 },
  discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
  discountAmount: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 }
}, { _id: false });

// Main Billing Schema
const BillingSchema = new Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
    maxlength: 20
  },
  invoiceDate: { type: Date, required: true, index: true },
  placeOfSupply: { type: String, required: true, trim: true, maxlength: 50 },
  
  // Seller Information
  sellerId: {
    type: ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  sellerSnapshot: {
    name: { type: String, required: true },
    gstDetails: { type: GSTDetailsSchema, required: true },
    address: { type: AddressSchema, required: true },
    contact: { type: ContactSchema, required: true }
  },
  
  // Buyer Information
  buyerId: {
    type: ObjectId,
    required: true,
    refPath: 'buyerModel',
    index: true
  },
  buyerModel: {
    type: String,
    required: true,
    enum: ['User', 'Company'],
    default: 'Company'
  },
  buyerSnapshot: { type: BuyerSnapshotSchema, required: true },
  buyerType: {
    type: String,
    enum: Object.values(BUYER_TYPES),
    required: true,
    index: true
  },
  
  // Sales Type Classification
  saleType: {
    type: String,
    enum: ['BUSINESS_SALE', 'CUSTOMER_SALE'],
    required: true,
    index: true
  },
  
  // Transaction Details
  items: { 
    type: [BillItemSchema], 
    required: true, 
    validate: [array => array.length > 0, 'At least one item required'] 
  },
  subTotal: { type: Number, required: true, min: 0 },
  totalCGST: { type: Number, required: true, min: 0 },
  totalSGST: { type: Number, required: true, min: 0 },
  totalIGST: { type: Number, default: 0, min: 0 },
  totalDiscount: { type: Number, required: true, default: 0, min: 0 },
  grandTotal: { type: Number, required: true, min: 0 },
  tcsAmount: { type: Number, default: 0, min: 0 },
  roundOff: { type: Number, default: 0 },
  
  // Payment Details
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE'],
    default: 'PENDING',
    index: true
  },
  paymentTerms: {
    dueDate: Date,
    lateFeePercentage: { type: Number, min: 0 },
    paymentMode: {
      type: String,
      enum: ['CASH', 'CHEQUE', 'ONLINE', 'CREDIT']
    },
    partialPayments: [{
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      reference: { type: String, trim: true },
      mode: { type: String, enum: ['CASH', 'CHEQUE', 'ONLINE'] }
    }]
  },
  
  // Logistics
  transportDetails: {
    transporterName: { type: String, trim: true, maxlength: 100 },
    vehicleNumber: { type: String, trim: true, uppercase: true },
    eWaybillNumber: { type: String, trim: true, index: true },
    distance: { type: Number, min: 0 },
    shipmentDate: Date
  },
  
  // Metadata
  status: {
    type: String,
    enum: ['DRAFT', 'GENERATED', 'CANCELLED', 'ARCHIVED'],
    default: 'DRAFT',
    index: true
  },
  deletedAt: Date,
  createdBy: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: ObjectId,
    ref: 'User'
  },
  version: { type: Number, default: 1 }
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

// ======================
// PRE-SAVE HOOKS
// ======================

BillingSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Auto-determine sale type
    this.saleType = this.buyerType === BUYER_TYPES.CUSTOMER 
      ? 'CUSTOMER_SALE' 
      : 'BUSINESS_SALE';

    // Populate buyer snapshot
    const BuyerModel = mongoose.model(this.buyerModel);
    const buyer = await BuyerModel.findById(this.buyerId)
      .select('name email phone address gstDetails createdAt')
      .lean();

    this.buyerSnapshot = {
      name: buyer.name,
      contact: {
        phone: buyer.phone,
        email: buyer.email
      },
      billingAddress: buyer.address,
      gstDetails: buyer.gstDetails,
      registeredSince: buyer.createdAt
    };

    // Populate seller snapshot
    const seller = await mongoose.model('Company').findById(this.sellerId)
      .select('name gstDetails address contact')
      .lean();

    this.sellerSnapshot = {
      name: seller.name,
      gstDetails: seller.gstDetails,
      address: seller.address,
      contact: seller.contact
    };
  }

  if (this.isModified('items') && this.status === 'DRAFT') {
    // Recalculate financials with IGST support
    this.items.forEach(item => {
      const baseAmount = item.quantity * item.pricePerUnit;
      const taxPercentage = this.saleType === 'BUSINESS_SALE' 
        ? (item.cgstPercentage + item.sgstPercentage)
        : item.igstPercentage;

      item.cgstAmount = this.saleType === 'BUSINESS_SALE' 
        ? (baseAmount * item.cgstPercentage) / 100 
        : 0;
      
      item.sgstAmount = this.saleType === 'BUSINESS_SALE' 
        ? (baseAmount * item.sgstPercentage) / 100 
        : 0;
      
      item.igstAmount = this.saleType === 'CUSTOMER_SALE' 
        ? (baseAmount * taxPercentage) / 100 
        : 0;

      item.discountAmount = (baseAmount * item.discountPercentage) / 100;
      item.totalAmount = baseAmount + item.cgstAmount + item.sgstAmount 
        + item.igstAmount - item.discountAmount;
    });

    this.subTotal = this.items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
    this.totalCGST = this.items.reduce((sum, item) => sum + item.cgstAmount, 0);
    this.totalSGST = this.items.reduce((sum, item) => sum + item.sgstAmount, 0);
    this.totalIGST = this.items.reduce((sum, item) => sum + item.igstAmount, 0);
    this.totalDiscount = this.items.reduce((sum, item) => sum + item.discountAmount, 0);
    this.grandTotal = this.subTotal + this.totalCGST + this.totalSGST + this.totalIGST 
      - this.totalDiscount + this.tcsAmount;
    this.roundOff = this.grandTotal - Math.round(this.grandTotal);
    this.grandTotal = Math.round(this.grandTotal);
  }

  next();
});

// ======================
// VALIDATIONS
// ======================

BillingSchema.pre('validate', async function(next) {
  // GST validations
  if (this.saleType === 'BUSINESS_SALE') {
    if (!this.buyerSnapshot.gstDetails?.gstin) {
      return next(new Error('Business sales require buyer GSTIN'));
    }
    if (!this.sellerSnapshot.gstDetails?.verified) {
      return next(new Error('Seller GST details not verified'));
    }
  }

  // Business relationship validation
  const isValid = BUSINESS_RELATIONS[this.sellerSnapshot.gstDetails?.gstin?.substring(0,2)]
    ?.includes(this.buyerType);
  
  if (!isValid) {
    return next(new Error(`Invalid business relationship: ${this.sellerType} -> ${this.buyerType}`));
  }

  next();
});

// ======================
// INDEXES
// ======================

BillingSchema.index({ saleType: 1, buyerType: 1 });
BillingSchema.index({ 'sellerSnapshot.gstDetails.gstin': 1 });
BillingSchema.index({ 'buyerSnapshot.gstDetails.gstin': 1 });
BillingSchema.index({ invoiceDate: -1, grandTotal: 1 });

// ======================
// VIRTUALS & METHODS
// ======================

BillingSchema.virtual('gstSummary').get(function() {
  return {
    taxableValue: this.subTotal,
    totalTax: this.totalCGST + this.totalSGST + this.totalIGST,
    cgst: this.totalCGST,
    sgst: this.totalSGST,
    igst: this.totalIGST,
    placeOfSupply: this.placeOfSupply,
    sellerGST: this.sellerSnapshot.gstDetails.gstin,
    buyerGST: this.buyerSnapshot.gstDetails?.gstin
  };
});

BillingSchema.virtual('formattedInvoice').get(function() {
  const year = this.invoiceDate.getFullYear();
  return `INV/${year}/${this.invoiceNumber.padStart(5, '0')}`;
});

// Query Helpers
BillingSchema.query.bySaleType = function(type) {
  return this.where({ saleType: type });
};

BillingSchema.query.byBusinessType = function(type) {
  return this.where({ buyerType: type });
};

BillingSchema.query.withGST = function() {
  return this.where({ 'sellerSnapshot.gstDetails.verified': true });
};

// Methods
BillingSchema.methods.softDelete = async function() {
  this.deletedAt = new Date();
  await this.save();
};

BillingSchema.methods.addPayment = async function(paymentData) {
  if (this.paymentStatus === 'PAID') {
    throw new Error('Invoice already fully paid');
  }

  this.paymentTerms.partialPayments.push(paymentData);
  const paidAmount = this.paymentTerms.partialPayments
    .reduce((sum, p) => sum + p.amount, 0);
  
  this.paymentStatus = paidAmount >= this.grandTotal ? 'PAID' 
    : paidAmount > 0 ? 'PARTIAL' 
    : 'PENDING';

  await this.save();
};

module.exports = {
  BillingModel: mongoose.model("Billing", BillingSchema),
  BUYER_TYPES,
  SELLER_TYPES,
  GSTRegistrationType
};