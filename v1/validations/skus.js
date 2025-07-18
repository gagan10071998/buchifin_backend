const { z } = require("zod");

const skuTypeSchema = z.object({
  type: z.enum([
    "technicalName",
    "brandName",
    "manufacturer",
    "marketer",
    "packagingSize",
    "uom"
  ])
});

const generateSkuSchema = z.object({
  name: z.string().min(1, "Product name is required").max(100, "Product name too long"),
  technicalName: z.string().min(1, "Technical name is required").max(100, "Technical name too long"),
  main_category: z.string().min(1, "Main category is required").max(50, "Main category name too long"),
  subcategory: z.string().max(50, "Subcategory name too long").optional(),
  manufacturerName: z.string().min(1, "Manufacturer name is required").max(100, "Manufacturer name too long"),
  packaging_option: z.union([
    z.string(),
    z.number(),
    z.object({
      size: z.number().positive("Size must be positive"),
      unitOfMeasure: z.enum(['kg', 'g', 'liter', 'ml'], "Invalid unit of measure"),
      caseSize: z.number().positive("Case size must be positive").optional()
    })
  ]).optional()
});

module.exports = { skuTypeSchema, generateSkuSchema };
