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

  /**
   * Get Parent Categories List
   * 
   * @description Fetches all categories that are parent categories (no parentCategory field or parentCategory is null)
   * @route GET /api/v1/category/parents
   * @access Protected (requires authentication)
   * 
   * @query {number} [page=1] - Page number for pagination
   * @query {number} [limit=10] - Number of items per page
   * @query {string} [search] - Search term to filter categories by name
   * 
   * @returns {Object} response
   * @returns {Array} response.records - Array of parent categories
   * @returns {number} response.page - Current page number
   * @returns {number} response.count - Total count of parent categories
   * @returns {number} response.totalPages - Total number of pages
   * 
   * @example
   * // GET /api/v1/category/parents?page=1&limit=10&search=herb
   * 
   * // Response:
   * {
   *   "success": true,
   *   "message": "Parent categories fetched successfully",
   *   "data": {
   *     "records": [
   *       {
   *         "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
   *         "name": "Herbicide",
   *         "description": "Weed control products",
   *         "status": "ACTIVE",
   *         "createdAt": "2023-01-01T00:00:00.000Z"
   *       }
   *     ],
   *     "page": 1,
   *     "count": 5,
   *     "totalPages": 1
   *   }
   * }
   */
  getParentCategories: async (req, res, next) => {
    try {
      const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
      const itemsPerPage = Math.max(10, Number.parseInt(req.query.limit, 10) || 10);
      const skipDocs = (page - 1) * itemsPerPage;
      const searchQuery = req.query.search || '';

      // Build match condition for parent categories (no parentCategory or parentCategory is null)
      const matchCondition = {
        isDeleted: false,
        $or: [
          { parentCategory: null },
          { parentCategory: { $exists: false } }
        ]
      };

      // Add search functionality if search query provided
      if (searchQuery) {
        matchCondition.name = { $regex: searchQuery, $options: 'i' };
      }

      const countPipeline = [
        { $match: matchCondition }
      ];

      const pipeline = [
        { $match: matchCondition },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1
          }
        },
        { $sort: { name: 1 } }, // Sort alphabetically by name
        { $skip: skipDocs },
        { $limit: itemsPerPage }
      ];

      const [parentCategories, totalCount] = await Promise.all([
        Models.Category.aggregate(pipeline).exec(),
        Models.Category.aggregate([...countPipeline, { $count: "total" }]).exec()
      ]);

      const totalParentCategories = totalCount.length > 0 ? totalCount[0].total : 0;

      const result = {
        status: CODES.OK,
        message: "Parent categories fetched successfully",
        data: {
          records: parentCategories,
          page,
          count: totalParentCategories,
          totalPages: Math.ceil(totalParentCategories / itemsPerPage)
        }
      };

      return universal.response(res, result.status, result.message, result.data, req.lang);

    } catch (error) {
      console.log(error);
      next(error);
    }
  },
};