const _ = require('lodash');
const Models = require("../../models");
const universal = require("../../utils");
const CODES = require("../../constants").Codes;
const MESSAGES = require("../../constants").Messages;
const config = require("config");
const USER_TYPES = Object.values(config.get("USER_TYPES"));
const ObjectId = require("mongoose").Types.ObjectId;

// Add transaction logging
const logTransaction = async (inventoryId, productId, type, details, userId) => {
    await new Models.Transaction({
        inventory: inventoryId,
        product: productId,
        type,
        details,
        user: userId
    }).save();
};

module.exports = {
    addProductToInventory: async (req, res, next) => {
        try {
            const inventoryData = {
                retailer: _.get(req.body, 'retailer'),
                product: _.get(req.body, 'product'),
                batch: _.get(req.body, 'batch'),
                packagingSize: _.get(req.body, 'packagingSize', {}),
                quantity: _.get(req.body, 'quantity', 0),
                purchasePrice: _.get(req.body, 'purchasePrice', 0),
                sellingPrice: _.get(req.body, 'sellingPrice', 0),
                discount: _.get(req.body, 'discount', 0),
                purchaseDate: _.get(req.body, 'purchaseDate'),
                purchasedInvoiceNumber: _.get(req.body, 'purchasedInvoiceNumber'),
                purchasedInvoiceDocument: _.get(req.body, 'purchasedInvoiceDocument'),
                location: _.get(req.body, 'location', {}),
                minimumStockLevel: _.get(req.body, 'minimumStockLevel', 0),
                createdBy: req.user._id,
                createdByType: req.user.type[0]
            };

            const inventoryExists = await Models.Inventory.fcindOne({
                retailer: inventoryData.retailer,
                product: inventoryData.product,
                batch: inventoryData.batch,
                isDeleted: false
            });

            if (inventoryExists) {
                return universal.response(res, CODES.BAD_REQUEST, MESSAGES.INVENTORY_ALREADY_EXISTS, {}, req.lang);
            }

            const inventory = await new Models.Inventory(inventoryData).save();
            // Log the transaction
            await logTransaction(inventory._id, inventory.product, 'ADD', inventory.quantity, req.user._id);

            return universal.response(res, CODES.OK, MESSAGES.INVENTORY_CREATED, inventory, req.lang);
        } catch (error) {
            console.error(error);
            return universal.response(res, CODES.ERROR_SERVER, _.get(error, 'message', MESSAGES.ERROR.SERVER_ERROR), {}, req.lang);
        }
    },

    getAll: async (req, res, next) => {
        try {
            const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
            const limit = Math.max(10, Number.parseInt(req.query.limit, 10) || 10);
            const skip = (page - 1) * limit;

            const searchQuery = req.query.search || '';

            const pipeline = [
                { $match: { isDeleted: false } },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'product',
                        foreignField: '_id',
                        as: 'productDetails'
                    }
                },
                { $unwind: '$productDetails' },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'retailer',
                        foreignField: '_id',
                        as: 'retailerDetails'
                    }
                },
                { $unwind: '$retailerDetails' },
                {
                    $match: {
                        $or: [
                            { 'productDetails.name': { $regex: searchQuery, $options: 'i' } },
                            { 'productDetails.description': { $regex: searchQuery, $options: 'i' } },
                            { 'retailerDetails.name': { $regex: searchQuery, $options: 'i' } }
                        ]
                    }
                },
                {
                    $project: {
                        retailer: '$retailerDetails.name',
                        product: '$productDetails.name',
                        description: '$productDetails.description',
                        image: { $arrayElemAt: ['$productDetails.photos', 0] },
                        price: '$sellingPrice',
                        packaging: '$packagingSize',
                        relatedProducts: '$productDetails.relatedProducts',
                        status: 1,
                        quantity: 1,
                        location: 1,
                        createdAt: 1
                    }
                },
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: limit }
            ];

            const inventory = await Models.Inventory.aggregate(pipeline).exec();
            const total = await Models.Inventory.countDocuments({ isDeleted: false });

            const result = {
                status: CODES.OK,
                message: MESSAGES.INVENTORY_FETCHED,
                data: {
                    records: inventory,
                    page,
                    count: total,
                    totalPages: Math.ceil(total / limit)
                }
            };

            return universal.response(res, result.status, result.message, result.data, req.lang);
        } catch (error) {
            console.error(error);
            return universal.response(res, CODES.ERROR_SERVER, _.get(error, 'message', MESSAGES.ERROR.SERVER_ERROR), {}, req.lang);
        }
    },

    getById: async (req, res, next) => {
        try {
            const pipeline = [
                { $match: { _id:new ObjectId(req.params.id), isDeleted: false } },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'product',
                        foreignField: '_id',
                        as: 'productDetails'
                    }
                },
                { $unwind: '$productDetails' },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'retailer',
                        foreignField: '_id',
                        as: 'retailerDetails'
                    }
                },
                { $unwind: '$retailerDetails' },
                {
                    $lookup: {
                        from: 'batches',
                        localField: 'batch',
                        foreignField: '_id',
                        as: 'batchDetails'
                    }
                },
                { $unwind: { path: '$batchDetails', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        retailer: '$retailerDetails.name',
                        retailerEmail: '$retailerDetails.email',
                        product: '$productDetails.name',
                        productDescription: '$productDetails.description',
                        batchNumber: '$batchDetails.batchNumber',
                        expiryDate: '$batchDetails.expiryDate',
                        status: 1,
                        quantity: 1,
                        location: 1,
                        createdAt: 1
                    }
                }
            ];

            const inventory = await Models.Inventory.aggregate(pipeline).exec();

            if (!inventory.length) {
                return universal.response(res, CODES.BAD_REQUEST, MESSAGES.PRODUCT_NOT_FOUND_IN_INVENTORY, {}, req.lang);
            }

            return universal.response(res, CODES.OK, MESSAGES.PRODUCT_FETCHED_FROM_INVENTORY, inventory[0], req.lang);
        } catch (error) {
            console.error(error);
            return universal.response(res, CODES.BAD_GATEWAY, _.get(error, 'message', CODES.BAD_REQUEST), {}, req.lang);
        }
    },

    updateById: async (req, res, next) => {
        try {
            const { id } = req.params;
            const updateFields = req.body;

            // Check if inventory exists
            const inventory = await Models.Inventory.findOne({ _id: id, isDeleted: false });
            if (!inventory) {
                return universal.response(res, CODES.BAD_REQUEST, MESSAGES.INVENTORY_NOT_FOUND, {}, req.lang);
            }

            // Check if product exists in inventory
            if (updateFields.product && updateFields.product !== inventory.product.toString()) {
                return universal.response(res, CODES.BAD_REQUEST, MESSAGES.PRODUCT_NOT_FOUND_IN_INVENTORY, {}, req.lang);
            }

            // Prepare update data
            const updateData = {
                updatedBy: req.user._id,
                updatedByType: req.user.type[0]
            };

            // Only update fields that are present in the request body
            const allowedFields = ['price', 'discount', 'packagingSize', 'name', 'sellingPrice', 'purchasePrice', 'quantity', 'purchaseDate', 'purchasedInvoiceNumber', 'purchasedInvoiceDocument', 'location', 'minimumStockLevel'];
            allowedFields.forEach(field => {
                if (updateFields[field] !== undefined) {
                    updateData[field] = updateFields[field];
                }
            });

            // Update inventory
            const updatedInventory = await Models.Inventory.findOneAndUpdate(
                { _id: id, isDeleted: false },
                updateData,
                { new: true, runValidators: true }
            );

            if (!updatedInventory) {
                return universal.response(res, CODES.BAD_REQUEST, MESSAGES.INVENTORY_NOT_FOUND, {}, req.lang);
            }

            // Log the update
            const changes = {};
            allowedFields.forEach(field => {
                if (updateFields[field] !== undefined && updateFields[field] !== inventory[field]) {
                    changes[field] = {
                        oldValue: inventory[field],
                        newValue: updateFields[field]
                    };
                }
            });
            await logTransaction(new ObjectId(updatedInventory._id), new ObjectId(updatedInventory.product), 'UPDATE', changes, new ObjectId(req.user._id));

            return universal.response(res, CODES.OK, MESSAGES.INVENTORY_UPDATED, updatedInventory, req.lang);
        } catch (error) {
            console.log(error);
            next(error);
        }
    },

    updateStatus: async (req, res, next) => {
        try {
            const inventory = await Models.Inventory.findOneAndUpdate(
                { _id: req.params.id, isDeleted: false },
                {
                    status: req.body.status,
                    updatedBy: req.user._id,
                    updatedByType: req.user.type
                },
                { new: true }
            );

            if (!inventory) {
                return res.status(CODES.ERROR_NOT_FOUND).json({
                    success: false,
                    message: MESSAGES.INVENTORY.NOT_FOUND
                });
            }

            return res.status(CODES.SUCCESS).json({
                success: true,
                data: inventory,
                message: MESSAGES.INVENTORY.STATUS_UPDATED
            });
        } catch (error) {
            console.error(error);
            return universal.response(res, CODES.ERROR_SERVER, _.get(error, 'message', MESSAGES.ERROR.SERVER_ERROR), {}, req.lang);
        }
    },

    getLowStock: async (req, res, next) => {
        try {
            const inventory = await Models.Inventory.find({
                isDeleted: false,
                status: 'LOW_STOCK'
            })
                .populate('retailer', 'name email')
                .populate('product', 'name description')
                .populate('batch', 'batchNumber expiryDate');

            return res.status(CODES.SUCCESS).json({
                success: true,
                data: inventory,
                message: MESSAGES.SUCCESS.FETCHED
            });
        } catch (error) {
            console.error(error);
            return universal.response(res, CODES.ERROR_SERVER, _.get(error, 'message', MESSAGES.ERROR.SERVER_ERROR), {}, req.lang);
        }
    },

    getNearby: async (req, res, next) => {
        try {
            const { longitude, latitude, maxDistance = 10000 } = req.query;

            const inventory = await Models.Inventory.find({
                isDeleted: false,
                'location.geolocation': {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [parseFloat(longitude), parseFloat(latitude)]
                        },
                        $maxDistance: parseInt(maxDistance)
                    }
                }
            })
                .populate('retailer', 'name email')
                .populate('product', 'name description')
                .populate('batch', 'batchNumber expiryDate');

            return res.status(CODES.SUCCESS).json({
                success: true,
                data: inventory,
                message: MESSAGES.SUCCESS.FETCHED
            });
        } catch (error) {
            console.error(error);
            return universal.response(res, CODES.ERROR_SERVER, _.get(error, 'message', MESSAGES.ERROR.SERVER_ERROR), {}, req.lang);
        }
    },

    importInventory: async (req, res, next) => {
        try {
            // Implementation for importing inventory from file
            // Similar to product import but for inventory items
            return res.status(CODES.SUCCESS).json({
                success: true,
                message: MESSAGES.INVENTORY.IMPORTED
            });
        } catch (error) {
            console.error(error);
            return universal.response(res, CODES.ERROR_SERVER, _.get(error, 'message', MESSAGES.ERROR.SERVER_ERROR), {}, req.lang);
        }
    },

    getTransactions: async (req, res, next) => {
        try {
            const transactions = await Models.Transaction.find({
                inventory: req.params.id
            }).populate('user', 'name email');

            return res.status(CODES.SUCCESS).json({
                success: true,
                data: transactions,
                message: MESSAGES.SUCCESS.FETCHED
            });
        } catch (error) {
            console.error(error);
            return universal.response(res, CODES.ERROR_SERVER, _.get(error, 'message', MESSAGES.ERROR.SERVER_ERROR), {}, req.lang);
        }
    },

    getByProduct: async (req, res, next) => {
        try {
            const inventoryItems = await Models.Inventory.find({
                product: req.params.productId,
                isDeleted: false
            }).populate('retailer', 'name email');

            return res.status(CODES.SUCCESS).json({
                success: true,
                data: inventoryItems,
                message: MESSAGES.SUCCESS.FETCHED
            });
        } catch (error) {
            console.error(error);
            return universal.response(res, CODES.ERROR_SERVER, _.get(error, 'message', MESSAGES.ERROR.SERVER_ERROR), {}, req.lang);
        }
    }
};
