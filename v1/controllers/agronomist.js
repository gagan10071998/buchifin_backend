const config = require("config");
const validations = require("../validations");
const USER_TYPES = config.get("USER_TYPES");
const universal = require("../../utils");
const MESSAGES = require("../../constants").Messages;
const CODES = require("../../constants").Codes;
const Models = require("../../models");
const ObjectId = require("mongoose").Types.ObjectId;
const path = require('path');

const s3Upload = async (filePayload, req, documentType) => {
    let s3Response = await universal.uploadFileToS3(filePayload);
    let documentPayload = {
        etag: s3Response['ETag'],
        s3Key: s3Response['Key'],
        url: s3Response['Location'],
        extension: path.extname(filePayload.originalname),
        ...filePayload,
        documentType,
        uploadedBy: req.user._id,
        uploadedByType: req.userType
    };
    delete documentPayload.Buffer;
    return documentPayload;
}
module.exports = {
    create: async (req, res, next) => {
        try {
            const agronomist = req.body;

            const emailExists = await Models.User.findOne({ email: agronomist.email });
            if (emailExists) {
                return universal.response(res, CODES.BAD_REQUEST, MESSAGES.EMAIL_ALREADY_ASSOCIATED_WITH_ANOTHER_ACCOUNT, {}, req.lang);
            }

            const phoneExists = await Models.User.findOne({ "phone.phone": agronomist.phone[0].phone });
            if (phoneExists) {
                return universal.response(res, CODES.BAD_REQUEST, MESSAGES.PHONE_ALREADY_ASSOCIATED_WITH_ANOTHER_ACCOUNT, {}, req.lang);
            }

            agronomist.createdBy = req.user._id;
            agronomist.createdByType = req.userType;
            agronomist.password = await universal.hashPasswordUsingBcrypt(agronomist.password)
            agronomist.type = [USER_TYPES.AGRONOMIST];

            if (req.files['aadhaar[doc][front]']) {
                let docPayload = await s3Upload(req.files['aadhaar[doc][front]'][0], req, 'aadhaar')
                const doc = await new Models.Document(docPayload).save();
                req.body.aadhaar = {
                    ...req.body.aadhaar,
                    doc: {
                        front: doc._id,
                    }
                }
            }
            if (req.files['aadhaar[doc][back]']) {
                let docPayload = await s3Upload(req.files['aadhaar[doc][back]'][0], req, 'aadhaar')
                const doc = await new Models.Document(docPayload).save();
                req.body.aadhaar.doc.back = doc._id
            }
            if (req.files['pan[doc][front]']) {
                let docPayload = await s3Upload(req.files['pan[doc][front]'][0], req, 'pan')
                const doc = await new Models.Document(docPayload).save();
                req.body.pan = {
                    ...req.body.pan,
                    doc: {
                        front: doc._id,
                    }
                }

            }
            if (req.files['pan[doc][back]']) {
                let docPayload = await s3Upload(req.files['pan[doc][back]'][0], req, 'pan')
                const doc = await new Models.Document(docPayload).save();
                req.body.pan.doc.back = doc._id
            }
            if (req.files['bankDetails[cancelCheque][front]']) {
                let docPayload = await s3Upload(req.files['bankDetails[cancelCheque][front]'][0], req, 'bankDetails')
                const doc = await new Models.Document(docPayload).save();
                req.body.bankDetails = {
                    ...req.body.bankDetails,
                    cancelCheque: {
                        front: doc._id,
                    }
                }
            }
            if (req.files['bankDetails[cancelCheque][back]']) {
                let docPayload = await s3Upload(req.files['bankDetails[cancelCheque][back]'][0], req, 'bankDetails')
                const doc = await new Models.Document(docPayload).save();
                req.body.bankDetails.cancelCheque.back = doc._id
            }

            for (let i = 0; i < 3; i++) {
                if (req.files[`qualificationDocs[${i}][doc]`]) {
                    let docPayload = await s3Upload(req.files[`qualificationDocs[${i}][doc]`][0], req, 'qualificationDocs');
                    const doc = await new Models.Document(docPayload).save();
                    req.body.qualificationDocs[i].doc = doc._id;
                }
            }

            await new Models.User(agronomist).save();

            return universal.response(res, CODES.OK, MESSAGES.RETAILER_REGISTERED_SUCCESSFULLY, {})

        } catch (error) {
            console.log(error)
            next(error);
        }
    },
    getAll: async (req, res, next) => {
        try {
            const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
            const itemsPerPage = Math.max(10, Number.parseInt(req.query.limit, 10) || 10);
            const skipDocs = (page - 1) * itemsPerPage;

            const searchQuery = req.query.search || '';

            const countPipeline = [
                { $match: { type: USER_TYPES.AGRONOMIST, isDeleted: false } },
                {
                    $match: {
                        $or: [
                            { 'name': new RegExp(searchQuery, 'i') },
                            { 'email': new RegExp(searchQuery, 'i') },
                            { 'phone.phone': new RegExp(searchQuery, 'i') },
                            { 'address.address': new RegExp(searchQuery, 'i') },
                            { 'address.city': new RegExp(searchQuery, 'i') },
                            { 'address.state': new RegExp(searchQuery, 'i') },
                            { 'address.district': new RegExp(searchQuery, 'i') },
                            { 'address.country': new RegExp(searchQuery, 'i') },
                            { 'address.zip': new RegExp(searchQuery, 'i') }
                        ]
                    }
                }
            ];

            const pipeline = [
                { $match: { type: config.get("USER_TYPES.AGRONOMIST"), isDeleted: false } },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'createdBy',
                        foreignField: '_id',
                        as: 'createdBy'
                    }
                },
                { $unwind: '$createdBy' },
                {
                    $match: {
                        $or: [
                            { 'name': new RegExp(searchQuery, 'i') },
                            { 'email': new RegExp(searchQuery, 'i') },
                            { 'phone.phone': new RegExp(searchQuery, 'i') },
                            { 'address.address': new RegExp(searchQuery, 'i') },
                            { 'address.city': new RegExp(searchQuery, 'i') },
                            { 'address.state': new RegExp(searchQuery, 'i') },
                            { 'address.district': new RegExp(searchQuery, 'i') },
                            { 'address.country': new RegExp(searchQuery, 'i') },
                            { 'address.zip': new RegExp(searchQuery, 'i') }
                        ]
                    }
                },
                {
                    $project: {
                        type: 1,
                        name: 1,
                        email: 1,
                        address: 1,
                        dob: 1,
                        gender: 1,
                        profilePic: 1,
                        phone: 1,
                        status: 1,
                        'createdBy.name': 1,
                        'createdBy.email': 1
                    }
                },
                { $sort: { createdAt: -1 } },
                { $skip: skipDocs },
                { $limit: itemsPerPage }
            ]

            const retailers = await Models.User.aggregate(pipeline).exec();
            const totalRetailers = (await Models.User.aggregate(countPipeline).exec()).length;

            const result = {
                status: CODES.OK,
                message: MESSAGES.DATA_FETCHED_SUCCESSFULLY,
                data: {
                    records: retailers,
                    page,
                    count: totalRetailers,
                    totalPages: Math.ceil(totalRetailers / itemsPerPage)
                }
            };

            return universal.response(res, result.status, result.message, result.data, req.lang);

        } catch (error) {
            console.log(error);
            next(error);
        }
    },
    getById: async (req, res, next) => {
        try {

            const pipeline = [
                { $match: { type: config.get("USER_TYPES.AGRONOMIST"), isDeleted: false, _id: new ObjectId(req.params.id) } },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'createdBy',
                        foreignField: '_id',
                        as: 'createdBy'
                    }
                },
                { $unwind: '$createdBy' },
                {
                    $project: {
                        type: 1,
                        name: 1,
                        email: 1,
                        address: 1,
                        dob: 1,
                        gender: 1,
                        profilePic: 1,
                        phone: 1,
                        status: 1,
                        'createdBy.name': 1,
                        'createdBy.email': 1
                    }
                }
            ]

            const retailer = await Models.User.aggregate(pipeline).exec();
            if (!retailer.length) {
                return await universal.response(res, CODES.BAD_REQUEST, MESSAGES.RETAILER_NO_FOUND, {})
            }

            const result = {
                status: CODES.OK,
                message: MESSAGES.DATA_FETCHED_SUCCESSFULLY,
                data: retailer[0]
            };

            return universal.response(res, result.status, result.message, result.data, req.lang);

        } catch (error) {
            console.log(error);
            next(error);
        }
    },
};