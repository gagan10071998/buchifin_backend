const Joi = require('joi');
const universal = require('../../utils');
const MESSAGES = require('../../constants').Messages;

module.exports = {
    create: async (req, res, next) => {
        try {
            const schema = Joi.object({
                retailer: Joi.string().required(),
                product: Joi.string().required(),
                batch: Joi.string().optional(),
                packagingSize: Joi.object({
                    size: Joi.number().required(),
                    unitOfMeasure: Joi.string().valid('kg', 'g', 'liter', 'ml').required()
                }).required(),
                quantity: Joi.number().min(0).required(),
                purchasePrice: Joi.number().required(),
                sellingPrice: Joi.number().required(),
                discount: Joi.number().default(0),
                purchaseDate: Joi.date().required(),
                purchasedInvoiceNumber: Joi.string().required(),
                purchasedInvoiceDocument: Joi.string().required(),
                location: Joi.object({
                    warehouse: Joi.string().required(),
                    rack: Joi.string(),
                    shelf: Joi.string(),
                    geolocation: Joi.object({
                        type: Joi.string().default('Point'),
                        coordinates: Joi.array().items(Joi.number()).length(2)
                    })
                }).required(),
                minimumStockLevel: Joi.number().min(0).required()
            });

            const { error } = schema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message,
                    error: MESSAGES.ERROR.VALIDATION
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                error: MESSAGES.ERROR.SERVER_ERROR
            });
        }
    },

    update: async (req, res, next) => {
        try {
            const schema = Joi.object({
                retailer: Joi.string(),
                product: Joi.string(),
                batch: Joi.string(),
                packagingSize: Joi.object({
                    size: Joi.number(),
                    unitOfMeasure: Joi.string().valid('kg', 'g', 'liter', 'ml')
                }),
                quantity: Joi.number().min(0),
                purchasePrice: Joi.number(),
                sellingPrice: Joi.number(),
                discount: Joi.number(),
                purchaseDate: Joi.date(),
                purchasedInvoiceNumber: Joi.string(),
                purchasedInvoiceDocument: Joi.string(),
                location: Joi.object({
                    warehouse: Joi.string(),
                    rack: Joi.string(),
                    shelf: Joi.string(),
                    geolocation: Joi.object({
                        type: Joi.string().default('Point'),
                        coordinates: Joi.array().items(Joi.number()).length(2)
                    })
                }),
                minimumStockLevel: Joi.number().min(0),
                status: Joi.string().valid('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRED', 'RECALLED')
            });

            const { error } = schema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message,
                    error: MESSAGES.ERROR.VALIDATION
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                error: MESSAGES.ERROR.SERVER_ERROR
            });
        }
    }
}; 