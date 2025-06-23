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

module.exports = { skuTypeSchema };
