const Models = require("../../models");
const universal = require("../../utils");
const CODES = require("../../constants").Codes;
const MESSAGES = require("../../constants").Messages;
const config = require("config");
const USER_TYPES = Object.values(config.get("USER_TYPES"));
const ObjectId = require("mongoose").Types.ObjectId;
const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

module.exports = {
  // Create a new product
  create: async (req, res, next) => {
    try {
      // Check if manufacturer exists and is active
      console.log('BODY--->', req.body);
      console.log('USER--->', req.user);
      const manufacturer = await Models.User.findOne({
        _id: req.body.manufacturer,
        type: { $in: ["MANUFACTURER_ADMIN"] },
        status: "ACTIVE"
      });
      if (universal.isEmpty(manufacturer)) {
        return universal.response(res, MESSAGES.MANUFACTURER_NOT_FOUND, "Invalid or inactive manufacturer", {});
      }

      // Check if category exists
      const category = await Models.Category.findById(req.body.category);
      if (!category) {
        return universal.response(res, MESSAGES.CATEGORY_NOT_FOUND, "Invalid category", {});
      }

      // Check for unique SKU
      const existingSku = await Models.Product.findOne({ sku: req.body.sku });
      if (existingSku) {
          return universal.response(res, MESSAGES.SKU_ALREADY_EXISTS, "SKU already exists", {});
      }

      req.body.createdBy = req.user._id;
      req.body.createdByType = req.userType;
      // Set initial status based on user type
      req.body.status = req.userType === USER_TYPES.SUPER_ADMIN ? "ACTIVE" : "PENDING_APPROVAL";

      const product = await new Models.Product(req.body).save();
      console.log('PRODUCT', product);
      return universal.response(res, CODES.OK, MESSAGES.PRODUCT_CREATED_SUCCESSFULLY, product);
    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  // Get list of products with filters and pagination
  getAll: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search;
      const category = req.query.category;
      const manufacturer = req.query.manufacturer;
      const status = req.query.status;

      let query = { isDeleted: false };

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { technicalName: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } }
        ];
      }
      if (category) query.category = new ObjectId(category);
      if (manufacturer) query.manufacturer = new ObjectId(manufacturer);
      if (status) query.status = status;

      // If user is a manufacturer admin, show only their products
      if (req.userType === USER_TYPES.MANUFACTURER_ADMIN) {
        query.manufacturer = req.user._id;
      }

      const total = await Models.Product.countDocuments(query);
      const products = await Models.Product.find(query)
        .populate('category', 'name')
        .populate('manufacturer', 'name')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

      return universal.response(res, CODES.OK, MESSAGES.DATA_FETCHED_SUCCESSFULLY, {
        products,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  // Get product details by id
  getById: async (req, res, next) => {
    try {
      const product = await Models.Product.findOne({ 
        _id: new ObjectId(req.params.id),
        isDeleted: false 
      })
      .populate('category', 'name description')
      .populate('manufacturer', 'name email phone')
      .populate('photos', 'url')
      .populate('pamphlet', 'url')
      .lean();

      if (!product) {
        return universal.response(res, CODES.NOT_FOUND, MESSAGES.PRODUCT_NOT_FOUND, {});
      }

      // For manufacturer admins, ensure they only access their own products
      if (req.userType === USER_TYPES.MANUFACTURER_ADMIN && 
          product.manufacturer._id.toString() !== req.user._id.toString()) {
        return universal.response(res, CODES.FORBIDDEN, "Access denied", {});
      }

      return universal.response(res, CODES.OK, MESSAGES.DATA_FETCHED_SUCCESSFULLY, product);
    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  // Approve product (only by SUPER_ADMIN)
  approve: async (req, res, next) => {
    try {
      if (req.userType !== USER_TYPES.SUPER_ADMIN) {
        return universal.response(res, CODES.FORBIDDEN, "Only super admin can approve products", {});
      }

      const product = await Models.Product.findOneAndUpdate(
        { _id: new ObjectId(req.params.id), status: "PENDING_APPROVAL" },
        { 
          status: "ACTIVE",
          approvedBy: req.user._id,
          approvedAt: new Date()
        },
        { new: true }
      ).lean();

      if (!product) {
        return universal.response(res, CODES.NOT_FOUND, "Product not found or already approved", {});
      }

      return universal.response(res, CODES.OK, "Product approved successfully", product);
    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  // Update product status
  updateStatus: async (req, res, next) => {
    try {
      const { status } = req.body;
      if (!["ACTIVE", "INACTIVE", "DISCONTINUED"].includes(status)) {
        return universal.response(res, CODES.BAD_REQUEST, MESSAGES.STATUS_NOT_FOUND, {});
      }

      const product = await Models.Product.findOne({ _id: new ObjectId(req.params.id) });
      if (!product) {
        return universal.response(res, CODES.NOT_FOUND, MESSAGES.PRODUCT_NOT_FOUND, {});
      }

      if (req.userType === USER_TYPES.MANUFACTURER_ADMIN && 
          product.manufacturer.toString() !== req.user._id.toString()) {
        return universal.response(res, CODES.FORBIDDEN, "Access denied", {});
      }

      product.status = status;
      product.updatedBy = req.user._id;
      product.updatedByType = req.userType;
      await product.save();

      return universal.response(res, CODES.OK, "Product status updated successfully", product);
    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  // Update product by id
  updateById: async (req, res, next) => {
    try {
      const product = await Models.Product.findOne({ 
        _id: new ObjectId(req.params.id),
        isDeleted: false 
      });

      if (!product) {
        return universal.response(res, CODES.NOT_FOUND, MESSAGES.PRODUCT_NOT_FOUND, {});
      }

      if (req.userType === USER_TYPES.MANUFACTURER_ADMIN && 
          product.manufacturer.toString() !== req.user._id.toString()) {
        return universal.response(res, CODES.FORBIDDEN, "Access denied", {});
      }

      if (req.body.manufacturer) {
        const manufacturer = await Models.User.findOne({
          _id: req.body.manufacturer,
          type: { $in: [USER_TYPES.MANUFACTURER_ADMIN] },
          status: "ACTIVE"
        });
        if (!manufacturer) {
          return universal.response(res, CODES.NOT_FOUND, "Invalid or inactive manufacturer", {});
        }
      }

      if (req.body.category) {
        const category = await Models.Category.findById(req.body.category);
        if (!category) {
          return universal.response(res, CODES.NOT_FOUND, "Invalid category", {});
        }
      }

      if (req.body.sku && req.body.sku !== product.sku) {
        const existingSku = await Models.Product.findOne({ sku: req.body.sku });
        if (existingSku) {
          return universal.response(res, CODES.BAD_REQUEST, MESSAGES.SKU_ALREADY_EXIST, {});
        }
      }

      req.body.updatedBy = req.user._id;
      req.body.updatedByType = req.userType;

      const updatedProduct = await Models.Product.findOneAndUpdate(
        { _id: product._id },
        req.body,
        { new: true }
      )
      .populate('category', 'name description')
      .populate('manufacturer', 'name email phone')
      .populate('photos', 'url')
      .lean();

      return universal.response(res, CODES.OK, MESSAGES.PRODUCT_UPDATED_SUCCESSFULLY, updatedProduct);
    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  // Import products from CSV in batches
  importProducts: async (req, res, next) => {
    const batchSize = 1000;
    const products = [];

    try {
      if (!req.file) {
        return res.status(400).send('No file uploaded');
      }

      const stream = require('stream');
      const bufferStream = new stream.PassThrough();
      bufferStream.end(req.file.buffer);

      bufferStream.pipe(csvParser())
        .on('data', (row) => {
          console.log(row);
          // Transform CSV row to match your schema
          const product = {
            sku: row.sku,
            name: row.name,
            technicalName: row.technicalName,
            category: new mongoose.Types.ObjectId(row.category),
            manufacturer: new mongoose.Types.ObjectId(row.manufacturer),
            marketedBy: row.marketedBy,
            packagingOptions: row.packagingSize.split('|').map((size, index) => ({
              size: Number(size),
              unitOfMeasure: row.packagingUnit.split('|')[index],
              mrp: Number(row.mrp.split('|')[index]),
              dealerPrice: Number(row.dealerPrice.split('|')[index])
            })),
            composition: row.ingredientName.split('|').map((ingredient, index) => ({
              ingredient,
              percentage: Number(row.ingredientPercentage.split('|')[index])
            })),
            recommendedDose: 'Default Dose',
            registrationNumber: Math.floor(Math.random() * 1000000),
            description: 'Default Description',
            safetyInstructions: 'Default Safety Instructions',
            storageInstructions: 'Default Storage Instructions',
            hsnCode: 'Default HSN',
            gstPercentage: 18,
            createdBy: req.user._id,
            createdByType: req.userType
          };

          products.push(product);

          if (products.length === batchSize) {
            bufferStream.pause();
            Models.Product.insertMany(products, { ordered: false })
              .then(() => {
                products.length = 0;
                bufferStream.resume();
              })
              .catch(err => {
                console.error('Error inserting batch:', err);
                bufferStream.resume();
              });
          }
        })
        .on('end', async () => {
          if (products.length > 0) {
            try {
              await Models.Product.insertMany(products, { ordered: false });
            } catch (err) {
              console.error('Error inserting final batch:', err);
            }
          }
          res.status(200).send('Products imported successfully');
        })
        .on('error', (err) => {
          console.error('Error reading CSV:', err);
          res.status(500).send('Error processing CSV');
        });

    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Internal server error');
    }
  },

  // Advanced search using aggregation
  advancedSearch: async (req, res, next) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.max(10, parseInt(req.query.limit) || 10);
      const skip = (page - 1) * limit;

      const query = { isDeleted: false };
      const searchFields = [];

      if (req.query.name) {
        searchFields.push({ name: { $regex: req.query.name, $options: 'i' } });
      }
      if (req.query.technicalName) {
        searchFields.push({ technicalName: { $regex: req.query.technicalName, $options: 'i' } });
      }
      if (req.query.registrationNumber) {
        searchFields.push({ registrationNumber: { $regex: req.query.registrationNumber, $options: 'i' } });
      }
      if (req.query.hsnCode) {
        searchFields.push({ hsnCode: { $regex: req.query.hsnCode, $options: 'i' } });
      }

      if (req.query.category) {
        query.category = new ObjectId(req.query.category);
      }
      if (req.query.manufacturer) {
        query.manufacturer = new ObjectId(req.query.manufacturer);
      }

      if (searchFields.length > 0) {
        query.$or = searchFields;
      }

      if (req.userType === USER_TYPES.MANUFACTURER_ADMIN) {
        query.manufacturer = req.user._id;
      }

      const pipeline = [
        { $match: query },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryDetails'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'manufacturer',
            foreignField: '_id',
            as: 'manufacturerDetails'
          }
        },
        { $unwind: '$categoryDetails' },
        { $unwind: '$manufacturerDetails' },
        {
          $project: {
            name: 1,
            technicalName: 1,
            sku: 1,
            registrationNumber: 1,
            hsnCode: 1,
            description: 1,
            status: 1,
            marketedBy: 1,
            packagingOptions: 1,
            photos: 1,
            category: {
              _id: '$categoryDetails._id',
              name: '$categoryDetails.name'
            },
            manufacturer: {
              _id: '$manufacturerDetails._id',
              name: '$manufacturerDetails.name',
              email: '$manufacturerDetails.email'
            },
            createdAt: 1
          }
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ];

      const [products, totalCount] = await Promise.all([
        Models.Product.aggregate(pipeline),
        Models.Product.countDocuments(query)
      ]);

      return universal.response(res, CODES.OK, MESSAGES.DATA_FETCHED_SUCCESSFULLY, {
        products,
        pagination: {
          total: totalCount,
          page,
          pages: Math.ceil(totalCount / limit)
        }
      });

    } catch (error) {
      console.error('Advanced Search Error:', error);
      next(error);
    }
  }
};
