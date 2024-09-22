const config = require("config");
const validations = require("../validations");
const USER_TYPES = config.get("USER_TYPES");
const universal = require("../../utils");
const MESSAGES = require("../../constants").Messages;
const CODES = require("../../constants").Codes;
const Models = require("../../models");
const ObjectId = require("mongoose").Types.ObjectId;

module.exports = {
  createCategory: async (req, res, next) => {
    try {

      req.body.createdBy = req.user._id;
      req.body.createdByType = req.userType;
      req.body.createdBy = req.user._id
      req.body.createdByType = req.userType

      await new Models.Category(req.body).save();
      return universal.response(res, CODES.OK, MESSAGES.CATEGORY_REGISTERED_SUCCESSFULLY, {})

    } catch (error) {
      console.log(error)
      next(error);
    }
  },
  getAllCategories: async (req, res, next) => {
    try {
      const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
      const itemsPerPage = Math.max(10, Number.parseInt(req.query.limit, 10) || 10);
      const skipDocs = (page - 1) * itemsPerPage;

      const searchQuery = req.query.search || '';

      const countPipeline = [
        { $match: { isDeleted: false } },
      ];

      const pipeline = [
        { $match: { isDeleted: false } },
        { $sort: { createdAt: -1 } },
        { $skip: skipDocs },
        { $limit: itemsPerPage }
      ]

      const categories = await Models.Category.aggregate(pipeline).exec();
      const totalCategories = (await Models.Category.aggregate(countPipeline).exec()).length;

      const result = {
        status: CODES.OK,
        message: MESSAGES.DATA_FETCHED_SUCCESSFULLY,
        data: {
          records: categories,
          page,
          count: totalCategories,
          totalPages: Math.ceil(totalCategories / itemsPerPage)
        }
      };

      return universal.response(res, result.status, result.message, result.data, req.lang);

    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  getCategoryById: async (req, res, next) => {
    try {

      const category = await Models.Category.findOne({ _id: new ObjectId(req.params.id)});
      const result = {
        status: CODES.OK,
        message: MESSAGES.DATA_FETCHED_SUCCESSFULLY,
        data: category
      };

      return universal.response(res, result.status, result.message, result.data, req.lang);

    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  updateCategoryById: async (req, res, next) => {
    try {
      await Models.Category.updateOne({_id: new ObjectId(req.params.id)}, req.body).lean()

      return await universal.response(res,CODES.OK, MESSAGES.DATA_FETCHED_SUCCESSFULLY, {}, req.lang)

    } catch (error) {
      console.log(error);
      next(error);
    }
  },
};