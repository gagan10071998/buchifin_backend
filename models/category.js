const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;

const CategorySchema = new Schema({
  name: {
    type: String,
    trim: true,
    required: true,
    unique: true,
    index: true
  },
  description: {
    type: String,
    trim: true,
  },
  parentCategory: {
    type: ObjectId,
    ref: 'Category',
    default: null
  },
  status: {
    type: String,
    enum: ["ACTIVE", "INACTIVE"],
    default: "ACTIVE",
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
  },
  isDeleted: {
    type: Boolean,
    default: false,
  }
},
{
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
});

CategorySchema.pre("find", function (next) {
  this.where({ isDeleted: false });
  next();
});

CategorySchema.pre("findOne", function (next) {
  this.where({ isDeleted: false });
  next();
});

CategorySchema.pre("findOneAndUpdate", function (next) {
  this.where({ isDeleted: false });
  next();
});

const Category = mongoose.model("Category", CategorySchema);
module.exports = Category;
