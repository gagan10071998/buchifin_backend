const config = require("config");
const validations = require("../validations");
const USER_TYPES = config.get("USER_TYPES");
const universal = require("../../utils");
const MESSAGES = require("../../constants").Messages;
const CODES = require("../../constants").Codes;
const Models = require("../../models");
const ObjectId = require("mongoose").Types.ObjectId;

module.exports = {
  getById: async (req, res, next) => {
    try {
      const document = await Models.Document.findOne({
        _id: new ObjectId(req.params.id)
      });
      if (!document) {
        return await universal.response(res, CODES.BAD_REQUEST, MESSAGES.DOCUMENT_NOT_EXISTS, {})
      }
      let url = await universal.generatePresignedUrlForDownload(document.s3Key)
      const result = {
        status: CODES.OK,
        message: MESSAGES.DATA_FETCHED_SUCCESSFULLY,
        data: {
            url
        }
      };

      return universal.response(res, result.status, result.message, result.data, req.lang);

    } catch (error) {
      console.log(error);
      next(error);
    }
  },
};