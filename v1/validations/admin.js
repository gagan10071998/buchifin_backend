const joi = require("joi");
joi.objectId = require('joi-objectid')(joi)
const validateSchema = async (inputs, schema) => {
  try {
    let { error, _ } = schema.validate(inputs);
    if (error) throw error.details ? error.details[0].message.replace(/['"]+/g, "") : "";
    else return false;
  } catch (error) {
    throw error;
  }
};
module.exports = {
  validateUpdateProfile: async (req, property) => {
    let schema = joi.object().keys({
		email: joi.string().email().optional(),
        phone: joi.string().regex(/^[0-9]{10}$/).optional(),
        status: joi.string().valid(...['ACTIVE', 'INACTIVE', 'BLOCKED', 'PENDING', 'REJECTED'])
    });
    return await validateSchema(req[property], schema);
  },
  validateUpdateAdminById: async (req, property) => {
    let schema = joi.object().keys({
      id: joi.objectId().required(),
      designation: joi.string().lowercase().trim().optional(),
      name: joi.string().lowercase().trim().optional(),
      lang: joi.array().items(joi.string()).optional(),
      status: joi.string().valid(...['ACTIVE', 'INACTIVE', 'BLOCKED', 'PENDING', 'REJECTED'])
    });
    return await validateSchema(req[property], schema);
  }
};
