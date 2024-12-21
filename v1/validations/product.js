const Joi = require("joi");
Joi.objectId = require('joi-objectid')(Joi);

module.exports = {
  create: (req, res, next) => {
    const schema = Joi.object({
      sku: Joi.string().required(),
      name: Joi.string().required(),
      technicalName: Joi.string().required(),
      category: Joi.objectId().required(),
      manufacturer: Joi.objectId().required(),
      marketedBy: Joi.string().required(),
      photos: Joi.array().items(Joi.objectId()).min(1).required(),
      packagingOptions: Joi.array().items(
        Joi.object({
          size: Joi.number().required(),
          unitOfMeasure: Joi.string().valid('kg', 'g', 'liter', 'ml').required(),
          mrp: Joi.number().required(),
          dealerPrice: Joi.number().required()
        })
      ).min(1).required(),
      composition: Joi.array().items(
        Joi.object({
          ingredient: Joi.string().required(),
          percentage: Joi.number().min(0).max(100).required()
        })
      ).required(),
      recommendedDose: Joi.string().required(),
      registrationNumber: Joi.string().required(),
      description: Joi.string().required(),
      pamphlet: Joi.objectId(),
      safetyInstructions: Joi.string().required(),
      antidote: Joi.string(),
      storageInstructions: Joi.string().required(),
      hsnCode: Joi.string().required(),
      gstPercentage: Joi.number().required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  },

  update: (req, res, next) => {
    const schema = Joi.object({
      sku: Joi.string(),
      name: Joi.string(),
      technicalName: Joi.string(),
      category: Joi.objectId(),
      marketedBy: Joi.string(),
      photos: Joi.array().items(Joi.objectId()),
      packagingOptions: Joi.array().items(
        Joi.object({
          size: Joi.number(),
          unitOfMeasure: Joi.string().valid('kg', 'g', 'liter', 'ml'),
          mrp: Joi.number(),
          dealerPrice: Joi.number()
        })
      ),
      composition: Joi.array().items(
        Joi.object({
          ingredient: Joi.string(),
          percentage: Joi.number().min(0).max(100)
        })
      ),
      recommendedDose: Joi.string(),
      description: Joi.string(),
      pamphlet: Joi.objectId(),
      safetyInstructions: Joi.string(),
      antidote: Joi.string(),
      storageInstructions: Joi.string(),
      hsnCode: Joi.string(),
      gstPercentage: Joi.number(),
      status: Joi.string().valid("ACTIVE", "INACTIVE", "DISCONTINUED", "PENDING_APPROVAL")
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  }
}; 