const joi = require("joi");

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
    const schema = joi.object({
      designation: joi.string().lowercase().trim().optional(),
      name: joi.string().lowercase().trim().optional(),
      lang: joi.array().items(joi.string()),
    });
    return await validateSchema(req[property], schema);
  },
};
