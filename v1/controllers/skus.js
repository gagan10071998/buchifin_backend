const { Sku } = require("../../models/skus");
const { sendResponse } = require("../../utils/sendResponse");
const { skuTypeSchema } = require("../validations/skus");

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

module.exports = { getAllGroupedBySkus, getSkuByType };
