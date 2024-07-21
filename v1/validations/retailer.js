const joi = require("joi");
joi.objectId = require("joi-objectid")(joi);
const config = require("config");

let FIRM_DOCUMENT = { ...config.get("FIRM_DOCUMENT") };

const validateSchema = async (inputs, schema) => {
  try {
    let { error, _ } = schema.validate(inputs);
    if (error)
      throw error.details ? error.details[0].message.replace(/['"]+/g, "") : "";
    else return false;
  } catch (error) {
    throw error;
  }
};

// const documentSchema = joi.object({
//     type: joi.string().valid('ADHAR', 'PAN').required(),
//     number: joi.string()
//         .when('type', {
//             is: 'ADHAR',
//             then: joi.string().pattern(/^[2-9]{1}[0-9]{3}\\s[0-9]{4}\\s[0-9]{4}$/), // This is a basic aadhar card regex. You might want to use a stricter one if needed.
//             otherwise: joi.string().pattern(/^([A-Z]{5}[0-9]{4}[A-Z]{1})$/), // PAN card regex
//         })
//         .required(),
//     document: joi.string().required()
// });

module.exports = {
  //   validateRetailerSignup: async (data) => {
  //     const schema = joi
  //       .object({
  //         name: joi.string().required(),
  //         email: joi.string().email().required(),
  //         phone: joi.string().regex(/^[0-9]{10}$/),
  //         gender: joi.string().required(),
  //         dob: joi
  //           .string()
  //           .pattern(/^(\d{2})-(\d{2})-(\d{4})$/)
  //           .required(),
  //         countryCode: joi.string().required(),
  //         password: joi.string().required(),
  //         residentialAddress: joi
  //           .object({
  //             address: joi.string().required(),
  //             city: joi.string().required(),
  //             state: joi
  //               .object({
  //                 stateId: joi.number().required(),
  //                 stateName: joi.string().required(),
  //               })
  //               .required(),
  //             district: joi.string().required(),
  //             country: joi.string().required(),
  //             zip: joi.string().required(),
  //           })
  //           .required(),
  //         documents: joi
  //           .array()
  //           .items(
  //             joi.object({
  //               type: joi.string().valid("aadhar", "PAN").required(),
  //               number: joi.string().required(),
  // 			  document: joi.string().required()
  //             })
  //           )
  //           .required(),
  //       })
  //       .unknown(); // .unknown() allows for other fields not specified in the schema to be present without causing validation errors
  //     return await validateSchema(data, schema);
  //   },
  validateRetailerSignup: async (data) => {
    const schema = joi
      .object({
        name: joi.string().required().messages({
          "string.base": "Name should be a type of text.",
          "string.empty": "Name cannot be an empty field.",
          "any.required": "Name is a required field.",
        }),
        email: joi.string().email().required().messages({
          "string.email": "Email must be a valid email address.",
          "any.required": "Email is a required field.",
        }),
        phone: joi
          .string()
          .regex(/^[0-9]{10}$/)
          .messages({
            "string.pattern.base": "Phone number should be 10 digits.",
          }),
        gender: joi.string().required().messages({
          "string.empty": "Gender cannot be an empty field.",
          "any.required": "Gender is a required field.",
        }),
        dob: joi
          .string()
          .pattern(/^(\d{2})-(\d{2})-(\d{4})$/)
          .required()
          .messages({
            "string.pattern.base": "DOB must be in format DD-MM-YYYY.",
            "any.required": "DOB is a required field.",
          }),
        countryCode: joi.string().required().messages({
          "string.empty": "Country code cannot be an empty field.",
          "any.required": "Country code is a required field.",
        }),
        password: joi.string().required().messages({
          "string.empty": "Password cannot be an empty field.",
          "any.required": "Password is a required field.",
        }),
        residentialAddress: joi
          .object({
            address: joi.string().required().messages({
              "string.empty": "Address cannot be an empty field.",
              "any.required": "Address is a required field.",
            }),
            city: joi.string().required().messages({
              "string.empty": "City cannot be an empty field.",
              "any.required": "City is a required field.",
            }),
            state: joi
              .object({
                stateId: joi.number().required().messages({
                  "number.base": "State ID should be a number.",
                  "any.required": "State ID is a required field.",
                }),
                stateName: joi.string().required().messages({
                  "string.empty": "State name cannot be an empty field.",
                  "any.required": "State name is a required field.",
                }),
              })
              .required(),
            district: joi.string().required().messages({
              "string.empty": "District cannot be an empty field.",
              "any.required": "District is a required field.",
            }),
            country: joi.string().required().messages({
              "string.empty": "Country cannot be an empty field.",
              "any.required": "Country is a required field.",
            }),
            zip: joi.string().required().messages({
              "string.empty": "ZIP code cannot be an empty field.",
              "any.required": "ZIP code is a required field.",
            }),
          })
          .required(),
      })
      .unknown();

    return await validateSchema(data, schema);
  },
  validateFirmSignup: async (data) => {

    const schema = joi
      .object({
        firmName: joi.string().required(),
        firmAddress: joi
          .object({
            profilePic: joi
              .string()
              .default("/image/defaultUser.jpg")
              .required(),
            lat: joi.number().optional(),
            long: joi.number().optional(),
            address: joi.string().required(),
            city: joi.string().required(),
            state: joi
              .object({
                stateId: joi.number().required(),
                stateName: joi.string().required(),
              })
              .required(),
            district: joi.string().required(),
            country: joi.string().required(),
            zip: joi.string().required(),
          })
          .required(),
        firmType: joi
          .string()
          .valid("Proprietorship", "Partnership", "PvtLimited")
          .required(),
        details: joi
          .array()
          .items(
            joi.object({
              name: joi.string().required(),
              designation: joi.string().required(),
              phoneNo: joi
                .string()
                .pattern(/^[0-9]{10}$/)
                .required(), // Assuming phoneNo is a 10-digit number
              email: joi.string().email().required(),
              userType: joi
                .string()
                .valid("Proprietor", "Partner", "Director", "Manager")
                .required(),
            })
          )
          .required(),
        // documents: joi
        //   .array()
        //   .items(
        //     joi.object({
        //       url: joi.string(),
        //       number: joi.string().required(),
        //       type: joi
        //         .string()
        //         .valid(
        //           "aadhar",
        //           "pan",
        //           "fertilizer",
        //           "seed",
        //           "gst",
        //           "govtCertificate",
        //           "other",
		// 		  "firmAadhar",
		// 		  "firmpan"
        //         )
        //         .required(),
        //     })
        //   )
        //   .required(),
        bankDetails: joi
          .object({
            accountName: joi.string().required(),
            accountNo: joi.string().required(),
            ifscCode: joi.string().required(),
            bankName: joi.string().required(),
            canceledCheckPhoto: joi.string().required(),
          })
          .required(),
        // userId: joi.string().required(), // Assuming user's ObjectId will be in a GUID format. Adjust as needed.
        isDeleted: joi.boolean().default(false),
      })
      .unknown();

    return await validateSchema(data, schema);
  },
};
