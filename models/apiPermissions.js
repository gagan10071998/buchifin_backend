const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ApiPermissionModel = new Schema({
    path: {
        type: String,
        default: "",
        lowercase: true,
    },
    GET: {
        auth: {
            type: Boolean,
            default: true,
            required: true
        },
        value: {
            type: Boolean,
            default: false,
            required: false
        }
    },
    POST: {
        auth: {
            type: Boolean,
            default: true,
            required: true
        },
        value: {
            type: Boolean,
            default: false,
            required: false
        }
    },
    PUT: {
        auth: {
            type: Boolean,
            default: true,
            required: true
        },
        value: {
            type: Boolean,
            default: false,
            required: false
        }
    },
    DELETE: {
        auth: {
            type: Boolean,
            default: true,
            required: true
        },
        value: {
            type: Boolean,
            default: false,
            required: false
        }
    },
    userType: {
        type: String,
        enum: ['SUPER_ADMIN', 'ADMIN', 'NEUTRAL', 'CORE_MANAGER', 'CASE_MANAGER', 'GOVT_ADMIN', 'DISTRICT_ADMIN', 'TALUKA_ADMIN', 'ENTERPRISE_ADMIN', 'ALL']
    }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});
const ApiPermission = mongoose.model('apipermissions', ApiPermissionModel);
module.exports = ApiPermission;