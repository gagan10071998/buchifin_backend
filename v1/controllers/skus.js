const { Sku } = require("../../models/skus");
const Models = require("../../models");
const { sendResponse } = require("../../utils/sendResponse");
const { skuTypeSchema, generateSkuSchema } = require("../validations/skus");

const getAllGroupedBySkus = async (req, res, next) => {
  try {
    const skus = await Sku.aggregate([
      {
        $group: {
          _id: "$type",
          skus: { $push: { value: "$value", code: "$code", type: "$type" } }
        }
      }
    ]);

    return sendResponse(res, "All skus fetched!", { skus });
  } catch (error) {
    next(error);
  }
};

const getSkuByType = async (req, res, next) => {
  try {
    const { success, data, error } = skuTypeSchema.safeParse(req.params);
    if (!success) {
      return sendResponse(res, "Invalid sku type", error.flatten(), 400);
    }

    const skus = await Sku.find({ type: data.type });

    if (!skus?.length) {
      return sendResponse(res, "No skus found for this type", {}, 404);
    }

    return sendResponse(res, "Sku fetched successfully!", { skus });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate Unique SKU Code
 * 
 * @description Generates a unique SKU code based on product details
 * @route POST /api/v1/skus/generate
 * @access Protected (requires authentication)
 * 
 * @body {Object} productDetails
 * @body {string} productDetails.name - Product name (required)
 * @body {string} productDetails.technicalName - Technical name (required)  
 * @body {string} productDetails.main_category - Main category (required)
 * @body {string} [productDetails.subcategory] - Subcategory (optional)
 * @body {string} productDetails.manufacturerName - Manufacturer name (required)
 * @body {string|number|Object} [productDetails.packaging_option] - Packaging option (optional)
 * @body {number} [productDetails.packaging_option.size] - Package size
 * @body {string} [productDetails.packaging_option.unitOfMeasure] - Unit (kg/g/liter/ml)
 * @body {number} [productDetails.packaging_option.caseSize] - Case size (optional)
 * 
 * @returns {Object} response
 * @returns {string} response.sku - Generated unique SKU code with dashes between components
 * @returns {Object} response.metadata - SKU generation metadata
 * @returns {Object} response.metadata.components - SKU component breakdown
 * @returns {Object} response.metadata.originalInputs - Original input data
 * 
 * @example
 * // Request Body (with packaging object):
 * {
 *   "name": "Confidor Insecticide",
 *   "technicalName": "Imidacloprid 17.8% SL", 
 *   "main_category": "Insecticide",
 *   "subcategory": "Systemic",
 *   "manufacturerName": "Bayer CropScience",
 *   "packaging_option": {
 *     "size": 500,
 *     "unitOfMeasure": "ml",
 *     "caseSize": 24
 *   }
 * }
 * 
 * // Request Body (with simple packaging):
 * {
 *   "name": "NPK Fertilizer",
 *   "technicalName": "NPK 19:19:19", 
 *   "main_category": "Fertilizer",
 *   "manufacturerName": "IFFCO",
 *   "packaging_option": "50kg"
 * }
 * 
 * // Response for first example:
 * {
 *   "success": true,
 *   "message": "Unique SKU generated successfully!",
 *   "data": {
 *     "sku": "CON-IMI-INS-SY-BAY-500M",
 *     "metadata": {
 *       "components": {
 *         "name": "CON",
 *         "technicalName": "IMI", 
 *         "category": "INS",
 *         "subcategory": "SY",
 *         "manufacturer": "BAY",
 *         "packaging": "500M"
 *       },
 *       "originalInputs": {
 *         "name": "Confidor Insecticide",
 *         "technicalName": "Imidacloprid 17.8% SL",
 *         "main_category": "Insecticide",
 *         "subcategory": "Systemic",
 *         "manufacturerName": "Bayer CropScience",
 *         "packaging_option": {
 *           "size": 500,
 *           "unitOfMeasure": "ml",
 *           "caseSize": 24
 *         }
 *       }
 *     }
 *   }
 * }
 */
const generateUniqueSku = async (req, res, next) => {
  try {
    // Validate request body
    const { success, data, error } = generateSkuSchema.safeParse(req.body);
    if (!success) {
      return sendResponse(res, "Validation Error", error.flatten(), 400);
    }

    const { 
      name, 
      technicalName, 
      main_category, 
      subcategory, 
      manufacturerName, 
      packaging_option 
    } = data;

    // Helper function to create safe abbreviations
    const createAbbreviation = (text, maxLength = 3) => {
      if (!text) return '';
      return text
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '') // Remove special characters and spaces
        .substring(0, maxLength);
    };

    // Helper function to format packaging option
    const formatPackagingOption = (packagingOption) => {
      if (!packagingOption) return '';
      
      // If it's an object (like from packagingOptions array)
      if (typeof packagingOption === 'object') {
        const size = packagingOption.size || '';
        const unit = packagingOption.unitOfMeasure || '';
        const caseSize = packagingOption.caseSize || '';
        
        let packagingStr = '';
        if (size) packagingStr += size.toString();
        if (unit) packagingStr += createAbbreviation(unit, 2);
        if (caseSize) packagingStr += `C${caseSize}`;
        
        return packagingStr ? createAbbreviation(packagingStr, 4) : '';
      }
      
      // If it's a string or number
      return createAbbreviation(packagingOption.toString(), 4);
    };

    // Create SKU components
    const nameAbbr = createAbbreviation(name, 3);
    const techNameAbbr = createAbbreviation(technicalName, 3);
    const categoryAbbr = createAbbreviation(main_category, 3);
    const subcatAbbr = subcategory ? createAbbreviation(subcategory, 2) : '';
    const mfgAbbr = createAbbreviation(manufacturerName, 3);
    const packagingAbbr = formatPackagingOption(packaging_option);

    // Create base SKU with dashes between components
    const skuComponents = [nameAbbr, techNameAbbr, categoryAbbr];
    
    if (subcatAbbr) skuComponents.push(subcatAbbr);
    if (mfgAbbr) skuComponents.push(mfgAbbr);
    if (packagingAbbr) skuComponents.push(packagingAbbr);
    
    let baseSku = skuComponents.join('-');
    
    // Ensure minimum length
    if (baseSku.replace(/-/g, '').length < 8) {
      // Add padding to the last component if needed
      const lastIndex = skuComponents.length - 1;
      const currentLength = baseSku.replace(/-/g, '').length;
      const paddingNeeded = 8 - currentLength;
      skuComponents[lastIndex] = skuComponents[lastIndex].padEnd(skuComponents[lastIndex].length + paddingNeeded, '0');
      baseSku = skuComponents.join('-');
    }

    // Check for existing SKUs and ensure uniqueness
    let uniqueSku = baseSku;
    let counter = 1;
    
    while (true) {
      const existingProduct = await Models.Product.findOne({ sku: uniqueSku });
      if (!existingProduct) break;
      
      // If SKU exists, append counter
      uniqueSku = `${baseSku}${counter.toString().padStart(2, '0')}`;
      counter++;
      
      // Safety check to prevent infinite loop
      if (counter > 999) {
        throw new Error("Unable to generate unique SKU after 999 attempts");
      }
    }

    // Generate additional metadata
    const skuMetadata = {
      components: {
        name: nameAbbr,
        technicalName: techNameAbbr,
        category: categoryAbbr,
        subcategory: subcatAbbr || 'N/A',
        manufacturer: mfgAbbr,
        packaging: packagingAbbr || 'N/A'
      },
      originalInputs: {
        name,
        technicalName,
        main_category,
        subcategory: subcategory || null,
        manufacturerName,
        packaging_option: packaging_option || null
      }
    };

    return sendResponse(res, "Unique SKU generated successfully!", {
      sku: uniqueSku,
      metadata: skuMetadata
    });

  } catch (error) {
    console.error('SKU Generation Error:', error);
    next(error);
  }
};

module.exports = { getAllGroupedBySkus, getSkuByType, generateUniqueSku };
