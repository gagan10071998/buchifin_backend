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
      const { retailer, firm } = req.body;

      const emailExists = await Models.User.findOne({ email: retailer.email });
      if (emailExists) {
        return universal.response(res, CODES.BAD_REQUEST, MESSAGES.EMAIL_ALREADY_ASSOCIATED_WITH_ANOTHER_ACCOUNT, {}, req.lang);
      }

      const phoneExists = await Models.User.findOne({ "phone.phone": retailer.phone[0].phone });
      if (phoneExists) {
        return universal.response(res, CODES.BAD_REQUEST, MESSAGES.PHONE_ALREADY_ASSOCIATED_WITH_ANOTHER_ACCOUNT, {}, req.lang);
      }

      retailer.createdBy = req.user._id;
      retailer.createdByType = req.userType;
      retailer.password = await universal.hashPasswordUsingBcrypt(retailer.password)
      retailer.type = [USER_TYPES.RETAILER_ADMIN];

      const savedRetailer = await new Models.User(retailer).save();

      firm.associateTo = savedRetailer._id
      firm.associateType = USER_TYPES.RETAILER_ADMIN
      firm.createdBy = req.user._id
      firm.createdByType = req.userType

      const savedFirm = await new Models.Company(firm).save();
      return universal.response(res, CODES.OK, MESSAGES.RETAILER_REGISTERED_SUCCESSFULLY, {
        retailer: savedRetailer,
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
        { $match: { type: config.get("USER_TYPES.RETAILER_ADMIN"), isDeleted: false } },
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
        { $match: { type: config.get("USER_TYPES.RETAILER_ADMIN"), isDeleted: false } },
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
        { $match: { type: config.get("USER_TYPES.RETAILER_ADMIN"), isDeleted: false, _id: new ObjectId(req.params.id) } },
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
};