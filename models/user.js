const config = require("config");
const USER_TYPES = Object.values(config.get("USER_TYPES"));
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;

const UserModel = new Schema({
  profilePic: {
    type: String,
    default: "/profilepics/defaultuser.jpg",
  },
  aadhaar: {
    number: {
      type: String
    },
    doc: {
      front: {
        type: ObjectId,
        ref: 'Document'
      },
      back: {
        type: ObjectId,
        ref: 'Document'
      }
    },
    note: { type: String }
  },
  pan: {
    number: {
      type: String
    },
    doc: {
      front: {
        type: ObjectId,
        ref: 'Document'
      },
      back: {
        type: ObjectId,
        ref: 'Document'
      }
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
    index: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['MALE', 'FEMALE', 'OTHER'],
    default: 'OTHER'
  },
  dob: {
    type: Date
  },
  address: [{
    addressType: {
      type: String
    },
    lat: {
      type: Number
    },
    long: {
      type: Number
    },
    address: String,
    city: String,
    state: String,
    district: String,
    country: String,
    zip: String,
  }],
  phone: [{
    phoneType: {
      type: String
    },
    phone: {
      type: String,
      trim: true,
      default: "",
      required: true,
    },
    countryCode: {
      type: String,
      trim: true,
      default: "91",
    }
  }],
  password: {
    type: String,
    required: true,
  },
  type: [{
    type: String,
    enum: USER_TYPES,
  }],
  status: {
    type: String,
    enum: ["ACTIVE", "INACTIVE", "BLOCKED", "PENDING", "REJECTED"],
    default: "ACTIVE",
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: ObjectId,
    ref: 'User'
  },
  createdByType: {
    type: String,
    enum: USER_TYPES
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
  }
);

UserModel.pre("find", function (next) {
  this.where({ isDeleted: false });
  next();
});


UserModel.pre("findOne", function (next) {
  this.where({ isDeleted: false });
  next();
});

UserModel.pre("findOneAndUpdate", function (next) {
  this.where({ isDeleted: false });
  next();
});

const User = mongoose.model("User", UserModel);
module.exports = User;
