const config = require("config");
const validations = require("../validations");
const USER_TYPES = config.get("USER_TYPES");
const universal = require("../../utils");
const MESSAGES = require("../../constants").Messages;
const CODES = require("../../constants").Codes;
const Models = require("../../models");
const ObjectId = require("mongoose").Types.ObjectId;

module.exports = {
  create: async (req, res, next) => {
    try {
      const { manufacturer, firm } = req.body;

      const emailExists = await Models.User.findOne({ email: manufacturer.email });
      if (emailExists) {
        return universal.response(res, CODES.BAD_REQUEST, MESSAGES.EMAIL_ALREADY_ASSOCIATED_WITH_ANOTHER_ACCOUNT, {}, req.lang);
      }

      const phoneExists = await Models.User.findOne({ "phone.phone": manufacturer.phone[0].phone });
      if (phoneExists) {
        return universal.response(res, CODES.BAD_REQUEST, MESSAGES.PHONE_ALREADY_ASSOCIATED_WITH_ANOTHER_ACCOUNT, {}, req.lang);
      }

      manufacturer.createdBy = req.user._id;
      manufacturer.createdByType = req.userType;
      manufacturer.password = await universal.hashPasswordUsingBcrypt(manufacturer.password)
      manufacturer.type = [USER_TYPES.MANUFACTURER_ADMIN];

      const savedmanufacturer = await new Models.User(manufacturer).save();

      firm.associateTo = savedmanufacturer._id
      firm.associateType = USER_TYPES.MANUFACTURER_ADMIN
      firm.createdBy = req.user._id
      firm.createdByType = req.userType

      const savedFirm = await new Models.Company(firm).save();
      return universal.response(res, CODES.OK, MESSAGES.MANUFACTURER_REGISTERED_SUCCESSFULLY, {
        manufacturer: savedmanufacturer,
        firm: savedFirm
      })

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
        { $match: { type: config.get("USER_TYPES.MANUFACTURER_ADMIN"), isDeleted: false } },
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
        { $match: { type: config.get("USER_TYPES.MANUFACTURER_ADMIN"), isDeleted: false } },
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

      const manufacturers = await Models.User.aggregate(pipeline).exec();
      const totalmanufacturers = (await Models.User.aggregate(countPipeline).exec()).length;

      const result = {
        status: CODES.OK,
        message: MESSAGES.DATA_FETCHED_SUCCESSFULLY,
        data: {
          records: manufacturers,
          page,
          count: totalmanufacturers,
          totalPages: Math.ceil(totalmanufacturers / itemsPerPage)
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
        { $match: { type: config.get("USER_TYPES.MANUFACTURER_ADMIN"), isDeleted: false, _id: new ObjectId(req.params.id) } },
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

      const manufacturer = await Models.User.aggregate(pipeline).exec();
      if (!manufacturer.length) {
        return await universal.response(res, CODES.BAD_REQUEST, MESSAGES.manufacturer_NO_FOUND, {})
      }

      const result = {
        status: CODES.OK,
        message: MESSAGES.DATA_FETCHED_SUCCESSFULLY,
        data: manufacturer[0]
      };

      return universal.response(res, result.status, result.message, result.data, req.lang);

    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  updateById: async (req, res, next) => {
    try {
      await Models.User.updateOne({_id: new ObjectId(req.params.id)}, req.body).lean()

      return await universal.response(res,CODES.OK, MESSAGES.DATA_FETCHED_SUCCESSFULLY, {}, req.lang)

    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  getFirms: async (req, res, next) => {
    try {

      let firm = await Models.Company.findOne({associateTo: new ObjectId(req.params.id)}).lean()
      if (firm && firm.partners) {
        const partnersDetails = await Promise.all(
          firm.partners.map(partnerId => Models.User.findOne({_id: partnerId}))
        );
        firm.partners = partnersDetails;
      }
      const result = {
        status: CODES.OK,
        message: MESSAGES.DATA_FETCHED_SUCCESSFULLY,
        data: firm
      };

      return universal.response(res, result.status, result.message, result.data, req.lang);

    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  createBatch: async (req, res, next) => {
    try {

      req.body.createdBy = req.user._id;
      req.body.createdByType = req.userType;
      req.body.createdBy = req.user._id
      req.body.createdByType = req.userType

      await new Models.Batch(req.body).save();
      return universal.response(res, CODES.OK, MESSAGES.MANUFACTURER_REGISTERED_SUCCESSFULLY, {})

    } catch (error) {
      console.log(error)
      next(error);
    }
  },
  getAllBatches: async (req, res, next) => {
    try {
      const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
      const itemsPerPage = Math.max(10, Number.parseInt(req.query.limit, 10) || 10);
      const skipDocs = (page - 1) * itemsPerPage;

      const searchQuery = req.query.search || '';

      const countPipeline = [
        { $match: { manufacturer: new ObjectId(req.query.manufacturer), isDeleted: false } },
      ];

      const pipeline = [
        { $match: { manufacturer: new ObjectId(req.query.manufacturer), isDeleted: false } },
        { $sort: { createdAt: -1 } },
        { $skip: skipDocs },
        { $limit: itemsPerPage }
      ]

      const batches = await Models.Batch.aggregate(pipeline).exec();
      const totalBatches = (await Models.Batch.aggregate(countPipeline).exec()).length;

      const result = {
        status: CODES.OK,
        message: MESSAGES.DATA_FETCHED_SUCCESSFULLY,
        data: {
          records: batches,
          page,
          count: totalBatches,
          totalPages: Math.ceil(totalBatches / itemsPerPage)
        }
      };

      return universal.response(res, result.status, result.message, result.data, req.lang);

    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  getBatchById: async (req, res, next) => {
    try {

      const batch = await Models.Batch.findOne({ _id: new ObjectId(req.params.id)});
      const result = {
        status: CODES.OK,
        message: MESSAGES.DATA_FETCHED_SUCCESSFULLY,
        data: batch
      };

      return universal.response(res, result.status, result.message, result.data, req.lang);

    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  updateBatchById: async (req, res, next) => {
    try {
      await Models.Batch.updateOne({_id: new ObjectId(req.params.id)}, req.body).lean()

      return await universal.response(res,CODES.OK, MESSAGES.DATA_FETCHED_SUCCESSFULLY, {}, req.lang)

    } catch (error) {
      console.log(error);
      next(error);
    }
  },

};