const joi = require("joi");
const config = require("config");

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
    validateSignup: async (req, property) => {
        const schema = joi.object({
            name:joi.string().required(),
            district: joi.string().required(),
            designation: joi.string().required(),
            state: joi.string().valid(...config.get('DROP_DOWNS').STATES).required(),
            email: joi.string().email().required(),
            phone: joi.string().required(),
            countryCode: joi.string().required(),
            password: joi.string().required(),
          })
        return await validateSchema(req[property], schema);
    },
};
