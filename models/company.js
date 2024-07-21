const config = require("config");
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;
const USER_TYPES = Object.values(config.get("USER_TYPES"));
const CompanyModel = new Schema({
    name: {
        type: String
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
    registrationCertificate: {
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
    authorizedPersons: [{
        type: ObjectId,
        ref: 'User'
    }],
    license: {
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
    gst: {
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
    bankDetails: {
        accountName: {
            type: String
        },
        accountNumber: {
            type: String
        },
        ifscCode: {
            type: String
        },
        bankName: {
            type: String
        },
        cancelCheque: {
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
    directors: [{
        type: ObjectId,
        ref: 'User'
    }],
    proprietors: [{
        type: ObjectId,
        ref: 'User'
    }],
    partners: [{
        type: ObjectId,
        ref: 'User'
    }],
    documents: [{
        label: {
            type: String
        },
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
    }],
    companyType: {
        type: String,
        enum: ["Proprietorship", "Partnership", "PvtLimited"],
        required: true,
    },
    associateTo: {
        type: ObjectId,
        ref: 'User'
    },
    associateType: {
        type: String,
        enum: USER_TYPES
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'BLOCKED', 'PENDING', 'REJECTED'],
        default: 'ACTIVE'
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: ObjectId,
        ref: 'User'
    },
    createdByType: {
        type: String,
        enum: USER_TYPES
    },
    updateBy: {
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

CompanyModel.pre('find', function (next) {
    this.where({ isDeleted: false });
    next();
});

CompanyModel.pre('findOne', function (next) {
    this.where({ isDeleted: false });
    next();
});

CompanyModel.pre('findOneAndUpdate', function (next) {
    this.where({ isDeleted: false });
    next();
});

const Company = mongoose.model('Company', CompanyModel);
module.exports = Company;