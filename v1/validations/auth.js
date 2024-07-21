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
  validateLogin: async (req, property) => {
    const schema = joi.object({
      email: joi.string().email().messages({
        'string.email': 'Invalid email format',
      }),
      phone: joi.string().messages({
        'string.base': 'Phone must be a string',
      }),
      countryCode: joi.string().when('phone', {
        is: joi.exist(),
        then: joi.required().messages({
          'any.required': 'Country code is required when phone is present',
        }),
        otherwise: joi.optional(),
      }),
      password: joi.string().required().messages({
        'any.required': 'Password is required',
      })
    }).xor('email', 'phone').with('phone', ['countryCode']);
    return await validateSchema(req[property], schema);
  },
  validateChangePassword: async (req, property) => {
    const schema = joi.object({
      oldPassword: joi.string().required(),
      newPassword: joi.string().required(),
    })
    return await validateSchema(req[property], schema);
  },
  validateForgotPassword: async (req, property) => {
    const schema = joi.object({
      email: joi.string().email().messages({
        'string.email': 'Invalid email format',
      }),
      phone: joi.string().messages({
        'string.base': 'Phone must be a string',
      }),
      countryCode: joi.string().when('phone', {
        is: joi.exist(),
        then: joi.required().messages({
          'any.required': 'Country code is required when phone is present',
        }),
        otherwise: joi.optional(),
      })
    }).xor('email', 'phone').with('phone', ['countryCode']);
    return await validateSchema(req[property], schema);
  },
  validateResetPassword: async (req, property) => {
    const schema = joi.object({
      email: joi.string().email().messages({
        'string.email': 'Invalid email format',
      }),
      phone: joi.string().messages({
        'string.base': 'Phone must be a string',
      }),
      countryCode: joi.string().when('phone', {
        is: joi.exist(),
        then: joi.required().messages({
          'any.required': 'Country code is required when phone is present',
        }),
        otherwise: joi.optional(),
      }),
      code: joi.string().length(4).required(),
      password: joi.string().required().messages({
        'any.required': 'Password is required',
      }),
    }).xor('email', 'phone').with('phone', ['countryCode']);
    return await validateSchema(req[property], schema);
  },
};
