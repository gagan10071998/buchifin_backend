const { z } = require("zod");
const { UNIT_OF_MEASURE, STATUS_ENUM } = require('../../constants/status-types');
const { USER_TYPES } = require('../../constants/user-types');

const updateInventoryProductSchema = z
  .object({
    batch: z.string().optional(),
    packagingSize: z
      .object({
        size: z.number().optional(),
        unitOfMeasure: z.enum(UNIT_OF_MEASURE).optional()
      })
      .partial()
      .optional(),
    quantity: z.number().min(0).optional(),
    purchasePrice: z.number().optional(),
    sellingPrice: z.number().optional(),
    discount: z.number().optional(),
    purchaseDate: z.coerce.date().optional(),
    purchasedInvoiceNumber: z.string().optional(),
    purchasedInvoiceDocument: z.string().optional(),
    status: z.enum(STATUS_ENUM).optional(),
    minimumStockLevel: z.number().optional(),
    gstPercentage: z.number().optional(),
    cgstPercentage: z.number().optional(),
    sgstPercentage: z.number().optional(),
    tcsPercentage: z.number().optional(),
    isDeleted: z.boolean().optional(),
    createdBy: z.string().optional(),
    createdByType: z.enum(Object.keys(USER_TYPES)).optional(),
    updatedBy: z.string().optional(),
    updatedByType: z.enum(Object.keys(USER_TYPES)).optional(),
    packagingOptionIndex: z.number().optional()
  })
  .partial();

const manfacturerIdSchema = z.object({
  manufacturerId: z.string()
});

const addProductToInventorySchema = z.object({
  productId: z.string(),
  manufacturerId: z.string()
});

module.exports = {
  updateInventoryProductSchema,
  manfacturerIdSchema,
  addProductToInventorySchema
};
